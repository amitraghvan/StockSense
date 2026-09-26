import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggerService } from '../src/infrastructure/logging/logger.service';
import { EnvService } from '../src/config/env.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Phase 02 — Identity, Multi-Tenancy & RBAC End-to-End Tests', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const testUserAlpha = {
    name: 'Alpha Operator',
    email: `alpha_${Date.now()}@example.com`,
    password: 'Password123!@#',
    tenantName: 'Alpha Logistics Global',
  };

  const testUserBeta = {
    name: 'Beta Warehouse',
    email: `beta_${Date.now()}@example.com`,
    password: 'Password123!@#',
    tenantName: 'Beta Distribution Hub',
  };

  let tokenAlpha: string;
  let tenantAlphaId: string;

  let tokenBeta: string;
  let tenantBetaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const fastifyAdapter = new FastifyAdapter();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(fastifyAdapter);

    const envService = app.get(EnvService);
    const logger = app.get(LoggerService);

    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter(logger, envService));
    app.useGlobalInterceptors(new LoggingInterceptor(logger), new TransformInterceptor());

    prisma = app.get(PrismaService);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    // Cleanup created test users and tenants
    try {
      await prisma.user.deleteMany({
        where: {
          email: { in: [testUserAlpha.email, testUserBeta.email] },
        },
      });
    } catch {
      // Ignore cleanup error in test
    }
    await app.close();
  });

  describe('1. Registration & Authentication Lifecycle', () => {
    it('POST /api/v1/auth/signup - should register User Alpha with default workspace and admin role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: testUserAlpha,
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(testUserAlpha.email.toLowerCase());
      expect(json.data.activeTenant.name).toBe(testUserAlpha.tenantName);
      expect(json.data.activeRole.name).toBe('ADMIN');
      expect(json.data.tokens.accessToken).toBeDefined();

      tokenAlpha = json.data.tokens.accessToken;
      tenantAlphaId = json.data.activeTenant.id;
    });

    it('POST /api/v1/auth/signup - should reject duplicate email registration with 409 Conflict', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: testUserAlpha,
      });

      expect(response.statusCode).toBe(409);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('already exists');
    });

    it('POST /api/v1/auth/signup - should register User Beta with their own workspace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: testUserBeta,
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      tokenBeta = json.data.tokens.accessToken;
      tenantBetaId = json.data.activeTenant.id;

      expect(tenantBetaId).not.toEqual(tenantAlphaId);
    });

    it('POST /api/v1/auth/login - should authenticate valid credentials and issue tokens', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testUserAlpha.email,
          password: testUserAlpha.password,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.tokens.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login - should reject invalid credentials with generic 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testUserAlpha.email,
          password: 'CompletelyWrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Invalid email or password.');
    });

    it('POST /api/v1/auth/login - should reject non-existent email with generic 401 without enumeration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent_account_12345@example.com',
          password: 'AnyPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Invalid email or password.');
    });

    it('GET /api/v1/auth/me - should return current identity, active tenant, and permissions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${tokenAlpha}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.user.email).toBe(testUserAlpha.email.toLowerCase());
      expect(json.data.activeTenant.id).toBe(tenantAlphaId);
      expect(json.data.permissions).toContain('product:view');
      expect(json.data.permissions).toContain('tenant:manage');
    });
  });

  describe('2. Multi-Tenant Isolation & Cross-Tenant Boundary Tests (CRITICAL)', () => {
    it('User Beta can access their own workspace successfully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenants/active-workspace',
        headers: {
          authorization: `Bearer ${tokenBeta}`,
          'x-tenant-id': tenantBetaId,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.tenant.id).toBe(tenantBetaId);
    });

    it('User Beta MUST BE REJECTED (403 Forbidden) when attempting to access User Alpha workspace', async () => {
      // User Beta attempts to send x-tenant-id = tenantAlphaId
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenants/active-workspace',
        headers: {
          authorization: `Bearer ${tokenBeta}`,
          'x-tenant-id': tenantAlphaId,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('Access denied');
    });

    it('User Alpha with ADMIN role can access administrative settings for their workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenants/administrative-settings',
        headers: {
          authorization: `Bearer ${tokenAlpha}`,
          'x-tenant-id': tenantAlphaId,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.tenantId).toBe(tenantAlphaId);
      expect(json.data.settings.isolationMode).toBe('STRICT_ROW_LEVEL_AND_TENANT_GUARD');
    });
  });

  describe('3. OTP Password Reset Flow', () => {
    it('POST /api/v1/auth/forgot-password - should initiate OTP generation without account enumeration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: testUserAlpha.email },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.data.message).toContain('verification code has been dispatched');
    });

    it('Verify and Reset password with valid OTP', async () => {
      // Find the generated OTP hash from DB to get the test verification code
      const user = await prisma.user.findUnique({
        where: { email: testUserAlpha.email.toLowerCase() },
      });
      const latestOtpRecord = await prisma.passwordResetOtp.findFirst({
        where: { userId: user!.id, usedAt: null },
      });
      expect(latestOtpRecord).toBeDefined();

      // Attempt invalid OTP
      const invalidVerifyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-otp',
        payload: {
          email: testUserAlpha.email,
          otp: '000000',
        },
      });
      const invalidJson = JSON.parse(invalidVerifyRes.body);
      expect(invalidJson.data.valid).toBe(false);

      // Now set a known OTP hash for testing deterministic reset
      const testOtp = '888888';
      const testHash = createHash('sha256').update(testOtp).digest('hex');

      await prisma.passwordResetOtp.update({
        where: { id: latestOtpRecord!.id },
        data: { otpHash: testHash },
      });

      // Verify known OTP
      const validVerifyRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-otp',
        payload: {
          email: testUserAlpha.email,
          otp: testOtp,
        },
      });
      const validJson = JSON.parse(validVerifyRes.body);
      expect(validJson.data.valid).toBe(true);

      // Complete password reset
      const newPassword = 'NewSecretPassword456$#';
      const resetRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          email: testUserAlpha.email,
          otp: testOtp,
          newPassword,
        },
      });
      expect(resetRes.statusCode).toBe(200);

      // Confirm old password fails
      const oldLoginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testUserAlpha.email,
          password: testUserAlpha.password,
        },
      });
      expect(oldLoginRes.statusCode).toBe(401);

      // Confirm new password succeeds
      const newLoginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testUserAlpha.email,
          password: newPassword,
        },
      });
      expect(newLoginRes.statusCode).toBe(200);

      // Confirm old OTP cannot be reused
      const reuseRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          email: testUserAlpha.email,
          otp: testOtp,
          newPassword: 'AnotherPassword789!@',
        },
      });
      expect(reuseRes.statusCode).toBe(400);
    });
  });

  describe('4. Logout & Session Termination', () => {
    it('POST /api/v1/auth/logout - should terminate the active session', async () => {
      // Login with User Beta
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: testUserBeta.email,
          password: testUserBeta.password,
        },
      });
      const token = JSON.parse(loginRes.body).data.tokens.accessToken;

      // Logout
      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(logoutRes.statusCode).toBe(200);
      expect(JSON.parse(logoutRes.body).data.message).toBe('Successfully logged out.');
    });
  });
});

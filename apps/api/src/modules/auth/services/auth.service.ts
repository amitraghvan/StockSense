import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { AuditService } from '../../audit/audit.service';
import {
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
} from '@stocksense/validation';
import {
  AuthResponseData,
  AuthMeResponseData,
  TenantSummary,
  RoleSummary,
  TenantMembershipSummary,
} from '@stocksense/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers a new user identity, initializes their default workspace/tenant,
   * creates an owner/admin membership, and establishes an authenticated session.
   */
  async signup(dto: SignupInput, ip?: string, userAgent?: string): Promise<AuthResponseData> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists. Please log in.',
      );
    }

    // 2. Hash password with Argon2id
    const passwordHash = await this.passwordService.hash(dto.password);

    // 3. Generate workspace name & slug
    const tenantName = dto.tenantName?.trim() || `${dto.name.trim()}'s Workspace`;
    const baseSlug =
      tenantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'workspace';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // 4. Locate default ADMIN role
    const adminRole = await this.prisma.role.findFirst({
      where: { name: 'ADMIN', isSystem: true },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!adminRole) {
      throw new Error('System initialization error: Default ADMIN role not found.');
    }

    // 5. Execute creation within a database transaction
    const { user, tenant } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name.trim(),
          passwordHash,
          status: 'ACTIVE',
        },
      });

      const newTenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
          status: 'ACTIVE',
        },
      });

      await tx.membership.create({
        data: {
          userId: newUser.id,
          tenantId: newTenant.id,
          roleId: adminRole.id,
          status: 'ACTIVE',
        },
      });

      return { user: newUser, tenant: newTenant };
    });

    // 6. Create session
    const { sessionId, refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      tenantId: tenant.id,
      ipAddress: ip,
      userAgent,
    });

    // 7. Extract role permissions
    const permissions = adminRole.rolePermissions.map((rp) => rp.permission.key);

    // 8. Generate JWT access token
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: adminRole.name,
      permissions,
      sessionId,
    });

    // 9. Record audit event
    await this.auditService.logEvent({
      userId: user.id,
      tenantId: tenant.id,
      event: 'USER_REGISTERED',
      ipAddress: ip,
      userAgent,
      metadata: { tenantName: tenant.name, slug: tenant.slug },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      activeTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
      },
      activeRole: {
        id: adminRole.id,
        name: adminRole.name,
        description: adminRole.description,
        isSystem: adminRole.isSystem,
        permissions,
      },
      permissions,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    };
  }

  /**
   * Authenticates user credentials, resolves tenant context and role permissions,
   * creates an active session, and returns security tokens.
   */
  async login(dto: LoginInput, ip?: string, userAgent?: string): Promise<AuthResponseData> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Fetch user by email
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: true,
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      await this.auditService.logEvent({
        event: 'LOGIN_FAILED',
        ipAddress: ip,
        userAgent,
        metadata: { reason: 'user_not_found', emailAttempt: normalizedEmail },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.logEvent({
        userId: user.id,
        event: 'LOGIN_FAILED',
        ipAddress: ip,
        userAgent,
        metadata: { reason: `account_status_${user.status.toLowerCase()}` },
      });
      throw new UnauthorizedException(
        'Your account has been deactivated or suspended. Please contact support.',
      );
    }

    // 2. Verify password with Argon2id
    const isPasswordValid = await this.passwordService.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      await this.auditService.logEvent({
        userId: user.id,
        event: 'LOGIN_FAILED',
        ipAddress: ip,
        userAgent,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 3. Resolve active tenant context
    const activeMembership = user.memberships.find((m) => m.tenant.status === 'ACTIVE');

    if (!activeMembership) {
      throw new ForbiddenException(
        'You do not have an active workspace membership. Please contact an organization administrator.',
      );
    }

    const { tenant, role } = activeMembership;
    const permissions = role.rolePermissions.map((rp) => rp.permission.key);

    // 4. Establish session
    const { sessionId, refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      tenantId: tenant.id,
      ipAddress: ip,
      userAgent,
    });

    // 5. Generate access token
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: role.name,
      permissions,
      sessionId,
    });

    // 6. Record audit event
    await this.auditService.logEvent({
      userId: user.id,
      tenantId: tenant.id,
      event: 'LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      activeTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
      },
      activeRole: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions,
      },
      permissions,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  }

  /**
   * Refreshes the short-lived access token and rotates the refresh token.
   */
  async refresh(
    refreshToken: string,
    _ip?: string,
    _userAgent?: string,
  ): Promise<{
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.sessionService.validateSession(decoded.sessionId, refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: true,
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account inactive or not found.');
    }

    const membership = session.tenantId
      ? user.memberships.find((m) => m.tenantId === session.tenantId)
      : user.memberships[0];

    if (!membership || membership.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Current tenant is inactive or access revoked.');
    }

    const permissions = membership.role.rolePermissions.map((rp) => rp.permission.key);

    // Rotate refresh token
    const newRefreshToken = await this.sessionService.rotateRefreshToken(session.id, user.id);

    // Issue new access token
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: membership.tenantId,
      role: membership.role.name,
      permissions,
      sessionId: session.id,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    };
  }

  /**
   * Terminates active session.
   */
  async logout(sessionId: string, userId?: string, ip?: string, userAgent?: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);

    await this.auditService.logEvent({
      userId: userId ?? null,
      event: 'LOGOUT',
      ipAddress: ip,
      userAgent,
    });
  }

  /**
   * Initiates OTP-based password reset. Prevents account enumeration by always returning
   * a uniform success confirmation.
   */
  async forgotPassword(
    dto: ForgotPasswordInput,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const safeResponse = {
      message:
        'If an account exists with this email address, a 6-digit verification code has been dispatched.',
    };

    if (!user || user.status !== 'ACTIVE') {
      return safeResponse;
    }

    try {
      const otpResult = await this.otpService.generateOtp(user.id);
      await this.emailService.sendPasswordResetOtp(user.email, otpResult.code, user.name);

      await this.auditService.logEvent({
        userId: user.id,
        event: 'PASSWORD_RESET_REQUESTED',
        ipAddress: ip,
        userAgent,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error processing password reset for ${user.id}: ${(error as Error).message}`,
      );
    }

    return safeResponse;
  }

  /**
   * Verifies candidate OTP.
   */
  async verifyOtp(dto: VerifyOtpInput): Promise<{ valid: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      return { valid: false, message: 'Invalid or expired verification code.' };
    }

    const verification = await this.otpService.verifyOtp(user.id, dto.otp);
    return {
      valid: verification.valid,
      message:
        verification.message ??
        (verification.valid ? 'Code verified successfully.' : 'Invalid code.'),
    };
  }

  /**
   * Resets password using valid OTP, updates hash, and invalidates all existing sessions.
   */
  async resetPassword(
    dto: ResetPasswordInput,
    ip?: string,
    userAgent?: string,
  ): Promise<{ success: true; message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Verify and consume OTP atomically
    const consumed = await this.otpService.consumeOtp(user.id, dto.otp);
    if (!consumed) {
      throw new BadRequestException('Invalid, expired, or previously used verification code.');
    }

    // Validate new password complexity
    const policyResult = this.passwordService.validatePolicy(dto.newPassword);
    if (!policyResult.valid) {
      throw new BadRequestException(policyResult.error);
    }

    // Hash new password
    const newHash = await this.passwordService.hash(dto.newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Invalidate all existing sessions (critical security invariant)
    await this.sessionService.revokeAllUserSessions(user.id);

    // Record audit event
    await this.auditService.logEvent({
      userId: user.id,
      event: 'PASSWORD_RESET_COMPLETED',
      ipAddress: ip,
      userAgent,
    });

    return {
      success: true,
      message:
        'Your password has been successfully updated. Please log in with your new credentials.',
    };
  }

  /**
   * Returns current authenticated user profile, active tenant, and all memberships.
   */
  async getMe(userId: string, currentTenantId?: string): Promise<AuthMeResponseData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: true,
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const availableTenants: TenantMembershipSummary[] = user.memberships.map((m) => ({
      tenant: {
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        status: m.tenant.status,
        createdAt: m.tenant.createdAt.toISOString(),
      },
      role: {
        id: m.role.id,
        name: m.role.name,
        description: m.role.description,
        isSystem: m.role.isSystem,
        permissions: m.role.rolePermissions.map((rp) => rp.permission.key),
      },
      membershipStatus: m.status,
    }));

    const activeMembership = currentTenantId
      ? user.memberships.find((m) => m.tenantId === currentTenantId && m.status === 'ACTIVE')
      : user.memberships.find((m) => m.status === 'ACTIVE');

    let activeTenant: TenantSummary | null = null;
    let activeRole: RoleSummary | null = null;
    let permissions: string[] = [];

    if (activeMembership) {
      activeTenant = {
        id: activeMembership.tenant.id,
        name: activeMembership.tenant.name,
        slug: activeMembership.tenant.slug,
        status: activeMembership.tenant.status,
        createdAt: activeMembership.tenant.createdAt.toISOString(),
      };
      permissions = activeMembership.role.rolePermissions.map((rp) => rp.permission.key);
      activeRole = {
        id: activeMembership.role.id,
        name: activeMembership.role.name,
        description: activeMembership.role.description,
        isSystem: activeMembership.role.isSystem,
        permissions,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      activeTenant,
      activeRole,
      permissions,
      availableTenants,
    };
  }

  /**
   * Switches the active workspace/tenant context for an authenticated user.
   */
  async switchTenant(
    userId: string,
    targetTenantId: string,
    sessionId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{
    activeTenant: TenantSummary;
    activeRole: RoleSummary;
    permissions: string[];
    accessToken: string;
  }> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: targetTenantId,
        },
      },
      include: {
        tenant: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        user: true,
      },
    });

    if (!membership || membership.status !== 'ACTIVE' || membership.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Access denied. You are not an active member of this workspace.',
      );
    }

    const { tenant, role, user } = membership;
    const permissions = role.rolePermissions.map((rp) => rp.permission.key);

    // Update active tenant in current session
    await this.sessionService.updateSessionTenant(sessionId, tenant.id);

    // Generate new access token scoped to the target tenant
    const accessToken = await this.tokenService.generateAccessToken({
      sub: userId,
      email: user.email,
      tenantId: tenant.id,
      role: role.name,
      permissions,
      sessionId,
    });

    // Record audit event
    await this.auditService.logEvent({
      userId,
      tenantId: tenant.id,
      event: 'TENANT_SWITCHED',
      ipAddress: ip,
      userAgent,
      metadata: { targetTenantId, targetTenantName: tenant.name },
    });

    return {
      activeTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
      },
      activeRole: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions,
      },
      permissions,
      accessToken,
    };
  }
}

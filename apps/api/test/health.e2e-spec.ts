import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggerService } from '../src/infrastructure/logging/logger.service';
import { EnvService } from '../src/config/env.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { randomUUID } from 'crypto';

describe('StockSense API Integration & Diagnostics (e2e)', () => {
  let app: NestFastifyApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeAll(async () => {
    // Provide testing environment defaults if not set
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.APP_NAME = 'stocksense-api';
    process.env.APP_VERSION = '0.1.0';
    process.env.PORT = '4001';
    process.env.API_PREFIX = 'api/v1';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://amitkumar:@localhost:5432/stocksense_dev?schema=public';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.LOG_LEVEL = 'warn';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const fastifyAdapter = new FastifyAdapter({
      genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
        const headerReqId = req.headers['x-request-id'];
        if (headerReqId && typeof headerReqId === 'string') {
          return headerReqId;
        }
        return randomUUID();
      },
      requestIdHeader: 'x-request-id',
    });

    fastifyAdapter.getInstance().addHook('onSend', (request, reply, _payload, done) => {
      reply.header('x-request-id', request.id);
      done();
    });

    app = moduleFixture.createNestApplication<NestFastifyApplication>(fastifyAdapter);

    const logger = app.get(LoggerService);
    const envService = app.get(EnvService);
    prismaService = app.get(PrismaService);
    redisService = app.get(RedisService);

    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter(logger, envService));
    app.useGlobalInterceptors(new LoggingInterceptor(logger), new TransformInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Downstream Infrastructure Connectivity', () => {
    it('PostgreSQL connection ping must succeed with low latency', async () => {
      const dbPing = await prismaService.ping();
      expect(dbPing.status).toBe('up');
      expect(dbPing.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('Redis connection ping must succeed with low latency', async () => {
      const redisPing = await redisService.ping();
      expect(redisPing.status).toBe('up');
      expect(redisPing.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Probes', () => {
    it('GET /api/v1/health should return 200 OK with operational payload', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe('ok');
      expect(payload.service).toBe('stocksense-api');
      expect(payload.version).toBe('0.1.0');
      expect(payload.uptime).toBeGreaterThanOrEqual(0);
      expect(payload.checks).toBeDefined();
      expect(payload.checks.database.status).toBe('up');
      expect(payload.checks.redis.status).toBe('up');
    });

    it('GET /api/v1/health/live should return 200 OK liveness confirmation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/live',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe('ok');
      expect(payload.service).toBe('stocksense-api');
    });

    it('GET /api/v1/health/ready should return 200 OK readiness confirmation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe('ok');
      expect(payload.checks.database.status).toBe('up');
      expect(payload.checks.redis.status).toBe('up');
    });
  });

  describe('Request ID & Traceability', () => {
    it('should generate a correlation Request ID if not provided in client headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/live',
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect((response.headers['x-request-id'] as string).length).toBeGreaterThan(0);
    });

    it('should propagate incoming X-Request-Id header faithfully', async () => {
      const customTraceId = 'trace-stocksense-998877';
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/live',
        headers: {
          'x-request-id': customTraceId,
        },
      });

      expect(response.headers['x-request-id']).toBe(customTraceId);
    });
  });

  describe('Centralized Error Handling & Response Envelope', () => {
    it('should catch 404 routes and return structured error envelope with requestId', async () => {
      const customTraceId = 'err-trace-1234';
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/non-existent-endpoint',
        headers: {
          'x-request-id': customTraceId,
        },
      });

      expect(response.statusCode).toBe(404);
      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(false);
      expect(payload.error).toBeDefined();
      expect(payload.error.code).toBe('NOT_FOUND');
      expect(payload.error.requestId).toBe(customTraceId);
      expect(payload.error.timestamp).toBeDefined();
    });
  });
});

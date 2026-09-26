import { HealthService } from './health.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { EnvService } from '../config/env.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let prismaMock: jest.Mocked<Partial<PrismaService>>;
  let redisMock: jest.Mocked<Partial<RedisService>>;
  let envMock: jest.Mocked<Partial<EnvService>>;

  beforeEach(() => {
    prismaMock = {
      ping: jest.fn().mockResolvedValue({ status: 'up', latencyMs: 2 }),
    };

    redisMock = {
      ping: jest.fn().mockResolvedValue({ status: 'up', latencyMs: 1 }),
    };

    envMock = {
      get: jest.fn((key: string) => {
        if (key === 'APP_NAME') return 'stocksense-api';
        if (key === 'APP_VERSION') return '0.1.0';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }) as unknown as EnvService['get'],
    };

    healthService = new HealthService(
      prismaMock as PrismaService,
      redisMock as RedisService,
      envMock as EnvService,
    );
  });

  describe('getLiveness', () => {
    it('should return operational status and process metadata', () => {
      const result = healthService.getLiveness();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('stocksense-api');
      expect(result.version).toBe('0.1.0');
      expect(result.environment).toBe('test');
      expect(typeof result.uptime).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getReadiness', () => {
    it('should return isReady true and status ok when database and redis are up', async () => {
      const result = await healthService.getReadiness();
      expect(result.isReady).toBe(true);
      expect(result.response.status).toBe('ok');
      expect(result.response.checks?.database?.status).toBe('up');
      expect(result.response.checks?.redis?.status).toBe('up');
    });

    it('should return isReady false and degraded when database is down', async () => {
      prismaMock.ping = jest.fn().mockResolvedValue({
        status: 'down',
        latencyMs: 10,
        error: 'Connection refused',
      });

      const result = await healthService.getReadiness();
      expect(result.isReady).toBe(false);
      expect(result.response.status).toBe('degraded');
      expect(result.response.checks?.database?.status).toBe('down');
      expect(result.response.checks?.redis?.status).toBe('up');
    });

    it('should return isReady false and error when both database and redis are down', async () => {
      prismaMock.ping = jest.fn().mockResolvedValue({
        status: 'down',
        latencyMs: 10,
        error: 'Connection refused',
      });
      redisMock.ping = jest.fn().mockResolvedValue({
        status: 'down',
        latencyMs: 5,
        error: 'Redis offline',
      });

      const result = await healthService.getReadiness();
      expect(result.isReady).toBe(false);
      expect(result.response.status).toBe('error');
      expect(result.response.checks?.database?.status).toBe('down');
      expect(result.response.checks?.redis?.status).toBe('down');
    });
  });
});

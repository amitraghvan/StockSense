import { Injectable } from '@nestjs/common';
import { HealthResponse, OverallHealthStatus } from '@stocksense/types';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { EnvService } from '../config/env.service';

@Injectable()
export class HealthService {
  private readonly processStartTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly env: EnvService,
  ) {}

  getLiveness(): HealthResponse {
    return {
      status: 'ok',
      service: this.env.get('APP_NAME'),
      version: this.env.get('APP_VERSION'),
      environment: this.env.get('NODE_ENV'),
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.processStartTime) / 1000),
    };
  }

  async getReadiness(): Promise<{ isReady: boolean; response: HealthResponse }> {
    const dbPing = await this.prisma.ping();
    const redisPing = await this.redis.ping();

    const isDbUp = dbPing.status === 'up';
    const isRedisUp = redisPing.status === 'up';
    const isReady = isDbUp && isRedisUp;

    let overallStatus: OverallHealthStatus = 'ok';
    if (!isDbUp && !isRedisUp) {
      overallStatus = 'error';
    } else if (!isDbUp || !isRedisUp) {
      overallStatus = 'degraded';
    }

    const response: HealthResponse = {
      status: overallStatus,
      service: this.env.get('APP_NAME'),
      version: this.env.get('APP_VERSION'),
      environment: this.env.get('NODE_ENV'),
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.processStartTime) / 1000),
      checks: {
        database: {
          status: dbPing.status,
          latencyMs: dbPing.latencyMs,
          message: dbPing.error,
        },
        redis: {
          status: redisPing.status,
          latencyMs: redisPing.latencyMs,
          message: redisPing.error,
        },
      },
    };

    return { isReady, response };
  }
}

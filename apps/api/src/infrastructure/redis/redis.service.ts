import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from '../../config/env.service';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.envService.get('REDIS_URL');

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.error('Redis retry limit exceeded', undefined, 'RedisService');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack, 'RedisService');
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connection established', 'RedisService');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error(
        'Failed to establish initial Redis connection',
        error instanceof Error ? error.stack : undefined,
        'RedisService',
      );
      // In development or test, we log warning or throw depending on configuration
      if (this.envService.isProduction) {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis connection gracefully closed', 'RedisService');
      } catch (error) {
        this.logger.error(
          'Error closing Redis connection',
          error instanceof Error ? error.stack : undefined,
          'RedisService',
        );
      }
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<{ status: 'up' | 'down'; latencyMs: number; error?: string }> {
    const start = performance.now();
    if (!this.client || this.client.status !== 'ready') {
      return {
        status: 'down',
        latencyMs: 0,
        error: 'Redis client is not ready or not connected',
      };
    }

    try {
      const response = await this.client.ping();
      const latencyMs = Math.round(performance.now() - start);
      if (response === 'PONG') {
        return { status: 'up', latencyMs };
      }
      return { status: 'down', latencyMs, error: `Unexpected Redis ping response: ${response}` };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'down',
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }
}

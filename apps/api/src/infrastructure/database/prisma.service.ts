import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL connection established via Prisma', 'PrismaService');
    } catch (error) {
      this.logger.error(
        'Failed to connect to PostgreSQL database',
        error instanceof Error ? error.stack : undefined,
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('PostgreSQL connection gracefully disconnected', 'PrismaService');
    } catch (error) {
      this.logger.error(
        'Error during PostgreSQL disconnection',
        error instanceof Error ? error.stack : undefined,
        'PrismaService',
      );
    }
  }

  async ping(): Promise<{ status: 'up' | 'down'; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const latencyMs = Math.round(performance.now() - start);
      return { status: 'up', latencyMs };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'down',
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}

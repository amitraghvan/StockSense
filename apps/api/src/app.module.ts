import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule, RedisModule, HealthModule],
})
export class AppModule {}

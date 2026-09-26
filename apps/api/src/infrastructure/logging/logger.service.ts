import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { EnvService } from '../../config/env.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: pino.Logger;

  constructor(envService: EnvService) {
    const isDev = envService.isDevelopment;
    const logLevel = envService.get('LOG_LEVEL');

    this.logger = pino({
      level: logLevel,
      formatters: {
        level: (label) => ({ level: label }),
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          '*.password',
          'token',
          '*.token',
          'accessToken',
          'refreshToken',
          'otp',
          'secret',
        ],
        censor: '[REDACTED]',
      },
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: false,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      base: {
        service: envService.get('APP_NAME'),
        environment: envService.get('NODE_ENV'),
        version: envService.get('APP_VERSION'),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: string, context?: unknown) {
    if (typeof context === 'object' && context !== null) {
      this.logger.info(context, message);
    } else {
      this.logger.info({ context }, message);
    }
  }

  error(message: string, trace?: string, context?: unknown) {
    this.logger.error({ trace, context }, message);
  }

  warn(message: string, context?: unknown) {
    if (typeof context === 'object' && context !== null) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn({ context }, message);
    }
  }

  debug(message: string, context?: unknown) {
    if (typeof context === 'object' && context !== null) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug({ context }, message);
    }
  }

  verbose(message: string, context?: unknown) {
    if (typeof context === 'object' && context !== null) {
      this.logger.trace(context, message);
    } else {
      this.logger.trace({ context }, message);
    }
  }

  child(bindings: Record<string, unknown>): pino.Logger {
    return this.logger.child(bindings);
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoggerService } from '../../infrastructure/logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<FastifyRequest>();
    const response = httpCtx.getResponse<FastifyReply>();

    const requestId =
      (request.id as string) || (request.headers['x-request-id'] as string) || 'unknown';
    const method = request.method;
    const url = request.url;
    const startTime = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Math.round(performance.now() - startTime);
          const statusCode = response.statusCode;
          this.logger.log(`[HTTP] ${method} ${url} ${statusCode} - ${duration}ms`, {
            requestId,
            method,
            url,
            statusCode,
            duration,
          });
        },
        error: (err) => {
          const duration = Math.round(performance.now() - startTime);
          const statusCode = err.status || 500;
          this.logger.warn(`[HTTP ERROR] ${method} ${url} ${statusCode} - ${duration}ms`, {
            requestId,
            method,
            url,
            statusCode,
            duration,
            errorMessage: err.message,
          });
        },
      }),
    );
  }
}

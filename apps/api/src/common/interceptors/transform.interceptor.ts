import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { ApiResponse } from '@stocksense/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const requestId =
      (request.id as string) || (request.headers['x-request-id'] as string) || 'unknown';

    return next.handle().pipe(
      map((data) => {
        // If data is already an object containing status & service (like health checks) or has success: true, return as-is
        if (data && typeof data === 'object' && 'status' in data && 'service' in data) {
          return data;
        }

        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return {
          success: true,
          data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}

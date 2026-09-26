import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiErrorResponse } from '@stocksense/types';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { EnvService } from '../../config/env.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly envService: EnvService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId =
      (request.id as string) || (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal server error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          details = resObj.message;
          message = 'Validation failed';
        } else {
          message = exception.message;
        }

        const rawCode = (resObj.error as string) || this.getErrorCodeFromStatus(status);
        code = rawCode.toUpperCase().replace(/\s+/g, '_');
        if (resObj.details) {
          details = resObj.details;
        }
      }
    } else if (exception instanceof Error) {
      // In development or test, we may expose error messages for debugging, but never raw DB leaks in production
      if (!this.envService.isProduction) {
        message = exception.message;
      }
    }

    // Structured logging with correlation ID
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: status,
        errorCode: code,
      },
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details: this.envService.isProduction ? undefined : details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).send(errorPayload);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}

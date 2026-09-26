import { HttpStatus, BadRequestException, ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { EnvService } from '../../config/env.service';
import { FastifyReply, FastifyRequest } from 'fastify';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let loggerServiceMock: jest.Mocked<LoggerService>;
  let envServiceMock: jest.Mocked<EnvService>;

  beforeEach(() => {
    loggerServiceMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      child: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    envServiceMock = {
      get: jest.fn(),
      isProduction: false,
      isDevelopment: true,
      isTest: false,
    } as unknown as jest.Mocked<EnvService>;

    filter = new AllExceptionsFilter(loggerServiceMock, envServiceMock);
  });

  it('should transform BadRequestException into standardized error envelope with requestId', () => {
    const sendMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ send: sendMock });

    const hostMock = {
      switchToHttp: () => ({
        getRequest: () =>
          ({
            id: 'test-req-1234',
            method: 'POST',
            url: '/api/v1/test',
            headers: {},
          }) as unknown as FastifyRequest,
        getResponse: () =>
          ({
            status: statusMock,
          }) as unknown as FastifyReply,
      }),
    };

    const exception = new BadRequestException('Invalid payload provided');
    filter.catch(exception, hostMock as unknown as ArgumentsHost);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Invalid payload provided',
          requestId: 'test-req-1234',
        }),
      }),
    );
  });

  it('should format generic uncaught errors as 500 INTERNAL_SERVER_ERROR', () => {
    const sendMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ send: sendMock });

    const hostMock = {
      switchToHttp: () => ({
        getRequest: () =>
          ({
            id: 'test-req-5678',
            method: 'GET',
            url: '/api/v1/crash',
            headers: {},
          }) as unknown as FastifyRequest,
        getResponse: () =>
          ({
            status: statusMock,
          }) as unknown as FastifyReply,
      }),
    };

    const exception = new Error('Database connection unexpectedly dropped');
    filter.catch(exception, hostMock as unknown as ArgumentsHost);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          requestId: 'test-req-5678',
        }),
      }),
    );
  });
});

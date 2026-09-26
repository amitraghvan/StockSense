import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponse } from '@stocksense/types';

@ApiTags('Health & Observability')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Platform Health Overview',
    description: 'Returns operational status, versioning, environment metadata, and uptime.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service operational status successfully retrieved.',
  })
  async getHealth(): Promise<HealthResponse> {
    const { response } = await this.healthService.getReadiness();
    return response;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process Liveness Probe',
    description: 'Confirms whether the application process is running and alive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process is alive.',
  })
  getLiveness(): HealthResponse {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Infrastructure Readiness Probe',
    description:
      'Verifies downstream infrastructure dependencies (PostgreSQL and Redis) are connected and healthy.',
  })
  @ApiResponse({
    status: 200,
    description: 'All downstream dependencies are connected and ready to serve traffic.',
  })
  @ApiResponse({
    status: 503,
    description: 'One or more downstream dependencies are unavailable.',
  })
  async getReadiness(): Promise<HealthResponse> {
    const { isReady, response } = await this.healthService.getReadiness();
    if (!isReady) {
      throw new ServiceUnavailableException(response);
    }
    return response;
  }
}

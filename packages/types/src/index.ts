/**
 * StockSense Core Shared Types
 * Phase 01: Production Engineering Foundation
 */

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type HealthCheckStatus = 'up' | 'down';

export interface HealthCheckDetail {
  status: HealthCheckStatus;
  latencyMs?: number;
  message?: string;
}

export type OverallHealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthResponse {
  status: OverallHealthStatus;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  checks?: {
    database?: HealthCheckDetail;
    redis?: HealthCheckDetail;
    [key: string]: HealthCheckDetail | undefined;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * StockSense Core Shared Types
 * Phase 01: Production Engineering Foundation
 * Phase 02: Identity, Authentication, Authorization & Multi-Tenant Foundation
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

// ==============================================================================
// Phase 02: Identity, Multi-Tenancy & Access Control Contracts
// ==============================================================================

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface TenantMembershipSummary {
  tenant: TenantSummary;
  role: RoleSummary;
  membershipStatus: MembershipStatus;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthResponseData {
  user: UserProfile;
  activeTenant: TenantSummary;
  activeRole: RoleSummary;
  permissions: string[];
  tokens: AuthTokens;
}

export interface AuthMeResponseData {
  user: UserProfile;
  activeTenant: TenantSummary | null;
  activeRole: RoleSummary | null;
  permissions: string[];
  availableTenants: TenantMembershipSummary[];
}

export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  tenantId?: string; // current active tenant
  role?: string;
  permissions?: string[];
  sessionId: string;
}

export interface JwtRefreshPayload {
  sub: string; // userId
  sessionId: string;
}

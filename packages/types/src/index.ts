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

// ==============================================================================
// Phase 03: Inventory Master Data Types
// ==============================================================================

export type CategoryStatusType = 'ACTIVE' | 'INACTIVE';
export type ProductStatusType = 'ACTIVE' | 'INACTIVE';
export type WarehouseStatusType = 'ACTIVE' | 'INACTIVE';
export type LocationStatusType = 'ACTIVE' | 'INACTIVE';

export type UnitOfMeasureType =
  'PCS' | 'KG' | 'G' | 'L' | 'ML' | 'BOX' | 'PACK' | 'SET' | 'PAIR' | 'M' | 'CM' | 'UNIT';

export const UOM_DISPLAY_NAMES: Record<UnitOfMeasureType, string> = {
  PCS: 'Pieces',
  KG: 'Kilograms',
  G: 'Grams',
  L: 'Liters',
  ML: 'Milliliters',
  BOX: 'Boxes',
  PACK: 'Packs',
  SET: 'Sets',
  PAIR: 'Pairs',
  M: 'Meters',
  CM: 'Centimeters',
  UNIT: 'Units',
};

export interface CategorySummary {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: CategoryStatusType;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitOfMeasure: UnitOfMeasureType;
  barcode: string | null;
  costPrice: number | null;
  salePrice: number | null;
  reorderLevel: number | null;
  reorderQty: number | null;
  status: ProductStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSummary {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  description: string | null;
  status: WarehouseStatusType;
  locationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationSummary {
  id: string;
  tenantId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  name: string;
  shortCode: string;
  description: string | null;
  status: LocationStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLocationSummary {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  locationShortCode: string;
  warehouseName: string;
  createdAt: string;
}

// ==============================================================================
// Phase 04: Receipts & Incoming Inventory Operations Types
// ==============================================================================

export type ReceiptStatusType = 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';

export interface ReceiptLineSummary {
  id: string;
  receiptId: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  locationShortCode: string;
  quantity: number;
  unitOfMeasure?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptSummary {
  id: string;
  tenantId: string;
  reference: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  supplierName: string;
  contactPerson: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  scheduleDate: string;
  status: ReceiptStatusType;
  notes: string | null;
  lineCount?: number;
  lines?: ReceiptLineSummary[];
  isLate?: boolean;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBalanceSummary {
  id: string;
  tenantId: string;
  productId: string;
  productSku: string;
  productName: string;
  locationId: string;
  locationName: string;
  locationShortCode: string;
  warehouseName: string;
  quantityOnHand: number;
  updatedAt: string;
}

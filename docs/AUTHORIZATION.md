# StockSense — Authorization Architecture

> Phase 02: Role-Based Access Control (RBAC)

---

## Table of Contents

- [Overview](#overview)
- [RBAC Data Model](#rbac-data-model)
- [System Roles](#system-roles)
- [Permission Keys](#permission-keys)
- [RBAC Permission Matrix](#rbac-permission-matrix)
- [Guards Architecture](#guards-architecture)
- [Using Permissions in Code](#using-permissions-in-code)

---

## Overview

StockSense implements a granular Role-Based Access Control (RBAC) system where:

- **Permissions** are atomic capability keys (e.g., `product:view`, `receipt:create`)
- **Roles** aggregate permissions into logical groups (e.g., `ADMIN`, `WAREHOUSE_STAFF`)
- **Memberships** bind a User to a Tenant with a specific Role
- **Guards** enforce permission checks at the API endpoint level

The system supports both **system-wide roles** (seeded at startup) and
future **tenant-scoped custom roles** (stored with `tenantId`).

---

## RBAC Data Model

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│   User   │────▸│  Membership  │────▸│   Tenant   │
└──────────┘     │  (userId,    │     └────────────┘
                 │   tenantId,  │
                 │   roleId)    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────┐     ┌─────────────────┐     ┌──────────────┐
                 │   Role   │────▸│ RolePermission   │────▸│  Permission  │
                 └──────────┘     │ (roleId,         │     │  (key,       │
                                  │  permissionId)   │     │   module)    │
                                  └─────────────────┘     └──────────────┘
```

**Key constraints:**

- A User can belong to **multiple Tenants** via separate Memberships
- Each Membership grants exactly **one Role** within that Tenant
- `Membership` has a **unique constraint** on `(userId, tenantId)` — one role per tenant
- System roles have `tenantId = null` and `isSystem = true`

---

## System Roles

Six system roles are seeded on database initialization:

| Role                | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `SUPER_ADMIN`       | Unrestricted platform-wide access (all 24 permissions)             |
| `ADMIN`             | Full workspace administration + inventory control (23 permissions) |
| `INVENTORY_MANAGER` | Catalog, receipts, deliveries, stock operations (18 permissions)   |
| `WAREHOUSE_MANAGER` | Physical storage, transfers, warehouse config (16 permissions)     |
| `WAREHOUSE_STAFF`   | Day-to-day picking, packing, bin stocking (10 permissions)         |
| `VIEWER`            | Read-only inspection across all modules (8 permissions)            |

---

## Permission Keys

24 granular permissions organized by module:

### Product Module

| Key              | Description                                |
| ---------------- | ------------------------------------------ |
| `product:view`   | View products, categories, and SKU details |
| `product:create` | Create new products and SKU records        |
| `product:update` | Update existing product information        |
| `product:delete` | Delete or archive product catalog entries  |

### Operation Module

| Key                   | Description                                 |
| --------------------- | ------------------------------------------- |
| `receipt:view`        | View inbound receipts and vendor deliveries |
| `receipt:create`      | Draft new inbound receipt records           |
| `receipt:validate`    | Validate and receive stock into warehouse   |
| `delivery:view`       | View outbound deliveries and dispatches     |
| `delivery:create`     | Draft new outbound delivery records         |
| `delivery:validate`   | Validate and dispatch outgoing goods        |
| `transfer:view`       | View internal stock transfers               |
| `transfer:create`     | Draft internal warehouse transfer orders    |
| `transfer:validate`   | Validate stock movements between bins       |
| `adjustment:view`     | View inventory count adjustments            |
| `adjustment:create`   | Draft stock count variance adjustments      |
| `adjustment:validate` | Apply inventory balance corrections         |

### Warehouse & Stock Module

| Key                | Description                              |
| ------------------ | ---------------------------------------- |
| `warehouse:view`   | View warehouses, aisles, racks, and bins |
| `warehouse:manage` | Create, modify, and configure warehouses |
| `stock:view`       | Inspect live stock balances              |

### Report Module

| Key            | Description                         |
| -------------- | ----------------------------------- |
| `reports:view` | Generate and view inventory reports |

### Administration Module

| Key             | Description                                     |
| --------------- | ----------------------------------------------- |
| `tenant:manage` | Configure tenant profile and workspace settings |
| `user:manage`   | Invite, manage, and assign roles to users       |
| `role:manage`   | Manage permissions and workspace roles          |
| `audit:view`    | Inspect identity and operational audit logs     |

---

## RBAC Permission Matrix

| Permission            | SUPER_ADMIN | ADMIN | INV_MGR | WH_MGR | WH_STAFF | VIEWER |
| --------------------- | :---------: | :---: | :-----: | :----: | :------: | :----: |
| `product:view`        |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `product:create`      |     ✅      |  ✅   |   ✅    |   —    |    —     |   —    |
| `product:update`      |     ✅      |  ✅   |   ✅    |   —    |    —     |   —    |
| `product:delete`      |     ✅      |  ✅   |   ✅    |   —    |    —     |   —    |
| `receipt:view`        |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `receipt:create`      |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   —    |
| `receipt:validate`    |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   —    |
| `delivery:view`       |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `delivery:create`     |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   —    |
| `delivery:validate`   |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   —    |
| `transfer:view`       |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `transfer:create`     |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   —    |
| `transfer:validate`   |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   —    |
| `adjustment:view`     |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `adjustment:create`   |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   —    |
| `adjustment:validate` |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   —    |
| `warehouse:view`      |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `warehouse:manage`    |     ✅      |  ✅   |    —    |   ✅   |    —     |   —    |
| `stock:view`          |     ✅      |  ✅   |   ✅    |   ✅   |    ✅    |   ✅   |
| `reports:view`        |     ✅      |  ✅   |   ✅    |   ✅   |    —     |   ✅   |
| `tenant:manage`       |     ✅      |  ✅   |    —    |   —    |    —     |   —    |
| `user:manage`         |     ✅      |  ✅   |    —    |   —    |    —     |   —    |
| `role:manage`         |     ✅      |  ✅   |    —    |   —    |    —     |   —    |
| `audit:view`          |     ✅      |  ✅   |    —    |   —    |    —     |   —    |

---

## Guards Architecture

Three guards enforce access control at the API layer:

### 1. JwtAuthGuard (Global)

**File:** `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`

- Registered globally in `app.module.ts` via `APP_GUARD`
- Extracts Bearer token from `Authorization` header or `stocksense_access_token` cookie
- Validates JWT signature and expiry
- Verifies user existence and `ACTIVE` status
- Checks session validity via Redis (fallback: PostgreSQL)
- Respects `@Public()` decorator to skip authentication

### 2. TenantGuard (Per-Route)

**File:** `apps/api/src/modules/auth/guards/tenant.guard.ts`

- Applied via `@UseTenantGuard()` decorator
- Reads tenant context from `X-Tenant-Id` header or JWT `tenantId` claim
- Verifies the authenticated user has an **active Membership** in the target tenant
- Returns `403 Forbidden` for cross-tenant access attempts
- Injects resolved `tenantId` and `membership` into the request

### 3. PermissionsGuard (Per-Route)

**File:** `apps/api/src/modules/auth/guards/permissions.guard.ts`

- Applied via `@RequirePermissions('perm:key', ...)` decorator
- Resolves the user's role for the active tenant via their Membership
- Fetches all permission keys bound to that role
- Checks that **all** required permissions are present
- Returns `403 Forbidden` if any required permission is missing

---

## Using Permissions in Code

### Protecting an Endpoint

```typescript
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('products')
export class ProductsController {

  @Get()
  @RequirePermissions('product:view')
  findAll() { ... }

  @Post()
  @RequirePermissions('product:create')
  create(@Body() dto: CreateProductDto) { ... }

  @Delete(':id')
  @RequirePermissions('product:delete')
  remove(@Param('id') id: string) { ... }
}
```

### Frontend Permission Checks

```typescript
import { usePermissions } from '@/providers/auth-provider';

function ProductActions() {
  const { hasPermission } = usePermissions();

  return (
    <>
      {hasPermission('product:create') && <CreateButton />}
      {hasPermission('product:delete') && <DeleteButton />}
    </>
  );
}
```

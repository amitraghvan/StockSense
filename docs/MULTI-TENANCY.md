# StockSense — Multi-Tenancy Architecture

> Phase 02: Workspace Isolation & Tenant Foundation

---

## Overview

StockSense is designed as a multi-tenant SaaS platform where each **Tenant**
represents an isolated workspace (organization). Users can belong to multiple
tenants via **Memberships**, each granting a specific role within that workspace.

---

## Data Model

```
User (1) ──▸ (N) Membership (N) ◂── (1) Tenant
                    │
                    └── roleId → Role
```

- A **User** is a unique human identity across the platform
- A **Tenant** is an isolated organization/workspace
- A **Membership** binds a User to a Tenant with one Role
- Constraint: `UNIQUE(userId, tenantId)` — one membership per user per tenant

---

## Tenant Lifecycle

### Creation (During Signup)

When a user signs up with a `workspaceName`:

1. A `Tenant` record is created with a kebab-case `slug`
2. The `ADMIN` system role is assigned
3. A `Membership` is created linking the user to the new tenant
4. The tenant becomes the user's active workspace

### Tenant Switching

Users with multiple memberships can switch workspaces:

```
POST /api/v1/auth/switch-tenant
Body: { tenantId: "uuid" }
```

1. Verify the user has an active Membership in the target tenant
2. Update the Session's `tenantId` to the target tenant
3. Update the Redis session cache
4. Return new access token with updated `tenantId` claim
5. Log `TENANT_SWITCHED` audit event

---

## Server-Side Tenant Isolation

### TenantGuard

**File:** `apps/api/src/modules/auth/guards/tenant.guard.ts`

The `TenantGuard` enforces server-side tenant boundaries:

1. Reads tenant ID from `X-Tenant-Id` header or JWT `tenantId` claim
2. Queries the user's Membership for the specified tenant
3. Verifies Membership status is `ACTIVE`
4. Verifies Tenant status is `ACTIVE`
5. Denies with `403 Forbidden` if any check fails

**Cross-tenant access is impossible** — even if a user constructs a request
with another tenant's ID, the guard verifies membership existence.

### Cache Isolation (Future)

Redis keys are namespaced by tenant:

```
tenant:{tenantId}:products:list
tenant:{tenantId}:warehouses:list
tenant:{tenantId}:config
```

This ensures cached data from one tenant never leaks to another.

---

## Frontend Tenant Context

### AuthProvider

The `useCurrentTenant()` hook provides:

```typescript
const { tenant, switchTenant, tenants } = useCurrentTenant();

// tenant: { id, name, slug, status }
// tenants: all workspaces the user belongs to
// switchTenant(tenantId): switches active workspace
```

### API Client Header Injection

`apiClient` automatically injects `X-Tenant-Id` on every request:

```typescript
if (this.tenantId) {
  headers['X-Tenant-Id'] = this.tenantId;
}
```

### Workspace Switcher (Header)

The header component displays a workspace dropdown allowing users to switch
between their tenant memberships without re-authenticating.

---

## Integration Test Coverage

The `auth-and-tenancy.e2e-spec.ts` test suite verifies:

- ✅ Signup creates User + Tenant + Membership automatically
- ✅ Authenticated user can access own tenant's resources
- ✅ Cross-tenant access is denied with 403 Forbidden
- ✅ TenantGuard blocks requests with invalid/foreign tenant IDs
- ✅ PermissionsGuard works within tenant context

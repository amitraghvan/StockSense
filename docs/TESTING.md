# StockSense — Testing Architecture & Strategy

**Phase 01: Production Engineering Foundation**  
**Tools:** Jest, ts-jest, Supertest, Fastify Inject, Playwright

---

## 1. Testing Philosophy

In StockSense, testing is a first-class architectural concern:

- **No Mock-Only Delusions**: Tests verify real interactions against live databases and caches.
- **No Fake Tests**: Tests like `expect(true).toBe(true)` are strictly forbidden.
- **Fast Feedback**: Unit tests run in under 1 second; integration tests run against ephemeral or live local dependencies in under 3 seconds.

---

## 2. Test Suites

### 2.1 Backend Unit Tests

**Location:** `apps/api/src/**/*.spec.ts`  
**Execution:** `pnpm test:unit`

Validates:

1. Environment schema validation rules (valid configs pass; missing URLs, bad ports, and malformed strings fail fast).
2. Global exception filter formatting (transforms HttpExceptions and generic errors into standard `{ success: false, error: { code, message, requestId } }`).
3. HealthService logic (liveness calculation, readiness calculation with mocked up/down dependencies).

### 2.2 Backend Integration & E2E Tests

**Location:** `apps/api/test/**/*.e2e-spec.ts`  
**Execution:** `pnpm test:integration`

Validates against real running instances of PostgreSQL and Redis:

1. PostgreSQL connection ping via Prisma `$queryRaw` returning low latency.
2. Redis connection ping via ioredis `ping()` returning `PONG`.
3. `GET /api/v1/health` returning 200 OK and complete operational metadata.
4. `GET /api/v1/health/live` returning 200 OK.
5. `GET /api/v1/health/ready` returning 200 OK.
6. Automatic correlation `X-Request-Id` generation if not supplied.
7. Faithful propagation of incoming `X-Request-Id` header into response headers.
8. Unmapped 404 routes handled via global filter with standard JSON error response and request ID.

### 2.3 Frontend Smoke & E2E Tests

**Location:** `apps/web/e2e/smoke.spec.ts`  
**Execution:** `pnpm test:e2e`

Validates:

1. Next.js App Router renders application shell without runtime hydration errors.
2. Sidebar navigation, header, theme toggle, and status cards are present and interactive.

---

## 3. Running Tests

```bash
# Run all unit tests
pnpm test:unit

# Run backend integration tests (requires PostgreSQL & Redis active)
pnpm test:integration

# Run frontend E2E smoke tests
pnpm test:e2e
```

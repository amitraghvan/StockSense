# StockSense — Security Architecture

> Phase 02: Security Controls & Audit Framework

---

## Password Security

| Control           | Implementation                         |
| ----------------- | -------------------------------------- |
| Hashing algorithm | Argon2id (memory-hard, GPU-resistant)  |
| Memory cost       | 64 MB per hash                         |
| Time cost         | 3 iterations                           |
| Parallelism       | 4 lanes                                |
| Complexity policy | 8+ chars, upper, lower, digit, special |
| Plaintext storage | Never — hashed before persistence      |

---

## Token Security

| Control            | Implementation                         |
| ------------------ | -------------------------------------- |
| Access token TTL   | 15 minutes                             |
| Refresh token TTL  | 7 days                                 |
| Signing algorithm  | HS256 (symmetric)                      |
| Refresh rotation   | New token pair on every refresh call   |
| Token hash storage | SHA-256 of refresh token in PostgreSQL |
| Cookie attributes  | `SameSite=Lax`, `max-age=604800`       |

---

## OTP Brute-Force Protection

| Control         | Implementation                         |
| --------------- | -------------------------------------- |
| OTP length      | 6 digits (crypto random)               |
| Max attempts    | 5 per OTP record before lockout        |
| OTP TTL         | 10 minutes                             |
| Resend cooldown | 60 seconds                             |
| Single-use      | Marked `usedAt` after successful reset |
| Storage         | SHA-256 hash (never plaintext)         |
| Comparison      | Timing-safe equality                   |

---

## Session Security

| Control            | Implementation                           |
| ------------------ | ---------------------------------------- |
| Multi-device       | Each login creates a unique session      |
| Session revocation | Logout revokes single session            |
| Password reset     | Revokes ALL sessions (force re-login)    |
| Redis caching      | Fast session lookup; PostgreSQL fallback |
| IP + UserAgent     | Tracked per session for forensics        |

---

## Tenant Isolation

| Control            | Implementation                            |
| ------------------ | ----------------------------------------- |
| Server-side guard  | TenantGuard verifies active Membership    |
| Cross-tenant block | 403 Forbidden for unauthorized tenants    |
| Cache namespacing  | `tenant:{id}:*` key prefix                |
| Data model         | Membership unique on `(userId, tenantId)` |

---

## Audit Logging

### Identity Audit Events

| Event                      | When                                  |
| -------------------------- | ------------------------------------- |
| `USER_REGISTERED`          | Successful signup                     |
| `LOGIN_SUCCESS`            | Successful login                      |
| `LOGIN_FAILED`             | Invalid credentials                   |
| `LOGOUT`                   | User-initiated logout                 |
| `PASSWORD_RESET_REQUESTED` | Forgot-password OTP dispatched        |
| `PASSWORD_RESET_COMPLETED` | Password successfully changed via OTP |
| `TENANT_SWITCHED`          | User switched active workspace        |

### Audit Log Schema

```
IdentityAuditLog {
  id        UUID
  userId    FK → users (nullable, SetNull on delete)
  tenantId  FK → tenants (nullable, SetNull on delete)
  event     VARCHAR(100)
  ipAddress VARCHAR(100)
  userAgent VARCHAR(500)
  metadata  JSONB (sanitized — never contains secrets)
  createdAt TIMESTAMP
}
```

### Secret Redaction

The `AuditService` automatically sanitizes metadata before logging:

- Removes `password`, `passwordHash`, `token`, `otp`, `secret` fields
- Removes `authorization` headers
- Ensures no sensitive data reaches audit storage

---

## API Security

| Control             | Implementation                                        |
| ------------------- | ----------------------------------------------------- |
| Global auth guard   | `JwtAuthGuard` via `APP_GUARD`                        |
| Public route escape | `@Public()` decorator + reflector                     |
| Input validation    | `class-validator` DTOs on all endpoints               |
| Error sanitization  | `AllExceptionsFilter` — no stack traces in production |
| Correlation IDs     | `X-Request-Id` on every request                       |
| Structured logging  | Pino JSON logs with redacted sensitive data           |
| CORS                | Configured in Fastify adapter                         |

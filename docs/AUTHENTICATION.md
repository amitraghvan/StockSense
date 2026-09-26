# StockSense — Authentication Architecture

> Phase 02: Identity, Authentication & Session Management

---

## Table of Contents

- [Overview](#overview)
- [Password Hashing](#password-hashing)
- [Password Policy](#password-policy)
- [JWT Token Design](#jwt-token-design)
- [Session Management](#session-management)
- [Refresh Token Rotation](#refresh-token-rotation)
- [OTP Password Reset](#otp-password-reset)
- [Authentication Flows](#authentication-flows)

---

## Overview

StockSense uses a stateful JWT-based authentication system combining short-lived
access tokens with long-lived refresh tokens backed by PostgreSQL session records
and Redis session caching.

**Key Design Principles:**

- Passwords are never stored in plaintext — Argon2id with memory-hard parameters
- JWT access tokens are short-lived (15 minutes) to minimize exposure window
- Refresh tokens are long-lived (7 days) and stored as SHA-256 hashes in PostgreSQL
- Sessions are cached in Redis for fast validation on every request
- OTP-based password reset uses SHA-256 hashed 6-digit codes with brute-force protection

---

## Password Hashing

**Algorithm:** Argon2id (winner of the Password Hashing Competition)

**Implementation:** `apps/api/src/modules/auth/services/password.service.ts`

Argon2id is a hybrid algorithm combining:

- **Argon2d** — Data-dependent memory access (GPU-resistant)
- **Argon2i** — Data-independent memory access (side-channel resistant)

**Parameters:**

| Parameter   | Value            | Rationale                             |
| ----------- | ---------------- | ------------------------------------- |
| Memory cost | 65536 KB (64 MB) | High memory usage defeats GPU attacks |
| Time cost   | 3 iterations     | Balances security vs. login latency   |
| Parallelism | 4 lanes          | Matches typical server CPU cores      |

---

## Password Policy

**Implementation:** `PasswordService.validatePasswordComplexity()`

| Rule              | Requirement                     |
| ----------------- | ------------------------------- |
| Minimum length    | 8 characters                    |
| Uppercase letter  | At least 1                      |
| Lowercase letter  | At least 1                      |
| Digit             | At least 1                      |
| Special character | At least 1 (`!@#$%^&*()_+-=[]{} | ;':\",./<>?`) |

The frontend signup form displays real-time password strength indicators matching
these server-side rules.

---

## JWT Token Design

**Implementation:** `apps/api/src/modules/auth/services/token.service.ts`

### Access Token

| Property | Value                                                                     |
| -------- | ------------------------------------------------------------------------- |
| Type     | JWT (HS256)                                                               |
| TTL      | 15 minutes                                                                |
| Payload  | `{ sub: userId, tenantId, sessionId }`                                    |
| Delivery | `Authorization: Bearer <token>` header + `stocksense_access_token` cookie |

### Refresh Token

| Property | Value                                         |
| -------- | --------------------------------------------- |
| Type     | JWT (HS256)                                   |
| TTL      | 7 days                                        |
| Payload  | `{ sub: userId, sessionId, type: 'refresh' }` |
| Storage  | SHA-256 hash stored in `sessions.token_hash`  |
| Delivery | JSON response body only                       |

### Token Separation

- Access tokens are used for every API request. Short TTL limits damage from token theft.
- Refresh tokens are only sent to `/api/v1/auth/refresh`. They are never stored in localStorage — the client keeps them in memory.
- Cookie sync (`stocksense_access_token`) allows Next.js `middleware.ts` to perform server-side route protection without exposing the token to JavaScript.

---

## Session Management

**Implementation:** `apps/api/src/modules/auth/services/session.service.ts`

### Multi-Device Sessions

Each login creates a new `Session` record in PostgreSQL:

```
Session {
  id:         UUID
  userId:     FK → users.id
  tenantId:   FK → tenants.id (nullable, set on tenant switch)
  tokenHash:  SHA-256(refresh_token) — unique index
  userAgent:  Browser/device identifier
  ipAddress:  Client IP address
  expiresAt:  7 days from creation
  revokedAt:  Set on logout or password reset
}
```

### Redis Session Cache

On login and refresh, session data is written to Redis:

```
Key:    session:{sessionId}
Value:  JSON { userId, tenantId, userAgent, ipAddress }
TTL:    Same as refresh token (7 days)
```

The `JwtAuthGuard` checks Redis first for fast validation. If the Redis entry is
missing (cache miss), it falls back to PostgreSQL.

### Session Lifecycle

| Event          | Action                                            |
| -------------- | ------------------------------------------------- |
| Login          | Create Session + Redis entry                      |
| Refresh        | Rotate refresh token, update Session.tokenHash    |
| Logout         | Set Session.revokedAt, delete Redis entry         |
| Password Reset | Revoke ALL user sessions, flush all Redis entries |
| Tenant Switch  | Update Session.tenantId + Redis entry             |

---

## Refresh Token Rotation

On every `/api/v1/auth/refresh` call:

1. Validate the incoming refresh token JWT signature and expiry
2. Lookup the session by `sessionId` from JWT payload
3. Verify the refresh token hash matches `sessions.token_hash`
4. Verify the session is not revoked (`revokedAt IS NULL`)
5. Generate a new access token + refresh token pair
6. Update the session's `tokenHash` to the new refresh token hash
7. Update the Redis cache with refreshed session data
8. Return the new token pair

**Security benefit:** Even if an old refresh token is intercepted, it becomes
invalid after the next rotation. If an attacker attempts to use the old token,
the session is invalidated (since the hash won't match).

---

## OTP Password Reset

**Implementation:** `apps/api/src/modules/auth/services/otp.service.ts`

### OTP Lifecycle

```
User → POST /forgot-password { email }
  → Generate 6-digit cryptographically random OTP
  → SHA-256 hash the OTP (never store plaintext)
  → Create PasswordResetOtp record
  → Send OTP via email (ConsoleEmailProvider in dev)
  → Return success (always, even if email not found — timing-safe)

User → POST /verify-otp { email, otp }
  → Find latest non-used, non-expired OTP record for user
  → SHA-256 hash the submitted OTP
  → Timing-safe comparison against stored hash
  → Increment attempt counter
  → Return { valid: true/false }

User → POST /reset-password { email, otp, newPassword }
  → Re-verify OTP (same as verify-otp)
  → Validate new password complexity
  → Hash new password with Argon2id
  → Update user.passwordHash
  → Mark OTP record as used (usedAt = now)
  → Revoke ALL active sessions (force re-login)
  → Clear all Redis session entries
  → Log PASSWORD_RESET_COMPLETED audit event
```

### Brute-Force Protection

| Protection           | Value                                  |
| -------------------- | -------------------------------------- |
| OTP length           | 6 digits (1M combinations)             |
| Max attempts per OTP | 5 before lockout                       |
| OTP TTL              | 10 minutes                             |
| Resend cooldown      | 60 seconds between requests            |
| OTP is single-use    | Marked `usedAt` after successful reset |
| Hash storage         | SHA-256 (never stores plaintext OTP)   |
| Timing-safe compare  | Prevents timing-based enumeration      |

---

## Authentication Flows

### Signup Flow

```
POST /api/v1/auth/signup
  Body: { name, email, password, workspaceName }

  1. Validate email uniqueness
  2. Validate password complexity
  3. Hash password (Argon2id)
  4. Create User record (status: ACTIVE)
  5. Create Tenant record from workspaceName (slug: kebab-case)
  6. Fetch ADMIN system role
  7. Create Membership (User ↔ Tenant ↔ ADMIN role)
  8. Create Session + Redis cache
  9. Generate access + refresh token pair
  10. Log USER_REGISTERED audit event
  11. Return { user, tokens, tenant }
```

### Login Flow

```
POST /api/v1/auth/login
  Body: { email, password }

  1. Find user by email
  2. Verify user status is ACTIVE
  3. Compare password hash (Argon2id verify)
  4. Find user's first active membership + tenant
  5. Create Session + Redis cache
  6. Generate access + refresh token pair
  7. Log LOGIN_SUCCESS audit event (or LOGIN_FAILED)
  8. Return { user, tokens, tenant }
```

### Logout Flow

```
POST /api/v1/auth/logout
  Header: Authorization: Bearer <access_token>

  1. Extract sessionId from JWT
  2. Revoke session (set revokedAt)
  3. Delete Redis session entry
  4. Log LOGOUT audit event
```

# StockSense — Environment Configuration Guide

**Module:** `@stocksense/validation`  
**Schema Implementation:** Zod Strong Parsing with Fail-Fast Startup Validation

---

## 1. Overview & Security Policy

All environment variables used by StockSense are validated strictly before the process boots. If any required variable is missing or improperly formatted, the system aborts immediately with a structured diagnostic message.

### Core Security Rules

1. **Never commit `.env`**: Only `.env.example` belongs in version control.
2. **No Insecure Defaults in Production**: Weak passwords or fallback keys are explicitly rejected in production mode.
3. **Fail Fast**: Misconfigured instances fail to start during deployment rather than crashing in the middle of serving user requests.

---

## 2. Variables Specification

| Variable Name         | Type    | Allowed Values                                     | Default (Dev)                  | Description                               |
| :-------------------- | :------ | :------------------------------------------------- | :----------------------------- | :---------------------------------------- |
| `NODE_ENV`            | String  | `development`, `test`, `production`                | `development`                  | Active runtime environment mode           |
| `APP_NAME`            | String  | Alphanumeric string                                | `stocksense`                   | Service identifier in logs and traces     |
| `APP_VERSION`         | String  | SemVer string                                      | `0.1.0`                        | Application release version               |
| `PORT`                | Integer | `1` - `65535`                                      | `4000`                         | Port for Fastify HTTP server              |
| `HOST`                | String  | Valid IP / hostname                                | `0.0.0.0`                      | Network binding interface                 |
| `API_PREFIX`          | String  | URI path string                                    | `api/v1`                       | Global prefix for all REST routes         |
| `DATABASE_URL`        | URL     | Valid PostgreSQL connection string                 | _Required_                     | Connection string to PostgreSQL instance  |
| `REDIS_URL`           | URL     | Valid Redis connection string                      | _Required_                     | Connection string to Redis cache/store    |
| `CORS_ORIGIN`         | String  | Comma-delimited URLs or `*`                        | `http://localhost:3000`        | Allowed origins for cross-origin requests |
| `LOG_LEVEL`           | String  | `fatal`, `error`, `warn`, `info`, `debug`, `trace` | `info`                         | Minimum log level for Pino logger         |
| `RATE_LIMIT_TTL`      | Integer | Seconds                                            | `60`                           | Rate limiting sliding window duration     |
| `RATE_LIMIT_MAX`      | Integer | Count                                              | `100`                          | Max requests allowed in sliding window    |
| `NEXT_PUBLIC_API_URL` | URL     | Valid HTTP URL                                     | `http://localhost:4000/api/v1` | API base URL accessed by the browser      |

---

## 3. Environment Specific Differences

### Development (`NODE_ENV=development`)

- Pretty-printed logs enabled (`pino-pretty`).
- CORS origin relaxed to match local development hosts.
- Swagger UI available at `/docs`.
- Error responses include validation issue lists.

### Production (`NODE_ENV=production`)

- JSON formatted structured logs.
- Helmet enforces strict Content Security Policy.
- CORS restricted strictly to authorized production domains.
- Internal database error messages masked to prevent information disclosure.

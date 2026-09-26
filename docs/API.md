# StockSense — API Specification & Protocols

**API Version:** `v1`  
**Base URL:** `http://localhost:4000/api/v1`  
**OpenAPI / Swagger Documentation:** `http://localhost:4000/docs`

---

## 1. Protocol Standards

### 1.1 Correlation & Request Tracing

Every request to the API is stamped with a unique correlation ID:

- If the client supplies `X-Request-Id`, the API preserves and adopts it.
- If omitted, the API generates a RFC 4122 UUID v4.
- The ID is echoed in the response header `X-Request-Id` and attached to all structured logs.

### 1.2 Standard Success Response Envelope

All standard data responses wrap their output in the following structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "25c51b66-21cb-445e-874a-3742488f2867",
    "timestamp": "2026-09-26T08:50:15.930Z",
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### 1.3 Standard Error Response Envelope

All exceptions (both expected 4xx and uncaught 5xx) produce an envelope:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ],
    "requestId": "25c51b66-21cb-445e-874a-3742488f2867",
    "timestamp": "2026-09-26T08:50:15.930Z"
  }
}
```

---

## 2. Endpoints (Phase 01)

### 2.1 System Health Overview

- **Method:** `GET`
- **Path:** `/api/v1/health`
- **Description:** Returns operational state, versioning, environment, uptime, and downstream dependency checks.
- **Status:** `200 OK`

```json
{
  "status": "ok",
  "service": "stocksense",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-09-26T08:50:15.930Z",
  "uptime": 86,
  "checks": {
    "database": {
      "status": "up",
      "latencyMs": 23
    },
    "redis": {
      "status": "up",
      "latencyMs": 0
    }
  }
}
```

### 2.2 Process Liveness Probe

- **Method:** `GET`
- **Path:** `/api/v1/health/live`
- **Description:** Lightweight probe used by container orchestrators (e.g. Kubernetes, Docker) to confirm the Node.js process is alive.
- **Status:** `200 OK`

```json
{
  "status": "ok",
  "service": "stocksense",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-09-26T08:51:04.171Z",
  "uptime": 134
}
```

### 2.3 Infrastructure Readiness Probe

- **Method:** `GET`
- **Path:** `/api/v1/health/ready`
- **Description:** Deep health check testing active connections to PostgreSQL and Redis.
- **Status:**
  - `200 OK`: All dependencies connected and responsive.
  - `503 Service Unavailable`: One or more dependencies failed ping check.

```json
{
  "status": "ok",
  "service": "stocksense",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-09-26T08:51:04.183Z",
  "uptime": 134,
  "checks": {
    "database": {
      "status": "up",
      "latencyMs": 1
    },
    "redis": {
      "status": "up",
      "latencyMs": 0
    }
  }
}
```

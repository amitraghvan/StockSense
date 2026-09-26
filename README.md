# StockSense — Production Engineering Foundation

> Enterprise Inventory Management System & SaaS Platform  
> **Phase 01: Production Engineering Foundation**

---

## 1. What is StockSense?

StockSense is an inventory management SaaS platform designed for high-throughput multi-warehouse operations, real-time stock balance tracking, stock ledger audits, receipts, delivery orders, internal transfers, low-stock alerting, and operational dashboards.

**Phase 01 Boundary**: This phase establishes the production-grade engineering foundation (modular monolith architecture, high-throughput NestJS/Fastify API, Next.js 15 App Router web shell, PostgreSQL/Prisma connection pooling, Redis caching, structured Pino logging, correlation request IDs, and CI/CD pipelines). Actual business domain logic (Products, Warehouses, Operations, Ledger) is strictly deferred to Phase 02+ to preserve architectural integrity.

---

## 2. Architecture

StockSense is architected as a **Modular Monolith**:

- Starts as a single deployable unit to avoid premature microservices overhead and distributed transaction fallibility.
- Maintains strict internal module boundaries so that high-load modules (e.g. Analytics, Notifications) can be horizontally split into independent microservices in later phases without refactoring.

```
Web Client (Next.js 15 App Router)
               │
               ▼ HTTP / JSON
API Gateway & Router (NestJS + Fastify /api/v1)
               │
  ┌────────────┴────────────┐
  │ Cross-Cutting Concerns  │
  │ • Helmet / Strict CORS  │
  │ • Request Correlation ID│
  │ • AllExceptionsFilter   │
  │ • Pino Structured Logger│
  └────────────┬────────────┘
               │
   ┌───────────┴───────────┐
   │ Infrastructure Layer  │
   │ • PrismaService (PG)  │
   │ • RedisService        │
   │ • Config / Validation │
   └───────────┬───────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
PostgreSQL 14+        Redis 7+
```

---

## 3. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui foundation, TanStack Query v5, React Hook Form, Zod
- **Backend**: NestJS 11, Fastify engine, TypeScript strict mode, OpenAPI / Swagger
- **Database & Cache**: PostgreSQL 14+, Prisma ORM, Redis 7+ (`ioredis`)
- **Observability**: Pino structured logger, correlation request IDs, OpenTelemetry-ready
- **Quality & CI**: TypeScript strict mode, ESLint (flat config), Prettier, Husky pre-commit hooks, lint-staged, Jest, Supertest, Playwright, GitHub Actions

---

## 4. Repository Structure

```
stocksense/
├── apps/
│   ├── web/                     # Next.js 15 App Router frontend application
│   │   ├── e2e/                 # Playwright smoke and end-to-end tests
│   │   └── src/
│   │       ├── app/             # App router pages, layouts, loading, errors
│   │       ├── components/      # Application shell, header, sidebar
│   │       ├── lib/             # Centralized typed API client
│   │       └── providers/       # TanStack Query & Theme providers
│   │
│   └── api/                     # NestJS + Fastify backend API
│       ├── prisma/              # Prisma schema & migration history
│       ├── src/
│       │   ├── common/          # Filters, interceptors, decorators, pipes
│       │   ├── config/          # Environment service & fail-fast validator
│       │   ├── health/          # Liveness & readiness endpoints
│       │   ├── infrastructure/  # Database (Prisma), Redis, Pino Logger
│       │   └── main.ts          # Fastify bootstrap & Swagger setup
│       └── test/                # Supertest integration tests
│
├── packages/
│   ├── types/                   # Shared TypeScript API contracts & models
│   ├── validation/              # Shared Zod schemas (env, pagination)
│   ├── ui/                      # Shared reusable UI component library
│   ├── config/                  # Shared TypeScript compiler configurations
│   └── eslint-config/           # Shared linting configurations
│
├── infrastructure/
│   ├── docker/                  # Multi-stage production Dockerfiles
│   └── scripts/                 # Environment verification & migration scripts
│
├── docs/                        # Complete architecture & operations documentation
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── ENVIRONMENT.md
│   ├── TESTING.md
│   ├── API.md
│   ├── PHASE-01-AUDIT.md
│   └── PHASE-01-REPORT.md
│
├── .github/workflows/ci.yml     # Zero-regression GitHub Actions pipeline
├── docker-compose.yml           # Local PostgreSQL & Redis infrastructure
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── tsconfig.json                # Root TypeScript configuration
└── .env.example                 # Validated environment configuration template
```

---

## 5. Prerequisites

- **Node.js**: `v22.18.0` or higher
- **pnpm**: `v10.33.0` or higher
- **PostgreSQL**: `v14` or higher (via Docker Compose or local service)
- **Redis**: `v7` or higher (via Docker Compose or local service)
- **Docker & Docker Compose** (optional for local containerized infrastructure)

---

## 6. Installation & Quick Start

```bash
# 1. Clone the repository
git clone <repo_url> stocksense
cd stocksense

# 2. Install monorepo dependencies
pnpm install

# 3. Create your local environment configuration
cp .env.example .env

# 4. Start infrastructure (PostgreSQL & Redis)
docker compose up -d

# 5. Generate Prisma Client and apply migrations
pnpm db:generate
pnpm db:migrate:dev

# 6. Start development servers
pnpm dev
```

The web dashboard will be available at **http://localhost:3000** and the API at **http://localhost:4000/api/v1**.  
Interactive Swagger documentation is available at **http://localhost:4000/docs**.

---

## 7. Development Commands

| Command                  | Description                                          |
| :----------------------- | :--------------------------------------------------- |
| `pnpm dev`               | Run both web and API services concurrently           |
| `pnpm dev:api`           | Run API server with hot reloading                    |
| `pnpm dev:web`           | Run Next.js web application                          |
| `pnpm build`             | Compile all packages and applications for production |
| `pnpm typecheck`         | Run TypeScript strict check across the monorepo      |
| `pnpm lint`              | Run ESLint across all files                          |
| `pnpm lint:fix`          | Fix autofixable lint issues                          |
| `pnpm format`            | Format entire codebase with Prettier                 |
| `pnpm format:check`      | Check code formatting compliance                     |
| `pnpm test`              | Run all test suites                                  |
| `pnpm test:unit`         | Run API unit tests                                   |
| `pnpm test:integration`  | Run API integration tests against live DB & Redis    |
| `pnpm db:generate`       | Regenerate Prisma client                             |
| `pnpm db:migrate:dev`    | Create & apply migrations in development             |
| `pnpm db:migrate:deploy` | Deploy migrations in staging/production              |

---

## 8. Health & Observability Endpoints

- **`GET /api/v1/health`**: Overall system operational status, versioning, environment, uptime, and database/redis status.
- **`GET /api/v1/health/live`**: Process liveness probe confirming Node.js process is active.
- **`GET /api/v1/health/ready`**: Infrastructure readiness probe verifying PostgreSQL and Redis connections.
- **`GET /docs`**: Interactive OpenAPI Swagger documentation interface.

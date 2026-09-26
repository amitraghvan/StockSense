# StockSense — Development Guide

**Target Audience:** Software Engineers, Backend/Frontend Developers, DevOps  
**Baseline Environment:** Node.js 22+, pnpm 10.33+, PostgreSQL 14+, Redis 7+

---

## 1. Quick Start

### 1.1 Clone & Setup

```bash
# Clone the repository
git clone <repository_url> stocksense
cd stocksense

# Install all monorepo dependencies
pnpm install

# Initialize local environment configuration
cp .env.example .env
```

### 1.2 Start Local Infrastructure

You can start PostgreSQL and Redis via Docker Compose:

```bash
docker compose up -d
```

_Or, if running Homebrew services natively on macOS:_

```bash
brew services start postgresql@14
brew services start redis
```

### 1.3 Apply Database Migrations

```bash
# Generate Prisma Client & apply baseline migration
pnpm db:generate
pnpm db:migrate:dev
```

### 1.4 Launch Development Servers

```bash
# Run both Backend API and Frontend Web concurrently:
pnpm dev

# Or launch independently in separate terminals:
pnpm dev:api   # API starts at http://localhost:4000/api/v1 (Docs at /docs)
pnpm dev:web   # Web starts at http://localhost:3000
```

---

## 2. Monorepo Scripts Reference

All primary development scripts are mapped at the root `package.json`:

| Command                  | Action                                             |
| :----------------------- | :------------------------------------------------- |
| `pnpm dev`               | Starts all apps in watch mode concurrently         |
| `pnpm dev:api`           | Starts NestJS API with hot reload                  |
| `pnpm dev:web`           | Starts Next.js development server                  |
| `pnpm build`             | Compiles all packages and apps for production      |
| `pnpm typecheck`         | Runs TypeScript strict check across all packages   |
| `pnpm lint`              | Runs ESLint across all files                       |
| `pnpm lint:fix`          | Automatically fixes autofixable ESLint issues      |
| `pnpm format`            | Formats all code with Prettier                     |
| `pnpm format:check`      | Validates formatting consistency                   |
| `pnpm test`              | Runs unit & integration test suites                |
| `pnpm test:unit`         | Executes Jest unit tests in `apps/api`             |
| `pnpm test:integration`  | Executes Jest E2E tests against PostgreSQL & Redis |
| `pnpm db:generate`       | Regenerates Prisma Client from schema              |
| `pnpm db:migrate:dev`    | Creates and applies migrations in development      |
| `pnpm db:migrate:deploy` | Safely applies pending migrations in production    |

---

## 3. Database Migration Workflow

### Development

When you modify `apps/api/prisma/schema.prisma`:

```bash
# 1. Create a migration and apply it to dev database
pnpm db:migrate:dev --name your_migration_name

# 2. Prisma will automatically regenerate client types
```

### Production

In CI/CD or production containers, never run `migrate dev` or `db push`. Run:

```bash
pnpm db:migrate:deploy
```

---

## 4. Git Commit Conventions & Hooks

StockSense enforces **Conventional Commits** using Husky and lint-staged.

Format:
`<type>(<scope>): <short description>`

Allowed types:

- `feat`: New feature or foundation capability
- `fix`: Bug fix
- `refactor`: Code reorganization without functional changes
- `docs`: Documentation updates
- `test`: Adding or updating tests
- `chore`: Build tooling, dependency, or configuration changes
- `ci`: CI/CD workflow updates

Every `git commit` triggers `.husky/pre-commit`, running lint-staged to format files automatically.

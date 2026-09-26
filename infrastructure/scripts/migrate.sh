#!/usr/bin/env bash
set -e

# StockSense Safe Database Migration Runner
# Usage:
#   ./infrastructure/scripts/migrate.sh [dev|deploy|generate]

MODE=${1:-deploy}

echo "Running Prisma migration workflow in mode: $MODE"

case $MODE in
  dev)
    echo "Applying migrations in development mode..."
    pnpm --filter @stocksense/api prisma migrate dev
    ;;
  deploy)
    echo "Deploying pending migrations safely in production/staging mode..."
    pnpm --filter @stocksense/api prisma migrate deploy
    ;;
  generate)
    echo "Regenerating Prisma client..."
    pnpm --filter @stocksense/api prisma generate
    ;;
  *)
    echo "Unknown mode: $MODE. Allowed modes: dev, deploy, generate"
    exit 1
    ;;
esac

echo "Database migration workflow completed successfully."

#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "StockSense — Environment & Infrastructure Verification"
echo "=========================================================="

echo -n "Checking Node.js... "
if command -v node >/dev/null 2>&1; then
  echo "OK ($(node -v))"
else
  echo "FAILED (Node.js is not installed)"
  exit 1
fi

echo -n "Checking pnpm... "
if command -v pnpm >/dev/null 2>&1; then
  echo "OK ($(pnpm -v))"
else
  echo "FAILED (pnpm is not installed)"
  exit 1
fi

echo -n "Checking .env file... "
if [ -f ".env" ]; then
  echo "OK (.env found)"
else
  echo "WARNING (.env not found, using .env.example baseline)"
fi

echo "=========================================================="
echo "Infrastructure verification complete."
echo "=========================================================="

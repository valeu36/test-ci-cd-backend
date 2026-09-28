#!/usr/bin/env bash
#
# Boots a REAL backend for the frontend Playwright suite (and manual curl
# poking): .env.testing, the test Postgres in Docker (tmpfs, disposable),
# migrations, then `nest start` in the foreground so Playwright's webServer
# owns the process.
#
# Idempotent: every step is a no-op when already done. Re-running after
# `npm run docker:test:down` (tmpfs wiped) rebuilds everything from scratch.
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[e2e-serve] $*" >&2; }

bash scripts/ensure-env-testing.sh

log "Starting the test Postgres"
npm run -s docker:test:up >&2

log "Running migrations"
npm run -s migration:run:test >&2

log "Starting backend"
exec env NODE_ENV=testing npx nest start

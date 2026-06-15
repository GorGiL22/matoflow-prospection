#!/usr/bin/env bash
set -euo pipefail

# Sur Vercel, prisma generate est fait dans vercel-build (schéma PostgreSQL)
if [ -n "${VERCEL:-}" ]; then
  exit 0
fi

export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

npx prisma generate

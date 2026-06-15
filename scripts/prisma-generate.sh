#!/usr/bin/env bash
set -euo pipefail

# Vercel Postgres expose POSTGRES_PRISMA_URL, pas DATABASE_URL
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
fi

if [ -z "${DIRECT_URL:-}" ] && [ -n "${POSTGRES_URL_NON_POOLING:-}" ]; then
  export DIRECT_URL="$POSTGRES_URL_NON_POOLING"
fi

# prisma generate ne se connecte pas à la DB — placeholder si install sans .env
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
fi

if [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

npx prisma generate

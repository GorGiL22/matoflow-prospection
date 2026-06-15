#!/usr/bin/env bash
set -euo pipefail

# Vercel Postgres expose POSTGRES_PRISMA_URL, pas DATABASE_URL
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
fi

if [ -z "${DIRECT_URL:-}" ] && [ -n "${POSTGRES_URL_NON_POOLING:-}" ]; then
  export DIRECT_URL="$POSTGRES_URL_NON_POOLING"
fi

if [ -z "${DIRECT_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur : DATABASE_URL manquant." >&2
  echo "Ajoutez Vercel Postgres (Storage → Postgres) ou définissez DATABASE_URL dans les variables d'environnement Vercel." >&2
  exit 1
fi

npx prisma generate
npx prisma migrate deploy
npx next build

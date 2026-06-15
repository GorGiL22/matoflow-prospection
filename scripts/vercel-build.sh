#!/usr/bin/env bash
set -euo pipefail

# URL pooled pour le runtime Prisma (serverless)
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
fi

# URL directe pour les migrations (obligatoire — pas de pooler / PgBouncer)
if [ -z "${DIRECT_URL:-}" ] && [ -n "${POSTGRES_URL_NON_POOLING:-}" ]; then
  export DIRECT_URL="$POSTGRES_URL_NON_POOLING"
fi
if [ -z "${DIRECT_URL:-}" ] && [ -n "${POSTGRES_URL:-}" ]; then
  export DIRECT_URL="$POSTGRES_URL"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur : DATABASE_URL manquant." >&2
  echo "Ajoutez Vercel Postgres (Storage → Postgres) ou définissez DATABASE_URL." >&2
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "Erreur : DIRECT_URL manquant (connexion directe requise pour les migrations)." >&2
  echo "Vercel Postgres : POSTGRES_URL_NON_POOLING ou POSTGRES_URL" >&2
  echo "Neon : URL sans « -pooler » dans le host" >&2
  exit 1
fi

# Schéma SQLite en local, PostgreSQL sur Vercel
node scripts/patch-schema-postgres.mjs

npx prisma generate

# Les migrations ne supportent pas le pooler (advisory lock P1002)
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy

npx next build

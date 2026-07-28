#!/usr/bin/env bash
# Applique les colonnes manquantes sur SQLite local (migrations Prisma ciblent PostgreSQL).
set -euo pipefail

DB="${1:-prisma/dev.db}"

if [ ! -f "$DB" ]; then
  echo "Base introuvable : $DB" >&2
  exit 1
fi

run_sql() {
  sqlite3 "$DB" "$1" 2>/dev/null || true
}

run_sql 'ALTER TABLE CampaignEmail ADD COLUMN resendEmailId TEXT;'
run_sql 'ALTER TABLE CampaignEmail ADD COLUMN bouncedAt DATETIME;'
run_sql 'CREATE UNIQUE INDEX IF NOT EXISTS CampaignEmail_resendEmailId_key ON CampaignEmail(resendEmailId);'

run_sql 'ALTER TABLE PhoneListItem ADD COLUMN appele BOOLEAN NOT NULL DEFAULT 0;'
run_sql 'ALTER TABLE PhoneListItem ADD COLUMN dateAppel DATETIME;'
run_sql 'CREATE INDEX IF NOT EXISTS PhoneListItem_listId_appele_idx ON PhoneListItem(listId, appele);'

run_sql 'ALTER TABLE Prospect ADD COLUMN ffpWpId TEXT;'
run_sql 'ALTER TABLE Prospect ADD COLUMN ffpSlug TEXT;'
run_sql "ALTER TABLE Prospect ADD COLUMN categorie TEXT NOT NULL DEFAULT 'PAYSAGISTE';"
run_sql 'CREATE UNIQUE INDEX IF NOT EXISTS Prospect_ffpWpId_key ON Prospect(ffpWpId);'
run_sql 'CREATE UNIQUE INDEX IF NOT EXISTS Prospect_ffpSlug_key ON Prospect(ffpSlug);'
run_sql 'CREATE INDEX IF NOT EXISTS Prospect_categorie_idx ON Prospect(categorie);'

run_sql 'ALTER TABLE Prospect ADD COLUMN emailDesabonne BOOLEAN NOT NULL DEFAULT 0;'
run_sql 'ALTER TABLE Prospect ADD COLUMN emailDesabonneAt DATETIME;'
run_sql 'CREATE INDEX IF NOT EXISTS Prospect_emailDesabonne_idx ON Prospect(emailDesabonne);'

echo "Schéma SQLite synchronisé : $DB"

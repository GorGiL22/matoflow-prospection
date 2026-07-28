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

# CRM Partenaires
run_sql 'CREATE TABLE IF NOT EXISTS Partner (
  id TEXT PRIMARY KEY NOT NULL,
  nom TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '"'"'AUTRE'"'"',
  siteWeb TEXT,
  linkedinEntreprise TEXT,
  linkedinDirigeant TEXT,
  nomDirigeant TEXT,
  fonctionDirigeant TEXT,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  zone TEXT,
  departementsCouverture TEXT,
  tailleEstimee TEXT,
  description TEXT,
  servicesProposes TEXT,
  hasApi BOOLEAN,
  scoreEtoiles INTEGER,
  analyseIA TEXT,
  partnershipKind TEXT,
  statut TEXT NOT NULL DEFAULT '"'"'DECOUVERT'"'"',
  sourceRecherche TEXT,
  domaineNormalise TEXT,
  nomNormalise TEXT,
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateModification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);'
run_sql 'CREATE UNIQUE INDEX IF NOT EXISTS Partner_domaineNormalise_key ON Partner(domaineNormalise);'
run_sql 'CREATE INDEX IF NOT EXISTS Partner_statut_idx ON Partner(statut);'
run_sql 'CREATE INDEX IF NOT EXISTS Partner_type_idx ON Partner(type);'
run_sql 'CREATE INDEX IF NOT EXISTS Partner_scoreEtoiles_idx ON Partner(scoreEtoiles);'
run_sql 'CREATE INDEX IF NOT EXISTS Partner_dateCreation_idx ON Partner(dateCreation);'
run_sql 'CREATE INDEX IF NOT EXISTS Partner_nomNormalise_idx ON Partner(nomNormalise);'

run_sql 'CREATE TABLE IF NOT EXISTS PartnerNote (
  id TEXT PRIMARY KEY NOT NULL,
  partnerId TEXT NOT NULL,
  contenu TEXT NOT NULL,
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partnerId) REFERENCES Partner(id) ON DELETE CASCADE
);'
run_sql 'CREATE INDEX IF NOT EXISTS PartnerNote_partnerId_dateCreation_idx ON PartnerNote(partnerId, dateCreation);'

run_sql 'CREATE TABLE IF NOT EXISTS PartnerActivite (
  id TEXT PRIMARY KEY NOT NULL,
  partnerId TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT,
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partnerId) REFERENCES Partner(id) ON DELETE CASCADE
);'
run_sql 'CREATE INDEX IF NOT EXISTS PartnerActivite_partnerId_dateCreation_idx ON PartnerActivite(partnerId, dateCreation);'

run_sql 'CREATE TABLE IF NOT EXISTS PartnerOutreachDraft (
  id TEXT PRIMARY KEY NOT NULL,
  partnerId TEXT NOT NULL,
  emailSubject TEXT,
  emailBody TEXT,
  linkedinMessage TEXT,
  arguments TEXT,
  questionsRdv TEXT,
  objections TEXT,
  dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateModification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partnerId) REFERENCES Partner(id) ON DELETE CASCADE
);'
run_sql 'CREATE INDEX IF NOT EXISTS PartnerOutreachDraft_partnerId_dateCreation_idx ON PartnerOutreachDraft(partnerId, dateCreation);'

run_sql 'CREATE TABLE IF NOT EXISTS PartnerSearchJob (
  id TEXT PRIMARY KEY NOT NULL,
  zone TEXT NOT NULL,
  types TEXT NOT NULL DEFAULT '"'"'[]'"'"',
  status TEXT NOT NULL DEFAULT '"'"'running'"'"',
  config TEXT NOT NULL DEFAULT '"'"'{}'"'"',
  results TEXT NOT NULL DEFAULT '"'"'[]'"'"',
  logs TEXT NOT NULL DEFAULT '"'"'[]'"'"',
  progress TEXT,
  errorMessage TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);'
run_sql 'CREATE INDEX IF NOT EXISTS PartnerSearchJob_status_createdAt_idx ON PartnerSearchJob(status, createdAt);'
run_sql 'CREATE INDEX IF NOT EXISTS PartnerSearchJob_zone_status_idx ON PartnerSearchJob(zone, status);'

echo "Schéma SQLite synchronisé : $DB"

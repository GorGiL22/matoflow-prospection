-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StatutProspect" AS ENUM ('NOUVEAU', 'CONTACTE', 'RELANCE', 'INTERESSE', 'CHAUD', 'RDV', 'CLIENT', 'REFUSE');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignContentMode" AS ENUM ('AI', 'GENERIC');

-- CreateEnum
CREATE TYPE "CampaignEmailStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED', 'OPENED', 'REPLIED');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "nomEntreprise" TEXT NOT NULL,
    "siret" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "siteWeb" TEXT,
    "ville" TEXT,
    "description" TEXT,
    "avisGoogle" INTEGER NOT NULL DEFAULT 0,
    "scoreIA" INTEGER,
    "statut" "StatutProspect" NOT NULL DEFAULT 'NOUVEAU',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "siretNormalise" TEXT,
    "emailNormalise" TEXT,
    "domaineSite" TEXT,
    "unepId" TEXT,
    "unepSlug" TEXT,
    "detailsScoreIA" TEXT,
    "emailGenere" TEXT,
    "linkedinGenere" TEXT,
    "scriptAppelGenere" TEXT,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activite" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationIA" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "criteres" TEXT NOT NULL,
    "analyseSite" TEXT,
    "versionModele" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualificationIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnepSearchJob" (
    "id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "config" TEXT NOT NULL,
    "results" TEXT NOT NULL DEFAULT '[]',
    "logs" TEXT NOT NULL DEFAULT '[]',
    "progress" TEXT,
    "stepsState" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "resume" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnepSearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "contentMode" "CampaignContentMode" NOT NULL DEFAULT 'AI',
    "genericSubjectTemplate" TEXT,
    "genericBodyTemplate" TEXT,
    "dailyLimit" INTEGER NOT NULL DEFAULT 25,
    "minDelayMinutes" INTEGER NOT NULL DEFAULT 5,
    "maxDelayMinutes" INTEGER NOT NULL DEFAULT 15,
    "sentTodayCount" INTEGER NOT NULL DEFAULT 0,
    "sentTodayDate" TEXT,
    "lastSentAt" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEmail" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "personalizationHook" TEXT,
    "analysisSummary" TEXT,
    "statut" "CampaignEmailStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_siretNormalise_key" ON "Prospect"("siretNormalise");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_emailNormalise_key" ON "Prospect"("emailNormalise");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_domaineSite_key" ON "Prospect"("domaineSite");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_unepId_key" ON "Prospect"("unepId");

-- CreateIndex
CREATE INDEX "Prospect_statut_idx" ON "Prospect"("statut");

-- CreateIndex
CREATE INDEX "Prospect_scoreIA_idx" ON "Prospect"("scoreIA");

-- CreateIndex
CREATE INDEX "Prospect_dateCreation_idx" ON "Prospect"("dateCreation");

-- CreateIndex
CREATE INDEX "Prospect_unepSlug_idx" ON "Prospect"("unepSlug");

-- CreateIndex
CREATE INDEX "Note_prospectId_dateCreation_idx" ON "Note"("prospectId", "dateCreation");

-- CreateIndex
CREATE INDEX "Activite_prospectId_dateCreation_idx" ON "Activite"("prospectId", "dateCreation");

-- CreateIndex
CREATE INDEX "QualificationIA_prospectId_dateCreation_idx" ON "QualificationIA"("prospectId", "dateCreation");

-- CreateIndex
CREATE INDEX "UnepSearchJob_status_createdAt_idx" ON "UnepSearchJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UnepSearchJob_area_status_idx" ON "UnepSearchJob"("area", "status");

-- CreateIndex
CREATE INDEX "EmailCampaign_statut_idx" ON "EmailCampaign"("statut");

-- CreateIndex
CREATE INDEX "CampaignEmail_campaignId_statut_idx" ON "CampaignEmail"("campaignId", "statut");

-- CreateIndex
CREATE INDEX "CampaignEmail_statut_scheduledAt_idx" ON "CampaignEmail"("statut", "scheduledAt");

-- CreateIndex
CREATE INDEX "CampaignEmail_prospectId_idx" ON "CampaignEmail"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignEmail_campaignId_prospectId_key" ON "CampaignEmail"("campaignId", "prospectId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationIA" ADD CONSTRAINT "QualificationIA_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEmail" ADD CONSTRAINT "CampaignEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEmail" ADD CONSTRAINT "CampaignEmail_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;


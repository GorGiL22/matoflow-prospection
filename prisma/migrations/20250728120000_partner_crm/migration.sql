-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('COOPERATIVE', 'CABINET_COMPTABLE', 'CONSULTANT', 'REVENDEUR', 'DISTRIBUTEUR', 'PEPINIERE', 'FOURNISSEUR', 'ORGANISME_SAP', 'CENTRE_FORMATION', 'FEDERATION', 'RESEAU_PRO', 'AUTRE');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('DECOUVERT', 'A_CONTACTER', 'PREMIER_CONTACT', 'RENDEZ_VOUS', 'EN_DISCUSSION', 'PARTENARIAT_SIGNE', 'REFUS', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "PartnershipKind" AS ENUM ('APPORTEUR_AFFAIRES', 'REVENDEUR', 'INTEGRATION_API', 'STRATEGIQUE', 'OFFRE_ADHERENTS', 'CO_MARKETING');

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'AUTRE',
    "siteWeb" TEXT,
    "linkedinEntreprise" TEXT,
    "linkedinDirigeant" TEXT,
    "nomDirigeant" TEXT,
    "fonctionDirigeant" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "zone" TEXT,
    "departementsCouverture" TEXT,
    "tailleEstimee" TEXT,
    "description" TEXT,
    "servicesProposes" TEXT,
    "hasApi" BOOLEAN,
    "scoreEtoiles" INTEGER,
    "analyseIA" TEXT,
    "partnershipKind" "PartnershipKind",
    "statut" "PartnerStatus" NOT NULL DEFAULT 'DECOUVERT',
    "sourceRecherche" TEXT,
    "domaineNormalise" TEXT,
    "nomNormalise" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerNote" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerActivite" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerActivite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOutreachDraft" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "linkedinMessage" TEXT,
    "arguments" TEXT,
    "questionsRdv" TEXT,
    "objections" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOutreachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSearchJob" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "types" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'running',
    "config" TEXT NOT NULL DEFAULT '{}',
    "results" TEXT NOT NULL DEFAULT '[]',
    "logs" TEXT NOT NULL DEFAULT '[]',
    "progress" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_domaineNormalise_key" ON "Partner"("domaineNormalise");

-- CreateIndex
CREATE INDEX "Partner_statut_idx" ON "Partner"("statut");

-- CreateIndex
CREATE INDEX "Partner_type_idx" ON "Partner"("type");

-- CreateIndex
CREATE INDEX "Partner_scoreEtoiles_idx" ON "Partner"("scoreEtoiles");

-- CreateIndex
CREATE INDEX "Partner_dateCreation_idx" ON "Partner"("dateCreation");

-- CreateIndex
CREATE INDEX "Partner_nomNormalise_idx" ON "Partner"("nomNormalise");

-- CreateIndex
CREATE INDEX "PartnerNote_partnerId_dateCreation_idx" ON "PartnerNote"("partnerId", "dateCreation");

-- CreateIndex
CREATE INDEX "PartnerActivite_partnerId_dateCreation_idx" ON "PartnerActivite"("partnerId", "dateCreation");

-- CreateIndex
CREATE INDEX "PartnerOutreachDraft_partnerId_dateCreation_idx" ON "PartnerOutreachDraft"("partnerId", "dateCreation");

-- CreateIndex
CREATE INDEX "PartnerSearchJob_status_createdAt_idx" ON "PartnerSearchJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerSearchJob_zone_status_idx" ON "PartnerSearchJob"("zone", "status");

-- AddForeignKey
ALTER TABLE "PartnerNote" ADD CONSTRAINT "PartnerNote_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerActivite" ADD CONSTRAINT "PartnerActivite_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOutreachDraft" ADD CONSTRAINT "PartnerOutreachDraft_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

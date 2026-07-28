-- CreateEnum
CREATE TYPE "ProspectCategorie" AS ENUM ('PAYSAGISTE', 'CONCEPTEUR_FFP');

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN "ffpWpId" TEXT,
ADD COLUMN "ffpSlug" TEXT,
ADD COLUMN "categorie" "ProspectCategorie" NOT NULL DEFAULT 'PAYSAGISTE';

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_ffpWpId_key" ON "Prospect"("ffpWpId");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_ffpSlug_key" ON "Prospect"("ffpSlug");

-- CreateIndex
CREATE INDEX "Prospect_categorie_idx" ON "Prospect"("categorie");

-- CreateIndex
CREATE INDEX "Prospect_ffpSlug_idx" ON "Prospect"("ffpSlug");

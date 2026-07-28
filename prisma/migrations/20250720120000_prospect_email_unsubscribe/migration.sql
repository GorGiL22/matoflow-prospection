-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN "emailDesabonne" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Prospect" ADD COLUMN "emailDesabonneAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Prospect_emailDesabonne_idx" ON "Prospect"("emailDesabonne");

-- AlterEnum
ALTER TYPE "CampaignEmailStatus" ADD VALUE IF NOT EXISTS 'BOUNCED' AFTER 'FAILED';

-- AlterTable
ALTER TABLE "CampaignEmail" ADD COLUMN IF NOT EXISTS "resendEmailId" TEXT;
ALTER TABLE "CampaignEmail" ADD COLUMN IF NOT EXISTS "bouncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignEmail_resendEmailId_key" ON "CampaignEmail"("resendEmailId");

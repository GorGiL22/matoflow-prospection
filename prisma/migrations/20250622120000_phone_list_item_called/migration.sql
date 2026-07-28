-- AlterTable
ALTER TABLE "PhoneListItem" ADD COLUMN "appele" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PhoneListItem" ADD COLUMN "dateAppel" DATETIME;

-- CreateIndex
CREATE INDEX "PhoneListItem_listId_appele_idx" ON "PhoneListItem"("listId", "appele");

-- CreateTable
CREATE TABLE "PhoneList" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "prospectId" TEXT,
    "nomEntreprise" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "ville" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneList_dateCreation_idx" ON "PhoneList"("dateCreation");

-- CreateIndex
CREATE INDEX "PhoneListItem_listId_dateAjout_idx" ON "PhoneListItem"("listId", "dateAjout");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneListItem_listId_prospectId_key" ON "PhoneListItem"("listId", "prospectId");

-- AddForeignKey
ALTER TABLE "PhoneListItem" ADD CONSTRAINT "PhoneListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PhoneList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneListItem" ADD CONSTRAINT "PhoneListItem_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DiningTable" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'free',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "partyId" TEXT,
    "seatedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiningTable_partyId_key" ON "DiningTable"("partyId");

-- CreateIndex
CREATE INDEX "DiningTable_outletId_sortOrder_idx" ON "DiningTable"("outletId", "sortOrder");

-- CreateIndex
CREATE INDEX "DiningTable_outletId_status_idx" ON "DiningTable"("outletId", "status");

-- AddForeignKey
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

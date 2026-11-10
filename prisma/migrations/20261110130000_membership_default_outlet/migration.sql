-- AlterTable
ALTER TABLE "Membership" ADD COLUMN "defaultOutletId" TEXT;

-- CreateIndex
CREATE INDEX "Membership_defaultOutletId_idx" ON "Membership"("defaultOutletId");

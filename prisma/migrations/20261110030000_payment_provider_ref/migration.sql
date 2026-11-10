-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "providerRef" TEXT;

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

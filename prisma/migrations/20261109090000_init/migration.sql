-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SG',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "whatsappUsed" INTEGER NOT NULL DEFAULT 0,
    "seatingsUsed" INTEGER NOT NULL DEFAULT 0,
    "usageMonth" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'test',
    "cardLast4" TEXT,
    "failureReason" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "lunchStart" TEXT NOT NULL DEFAULT '11:00',
    "lunchEnd" TEXT NOT NULL DEFAULT '15:00',
    "dinnerStart" TEXT NOT NULL DEFAULT '17:00',
    "dinnerEnd" TEXT NOT NULL DEFAULT '22:00',
    "activeSession" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "guestName" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "positionLink" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outletId" TEXT NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Payment_organizationId_createdAt_idx" ON "Payment"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Party_token_key" ON "Party"("token");

-- CreateIndex
CREATE INDEX "Party_outletId_status_idx" ON "Party"("outletId", "status");

-- CreateIndex
CREATE INDEX "Party_outletId_joinedAt_idx" ON "Party"("outletId", "joinedAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

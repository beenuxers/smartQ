import { prisma } from "./db";
import { getPlan } from "./pricing";

function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function ensureUsageMonth(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  const key = currentMonthKey();
  if (org.usageMonth === key) return org;

  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      usageMonth: key,
      seatingsUsed: 0,
      whatsappUsed: 0,
    },
  });
}

export async function canAcceptSeating(organizationId: string) {
  const org = await ensureUsageMonth(organizationId);
  const plan = getPlan(org.plan);
  return {
    allowed: org.seatingsUsed < plan.limits.seatingsPerMonth,
    used: org.seatingsUsed,
    limit: plan.limits.seatingsPerMonth,
    org,
  };
}

export async function canSendWhatsApp(organizationId: string) {
  const org = await ensureUsageMonth(organizationId);
  const plan = getPlan(org.plan);
  return {
    allowed: org.whatsappUsed < plan.limits.whatsappPerMonth,
    used: org.whatsappUsed,
    limit: plan.limits.whatsappPerMonth,
    org,
  };
}

export async function recordSeating(organizationId: string) {
  await ensureUsageMonth(organizationId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { seatingsUsed: { increment: 1 } },
  });
}

export async function recordWhatsApp(organizationId: string) {
  await ensureUsageMonth(organizationId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { whatsappUsed: { increment: 1 } },
  });
}

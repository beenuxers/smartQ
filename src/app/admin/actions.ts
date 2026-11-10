"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.email || !isPlatformAdmin(session.user.email)) {
    throw new Error("Unauthorized");
  }
  return session;
}

function revalidateOrg(organizationId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin/payments");
}

export async function updateOrganizationPlan(formData: FormData) {
  await assertAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  const plan = String(formData.get("plan") || "free");
  const billingCycle = String(formData.get("billingCycle") || "monthly");

  if (!organizationId || !["free", "starter", "growth"].includes(plan)) {
    throw new Error("Invalid input");
  }
  if (!["monthly", "annual"].includes(billingCycle)) {
    throw new Error("Invalid billing cycle");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan, billingCycle },
  });

  revalidateOrg(organizationId);
}

export async function setOutletActive(formData: FormData) {
  await assertAdmin();
  const outletId = String(formData.get("outletId") || "");
  const isActive = String(formData.get("isActive")) === "true";
  const organizationId = String(formData.get("organizationId") || "");

  if (!outletId) throw new Error("Invalid outlet");

  await prisma.outlet.update({
    where: { id: outletId },
    data: { isActive },
  });

  revalidatePath("/admin/organizations");
  if (organizationId) {
    revalidatePath(`/admin/organizations/${organizationId}`);
  }
}

export async function updateAdminOutletSettings(formData: FormData) {
  await assertAdmin();
  const outletId = String(formData.get("outletId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  if (!outletId) throw new Error("Invalid outlet");

  const name = String(formData.get("name") || "").trim();
  const activeSession = String(formData.get("activeSession") || "all");
  const lunchStart = String(formData.get("lunchStart") || "11:00");
  const lunchEnd = String(formData.get("lunchEnd") || "15:00");
  const dinnerStart = String(formData.get("dinnerStart") || "17:00");
  const dinnerEnd = String(formData.get("dinnerEnd") || "22:00");
  const queueDayCutoff = String(formData.get("queueDayCutoff") || "04:00");
  const timezone = String(formData.get("timezone") || "Asia/Singapore");
  const isActive = String(formData.get("isActive")) === "true";

  if (!name || name.length < 2) throw new Error("Invalid name");
  if (!["lunch", "dinner", "all"].includes(activeSession)) {
    throw new Error("Invalid session");
  }
  if (!/^\d{1,2}:\d{2}$/.test(queueDayCutoff)) {
    throw new Error("Invalid queue day cutoff");
  }

  await prisma.outlet.update({
    where: { id: outletId },
    data: {
      name,
      activeSession,
      lunchStart,
      lunchEnd,
      dinnerStart,
      dinnerEnd,
      queueDayCutoff,
      timezone,
      isActive,
    },
  });

  if (organizationId) revalidateOrg(organizationId);
  revalidatePath(`/admin/outlets/${outletId}/queue`);
}

export async function resetOrganizationUsage(formData: FormData) {
  await assertAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) throw new Error("Invalid organization");

  const now = new Date();
  const usageMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      seatingsUsed: 0,
      whatsappUsed: 0,
      usageMonth,
    },
  });

  revalidateOrg(organizationId);
}

export async function removeMembership(formData: FormData) {
  await assertAdmin();
  const membershipId = String(formData.get("membershipId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  if (!membershipId) throw new Error("Invalid membership");

  await prisma.membership.delete({ where: { id: membershipId } });
  if (organizationId) revalidateOrg(organizationId);
}

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

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin/payments");
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

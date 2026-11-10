import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/pricing";

export const OUTLET_COOKIE = "smartq_outlet_id";

export type OrgOutlet = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export async function getSelectedOutlet<T extends OrgOutlet>(
  outlets: T[],
  opts?: { defaultOutletId?: string | null },
): Promise<T | null> {
  if (outlets.length === 0) return null;
  const jar = await cookies();
  const preferred = jar.get(OUTLET_COOKIE)?.value;
  if (preferred) {
    const match = outlets.find((o) => o.id === preferred);
    if (match) return match;
  }
  // Saved Settings default (used when cookie missing — new browser / cleared cookies).
  if (opts?.defaultOutletId) {
    const match = outlets.find((o) => o.id === opts.defaultOutletId);
    if (match) return match;
  }
  return outlets[0];
}

/** Cookie → membership defaultOutletId → first outlet. */
export async function resolveDashboardOutlet<T extends OrgOutlet>(
  outlets: T[],
  user: { id: string; organizationId: string },
): Promise<T | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: user.organizationId,
      },
    },
    select: { defaultOutletId: true },
  });
  return getSelectedOutlet(outlets, {
    defaultOutletId: membership?.defaultOutletId,
  });
}

export function canAddOutlet(planId: string, currentCount: number) {
  const plan = getPlan(planId);
  return currentCount < plan.limits.outlets;
}

export function canAddStaff(planId: string, currentCount: number) {
  const plan = getPlan(planId);
  return currentCount < plan.limits.staffSeats;
}

export function isOwnerRole(role?: string | null) {
  return role === "owner" || !role;
}

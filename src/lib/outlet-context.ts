import { cookies } from "next/headers";
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
): Promise<T | null> {
  if (outlets.length === 0) return null;
  const jar = await cookies();
  const preferred = jar.get(OUTLET_COOKIE)?.value;
  if (preferred) {
    const match = outlets.find((o) => o.id === preferred);
    if (match) return match;
  }
  return outlets[0];
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

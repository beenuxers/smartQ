"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  OUTLET_COOKIE,
  canAddOutlet,
  canAddStaff,
  isOwnerRole,
} from "@/lib/outlet-context";
import { COUNTRY_DEFAULTS } from "@/lib/product";
import { makeOutletSlug } from "@/lib/slug";

async function requireOwnerOrg() {
  const session = await auth();
  if (!session?.user?.organizationId || !isOwnerRole(session.user.role)) {
    return null;
  }
  return session;
}

export async function setActiveOutlet(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) return { ok: false as const };

  const outletId = String(formData.get("outletId") || "");
  const outlet = await prisma.outlet.findFirst({
    where: { id: outletId, organizationId: session.user.organizationId },
  });
  if (!outlet) return { ok: false as const };

  const jar = await cookies();
  jar.set(OUTLET_COOKIE, outlet.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true as const };
}

export async function createOutlet(formData: FormData) {
  const session = await requireOwnerOrg();
  if (!session?.user?.organizationId) {
    return { ok: false as const, error: "Owners only" };
  }

  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { ok: false as const, error: "Name required" };

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: true },
  });

  if (!canAddOutlet(org.plan, org.outlets.length)) {
    return {
      ok: false as const,
      error: "Outlet limit reached for your plan — upgrade to add more",
    };
  }

  const defaults =
    COUNTRY_DEFAULTS[org.country as keyof typeof COUNTRY_DEFAULTS] ??
    COUNTRY_DEFAULTS.SG;

  const outlet = await prisma.outlet.create({
    data: {
      name,
      slug: makeOutletSlug(name),
      timezone: defaults.timezone,
      organizationId: org.id,
    },
  });

  const jar = await cookies();
  jar.set(OUTLET_COOKIE, outlet.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { ok: true as const, outletId: outlet.id };
}

export async function inviteStaff(formData: FormData) {
  const session = await requireOwnerOrg();
  if (!session?.user?.organizationId) {
    return { ok: false as const, error: "Owners only" };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (name.length < 2 || !email.includes("@")) {
    return { ok: false as const, error: "Name and email required" };
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { memberships: true },
  });

  if (!canAddStaff(org.plan, org.memberships.length)) {
    return {
      ok: false as const,
      error: "Staff seat limit reached for your plan — upgrade to add more",
    };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = org.memberships.some((m) => m.userId === existingUser.id);
    if (already) return { ok: false as const, error: "Already a team member" };

    await prisma.membership.create({
      data: {
        userId: existingUser.id,
        organizationId: org.id,
        role: "staff",
      },
    });
  } else {
    if (password.length < 6) {
      return {
        ok: false as const,
        error: "Password (6+) required for new accounts",
      };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        memberships: {
          create: {
            organizationId: org.id,
            role: "staff",
          },
        },
      },
    });
  }

  revalidatePath("/dashboard/settings");
  return { ok: true as const };
}

export async function removeStaffMember(formData: FormData) {
  const session = await requireOwnerOrg();
  if (!session?.user?.organizationId) {
    return { ok: false as const, error: "Owners only" };
  }

  const membershipId = String(formData.get("membershipId") || "");
  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: session.user.organizationId,
    },
  });
  if (!membership) return { ok: false as const, error: "Not found" };
  if (membership.role === "owner") {
    return { ok: false as const, error: "Cannot remove an owner" };
  }

  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath("/dashboard/settings");
  return { ok: true as const };
}

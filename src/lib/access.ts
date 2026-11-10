import { auth } from "@/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export type AccessSession = {
  user: {
    email?: string | null;
    organizationId?: string;
  };
  asPlatformAdmin: boolean;
};

/** Session must be platform admin or a member of the given organization. */
export async function requireOrgAccess(
  organizationId: string,
): Promise<AccessSession | null> {
  const session = await auth();
  if (!session?.user) return null;

  if (isPlatformAdmin(session.user.email)) {
    return {
      user: {
        email: session.user.email,
        organizationId: session.user.organizationId,
      },
      asPlatformAdmin: true,
    };
  }

  if (session.user.organizationId === organizationId) {
    return {
      user: {
        email: session.user.email,
        organizationId: session.user.organizationId,
      },
      asPlatformAdmin: false,
    };
  }

  return null;
}

export async function requireOutletAccess(outletIdOrSlug: {
  id?: string;
  slug?: string;
}) {
  const outlet = await prisma.outlet.findFirst({
    where: outletIdOrSlug.id
      ? { id: outletIdOrSlug.id }
      : { slug: outletIdOrSlug.slug },
  });
  if (!outlet) return { outlet: null, access: null };

  const access = await requireOrgAccess(outlet.organizationId);
  return { outlet, access };
}

export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.email || !isPlatformAdmin(session.user.email)) {
    return null;
  }
  return session;
}

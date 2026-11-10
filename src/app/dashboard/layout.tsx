import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/admin";
import { planHasFloor } from "@/lib/floor";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { getSelectedOutlet, isOwnerRole } from "@/lib/outlet-context";
import { DashboardNav } from "./dashboard-nav";
import { OutletSwitcher } from "./outlet-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let locale = session.user.locale || "en";
  let plan = session.user.plan || "free";
  let outlets: Array<{ id: string; name: string; slug: string; isActive: boolean }> =
    [];
  if (session.user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        locale: true,
        plan: true,
        outlets: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, slug: true, isActive: true },
        },
      },
    });
    if (org?.locale) locale = org.locale;
    if (org?.plan) plan = org.plan;
    outlets = org?.outlets ?? [];
  }
  const t = getMessages(resolveLocale(locale));
  const showAdmin = isPlatformAdmin(session.user.email);
  const isOwner = isOwnerRole(session.user.role);
  const active = await getSelectedOutlet(outlets);
  const showFloor = planHasFloor(plan);

  const items: Array<{ href: string; label: string }> = [
    { href: "/dashboard", label: t.waitlist },
  ];
  if (showFloor) items.push({ href: "/dashboard/floor", label: t.floor });
  items.push(
    { href: "/dashboard/qr", label: "QR" },
    { href: "/dashboard/analytics", label: t.analytics },
    { href: "/dashboard/settings", label: t.settings },
  );
  if (isOwner) items.push({ href: "/dashboard/billing", label: t.billing });

  return (
    <div className="min-h-screen">
      <DashboardNav
        items={items}
        showAdmin={showAdmin}
        signOutLabel={t.signOut}
        outletSlot={
          active ? (
            <OutletSwitcher
              outlets={outlets}
              activeId={active.id}
              label={t.outlets}
            />
          ) : null
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</div>
    </div>
  );
}

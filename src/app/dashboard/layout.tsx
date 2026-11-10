import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/admin";
import { planHasFloor } from "@/lib/floor";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { getSelectedOutlet, isOwnerRole } from "@/lib/outlet-context";
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

  const nav: Array<[string, string]> = [
    ["/dashboard", t.waitlist],
  ];
  if (showFloor) nav.push(["/dashboard/floor", t.floor]);
  nav.push(
    ["/dashboard/qr", "QR"],
    ["/dashboard/analytics", t.analytics],
    ["/dashboard/settings", t.settings],
  );
  if (isOwner) nav.push(["/dashboard/billing", t.billing]);

  return (
    <div className="min-h-screen">
      <header className="app-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="display text-lg font-semibold tracking-tight">
              SmartQ
            </Link>
            {active ? (
              <OutletSwitcher
                outlets={outlets}
                activeId={active.id}
                label={t.outlets}
              />
            ) : null}
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-2">
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[10px] px-2.5 py-1.5 text-muted hover:bg-[var(--accent-soft)] hover:text-foreground"
              >
                {label}
              </Link>
            ))}
            {showAdmin ? (
              <Link
                href="/admin"
                className="rounded-[10px] px-2.5 py-1.5 font-semibold text-accent hover:bg-[var(--accent-soft)]"
              >
                Admin
              </Link>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-[10px] px-2.5 py-1.5 text-muted hover:text-foreground">
                {t.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getMessages, resolveLocale } from "@/lib/i18n";
import {
  canAddOutlet,
  canAddStaff,
  getSelectedOutlet,
  isOwnerRole,
} from "@/lib/outlet-context";
import { getPlan } from "@/lib/pricing";
import { SettingsForm } from "./settings-form";
import { MarketForm } from "./market-form";
import { TeamPanel } from "./team-panel";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: {
      outlets: { orderBy: { createdAt: "asc" } },
      memberships: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const outlet = await getSelectedOutlet(org.outlets);
  if (!outlet) redirect("/register");
  const t = getMessages(resolveLocale(org.locale));
  const isOwner = isOwnerRole(session.user.role);
  const plan = getPlan(org.plan);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-4xl display">{t.settings}</h1>
      <p className="text-sm text-muted">{outlet.name}</p>

      <SettingsForm
        outlet={{
          id: outlet.id,
          name: outlet.name,
          activeSession: outlet.activeSession,
          lunchStart: outlet.lunchStart,
          lunchEnd: outlet.lunchEnd,
          dinnerStart: outlet.dinnerStart,
          dinnerEnd: outlet.dinnerEnd,
          queueDayCutoff: outlet.queueDayCutoff,
          timezone: outlet.timezone,
        }}
        labels={{
          sessionHours: t.sessionHours,
          lunch: t.lunch,
          dinner: t.dinner,
          allDay: t.allDay,
          queueDayCutoff: t.queueDayCutoff,
          queueDayCutoffHint: t.queueDayCutoffHint,
        }}
      />

      {isOwner ? (
        <>
          <TeamPanel
            members={org.memberships.map((m) => ({
              id: m.id,
              role: m.role,
              user: m.user,
            }))}
            canInvite={canAddStaff(org.plan, org.memberships.length)}
            canCreateOutlet={canAddOutlet(org.plan, org.outlets.length)}
            seatsUsed={org.memberships.length}
            seatsMax={plan.limits.staffSeats}
            outletsUsed={org.outlets.length}
            outletsMax={plan.limits.outlets}
            labels={{
              team: t.team,
              invite: t.inviteStaff,
              remove: t.removeStaff,
              name: t.guestName,
              email: t.email,
              password: t.password,
              passwordHint: t.staffPasswordHint,
              role: t.role,
              owner: t.ownerRole,
              staff: t.staffRole,
              seats: t.staffSeats,
              outlets: t.outlets,
              addOutlet: t.addOutlet,
              outletName: t.outletName,
              limitReached: t.planLimitReached,
              upgrade: t.upgrade,
            }}
          />
          <MarketForm
            locale={org.locale}
            country={org.country}
            currency={org.currency}
            labels={{
              title: t.marketLanguage,
              billingCurrency: t.billingCurrency,
              uiLanguage: t.uiLanguage,
              save: t.save,
              saved: t.saved,
            }}
          />
        </>
      ) : (
        <p className="panel text-sm text-muted">{t.staffSettingsNote}</p>
      )}
    </div>
  );
}

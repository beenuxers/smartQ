import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { planHasFloor } from "@/lib/floor";
import { getMessages, resolveLocale } from "@/lib/i18n";
import {
  canAddOutlet,
  canAddStaff,
  isOwnerRole,
  resolveDashboardOutlet,
} from "@/lib/outlet-context";
import { getPlan } from "@/lib/pricing";
import { DefaultOutletForm } from "./default-outlet-form";
import { SettingsForm } from "./settings-form";
import { MarketForm } from "./market-form";
import { TeamPanel } from "./team-panel";
import { TablesPanel } from "./tables-panel";

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
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    },
    select: { defaultOutletId: true },
  });
  const outlet = await resolveDashboardOutlet(org.outlets, {
    id: session.user.id,
    organizationId: session.user.organizationId,
  });
  if (!outlet) redirect("/register");
  const t = getMessages(resolveLocale(org.locale));
  const isOwner = isOwnerRole(session.user.role);
  const plan = getPlan(org.plan);
  const floorEnabled = planHasFloor(org.plan);

  const tables = floorEnabled
    ? await prisma.diningTable.findMany({
        where: { outletId: outlet.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          seats: true,
          status: true,
          sortOrder: true,
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-4xl display">{t.settings}</h1>
      <p className="text-sm text-muted">{outlet.name}</p>

      <DefaultOutletForm
        outlets={org.outlets.map((o) => ({ id: o.id, name: o.name }))}
        defaultOutletId={membership?.defaultOutletId ?? null}
        labels={{
          title: t.defaultOutlet,
          hint: t.defaultOutletHint,
          save: t.save,
          saved: t.saved,
        }}
      />

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

      <TablesPanel
        outletId={outlet.id}
        initialTables={tables}
        floorEnabled={floorEnabled}
        labels={{
          title: t.tablesTitle,
          add: t.addTable,
          name: t.tableName,
          seats: t.tableSeats,
          save: t.save,
          remove: t.removeStaff,
          upgrade: t.upgrade,
          upgradeHint: t.floorUpgradeHint,
          free: t.tableFree,
          occupied: t.tableOccupied,
          dirty: t.tableDirty,
          actionFailed: t.actionFailed,
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

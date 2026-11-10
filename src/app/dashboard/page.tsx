import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOutletDailyStats } from "@/lib/analytics";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { getSelectedOutlet, isOwnerRole } from "@/lib/outlet-context";
import { getQueueBoard, serializeParty } from "@/lib/queue";
import { PlanUsageBanner } from "@/components/plan-usage-banner";
import { HostWaitlist } from "./host-waitlist";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: {
      outlets: { orderBy: { createdAt: "asc" } },
      memberships: true,
    },
  });
  const outlet = await getSelectedOutlet(org.outlets);
  if (!outlet) redirect("/dashboard/settings");

  const [board, stats] = await Promise.all([
    getQueueBoard(outlet.id, {
      timezone: outlet.timezone,
      queueDayCutoff: outlet.queueDayCutoff,
    }),
    getOutletDailyStats(outlet.id, new Date(), {
      timezone: outlet.timezone,
      queueDayCutoff: outlet.queueDayCutoff,
    }),
  ]);
  const t = getMessages(resolveLocale(org.locale));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-muted">{t.hostDashboard}</p>
        <h1 className="display text-3xl font-semibold tracking-tight md:text-4xl">
          {outlet.name}
        </h1>
      </div>

      <PlanUsageBanner
        planId={org.plan}
        seatingsUsed={org.seatingsUsed}
        whatsappUsed={org.whatsappUsed}
        outletCount={org.outlets.length}
        staffCount={org.memberships.length}
        showUpgrade={isOwnerRole(session.user.role)}
        labels={{
          plan: t.plan,
          seatingsLeft: t.seatingsLeft,
          whatsappLeft: t.whatsappLeft,
          outlets: t.outlets,
          staff: t.staffSeats,
          upgrade: t.upgrade,
          nearLimit: t.nearLimit,
        }}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [t.joins, stats.joins],
          [t.seatings, stats.seatings],
          [t.noShows, stats.noShows],
          [t.avgWait, `${stats.avgWait}m`],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel">
            <div className="text-sm text-muted">{label}</div>
            <div className="display mt-1 text-2xl font-semibold md:text-3xl">
              {value}
            </div>
          </div>
        ))}
      </div>

      <HostWaitlist
        outletId={outlet.id}
        outletSlug={outlet.slug}
        initialWaiting={board.waiting.map(serializeParty)}
        initialCalled={board.called.map(serializeParty)}
        initialDone={board.doneToday.map(serializeParty)}
        labels={{
          notify: t.notify,
          notifyAgain: t.notifyAgain,
          markSeated: t.markSeated,
          markNoShow: t.markNoShow,
          cancel: t.cancel,
          restore: t.restore,
          emptyQueue: t.emptyQueue,
          emptyCalled: t.emptyCalled,
          emptyDone: t.emptyDone,
          waiting: t.waiting,
          notified: t.notified,
          seated: t.seated,
          noShow: t.noShow,
          cancelled: t.cancelled,
          tabWaiting: t.tabWaiting,
          tabCalled: t.tabCalled,
          tabDone: t.tabDone,
          waitMins: t.waitMins,
          addWalkIn: t.addWalkIn,
          viewEdit: t.viewEdit,
          save: t.save,
          close: t.close,
          guestName: t.guestName,
          partySize: t.partySize,
          phone: t.phone,
          notes: t.notes,
          notifyOk: t.notifyOk,
          notifySkipped: t.notifySkipped,
          notifyFailed: t.notifyFailed,
          actionFailed: t.actionFailed,
        }}
      />
    </div>
  );
}

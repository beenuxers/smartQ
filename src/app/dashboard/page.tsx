import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOutletDailyStats, getWaitingParties } from "@/lib/analytics";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { getPlan } from "@/lib/pricing";
import { HostWaitlist } from "./host-waitlist";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: { orderBy: { createdAt: "asc" } } },
  });
  const outlet = org.outlets[0];
  if (!outlet) redirect("/dashboard/settings");

  const [waiting, stats] = await Promise.all([
    getWaitingParties(outlet.id),
    getOutletDailyStats(outlet.id),
  ]);
  const plan = getPlan(org.plan);
  const t = getMessages(resolveLocale(org.locale));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-muted">{t.hostDashboard}</p>
          <h1 className="display text-3xl font-semibold tracking-tight md:text-4xl">
            {outlet.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge">
            {t.plan}: {plan.name}
          </span>
          <span className="badge">
            {t.seatingsLeft}: {Math.max(plan.limits.seatingsPerMonth - org.seatingsUsed, 0)}
          </span>
          <span className="badge">
            {t.whatsappLeft}: {Math.max(plan.limits.whatsappPerMonth - org.whatsappUsed, 0)}
          </span>
        </div>
      </div>

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
        initial={waiting.map((p) => ({
          id: p.id,
          queueNumber: p.queueNumber,
          guestName: p.guestName,
          partySize: p.partySize,
          phone: p.phone,
          notes: p.notes,
          status: p.status,
          joinedAt: p.joinedAt.toISOString(),
        }))}
        labels={{
          notify: t.notify,
          markSeated: t.markSeated,
          markNoShow: t.markNoShow,
          emptyQueue: t.emptyQueue,
          waiting: t.waiting,
          notified: t.notified,
        }}
      />
    </div>
  );
}

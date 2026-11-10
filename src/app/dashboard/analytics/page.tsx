import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getOutletReportStats,
  getQueueDayTrend,
  type ReportRange,
} from "@/lib/analytics";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { resolveDashboardOutlet } from "@/lib/outlet-context";
import { RangeTabs } from "./range-tabs";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const params = await searchParams;
  const range: ReportRange =
    params.range === "week" || params.range === "month" ? params.range : "day";

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: { orderBy: { createdAt: "asc" } } },
  });
  const outlet = await resolveDashboardOutlet(org.outlets, {
    id: session.user.id,
    organizationId: session.user.organizationId,
  });
  if (!outlet) redirect("/dashboard/settings");

  const t = getMessages(resolveLocale(org.locale));
  const meta = {
    timezone: outlet.timezone,
    queueDayCutoff: outlet.queueDayCutoff || "04:00",
  };

  const [stats, trend] = await Promise.all([
    getOutletReportStats(outlet.id, { ...meta, range }),
    getQueueDayTrend(outlet.id, { ...meta, days: 7 }),
  ]);

  const recent = await prisma.party.findMany({
    where: {
      outletId: outlet.id,
      joinedAt: { gte: stats.rangeStart, lt: stats.rangeEnd },
    },
    orderBy: { joinedAt: "desc" },
    take: 50,
  });

  const maxTrend = Math.max(1, ...trend.map((r) => Math.max(r.joins, r.seatings)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl display">{t.analytics}</h1>
          <p className="mt-2 text-sm text-muted">
            {outlet.name} · {stats.label} · {outlet.timezone}
          </p>
        </div>
        <RangeTabs
          current={range}
          labels={{ day: t.reportDay, week: t.reportWeek, month: t.reportMonth }}
        />
      </div>

      <p className="text-sm text-muted">{t.reportRangeNote}</p>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [t.joins, stats.joins],
          [t.seatings, stats.seatings],
          [t.noShows, stats.noShows],
          [t.cancels, stats.cancels],
          [t.notifiedCount, stats.notified],
          [t.avgWait, `${stats.avgWait}m`],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-3xl display">{value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2 className="mb-4 text-xl display">{t.last7QueueDays}</h2>
        <div className="space-y-3">
          {trend.map((row) => (
            <div key={row.label} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
              <div className="text-muted">{row.label.slice(5)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${(row.joins / maxTrend) * 100}%`, minWidth: row.joins ? 4 : 0 }}
                    title={`${t.joins}: ${row.joins}`}
                  />
                  <span className="w-16 shrink-0 text-xs text-muted">
                    {t.joins} {row.joins}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full bg-[var(--line)]"
                    style={{
                      width: `${(row.seatings / maxTrend) * 100}%`,
                      minWidth: row.seatings ? 4 : 0,
                    }}
                    title={`${t.seatings}: ${row.seatings}`}
                  />
                  <span className="w-16 shrink-0 text-xs text-muted">
                    {t.seatings} {row.seatings}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2">#</th>
              <th>Guest</th>
              <th>Pax</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-muted">
                  —
                </td>
              </tr>
            ) : (
              recent.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2">{p.queueNumber}</td>
                  <td>{p.guestName}</td>
                  <td>{p.partySize}</td>
                  <td>{p.status}</td>
                  <td>{p.joinedAt.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

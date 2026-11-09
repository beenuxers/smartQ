import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOutletDailyStats } from "@/lib/analytics";
import { getMessages, resolveLocale } from "@/lib/i18n";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: true },
  });
  const outlet = org.outlets[0];
  if (!outlet) redirect("/dashboard/settings");

  const stats = await getOutletDailyStats(outlet.id);
  const t = getMessages(resolveLocale(org.locale));

  const recent = await prisma.party.findMany({
    where: { outletId: outlet.id },
    orderBy: { joinedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl display">
        {t.analytics}
      </h1>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [t.joins, stats.joins],
          [t.seatings, stats.seatings],
          [t.noShows, stats.noShows],
          [t.avgWait, `${stats.avgWait} min`],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-3xl display">
              {value}
            </div>
          </div>
        ))}
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
            {recent.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-2">{p.queueNumber}</td>
                <td>{p.guestName}</td>
                <td>{p.partySize}</td>
                <td>{p.status}</td>
                <td>{p.joinedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

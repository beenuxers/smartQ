import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";

export default async function AdminOverviewPage() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    orgCount,
    freeCount,
    starterCount,
    growthCount,
    paidThisMonth,
    failedThisMonth,
    recentOrgs,
    recentPayments,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { plan: "free" } }),
    prisma.organization.count({ where: { plan: "starter" } }),
    prisma.organization.count({ where: { plan: "growth" } }),
    prisma.payment.findMany({
      where: { status: "paid", createdAt: { gte: startOfMonth } },
      select: { amount: true, currency: true },
    }),
    prisma.payment.count({
      where: { status: "failed", createdAt: { gte: startOfMonth } },
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { outlets: { take: 1 }, _count: { select: { outlets: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { organization: { select: { id: true, name: true } } },
    }),
  ]);

  const revenueByCurrency = paidThisMonth.reduce(
    (acc, p) => {
      acc[p.currency] = (acc[p.currency] || 0) + p.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const cards = [
    ["Organizations", orgCount],
    ["Free", freeCount],
    ["Starter", starterCount],
    ["Growth", growthCount],
    ["Failed payments (mo)", failedThisMonth],
    ["Paid payments (mo)", paidThisMonth.length],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl display">
          Platform overview
        </h1>
        <p className="mt-2 text-sm text-white/60">
          All customers, plans, and payment outcomes in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-white/50">{label}</div>
            <div className="mt-2 text-2xl display">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg display">
          Revenue this month (paid)
        </h2>
        {Object.keys(revenueByCurrency).length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No successful charges yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-4 text-sm">
            {Object.entries(revenueByCurrency).map(([currency, amount]) => (
              <li key={currency} className="rounded-full bg-white/10 px-3 py-1">
                {formatMoney(amount, currency as CurrencyCode)} {currency}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg display">
              Newest organizations
            </h2>
            <Link href="/admin/organizations" className="text-sm text-[#7dd3c0]">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentOrgs.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5"
                >
                  <span>
                    {org.name}
                    <span className="ml-2 text-white/40">
                      {org.country} · {org.plan}
                    </span>
                  </span>
                  <span className="text-white/40">{org._count.outlets} outlet(s)</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg display">
              Recent payments
            </h2>
            <Link href="/admin/payments" className="text-sm text-[#7dd3c0]">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentPayments.length === 0 ? (
              <li className="text-white/50">No payments yet.</li>
            ) : (
              recentPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5"
                >
                  <span>
                    <Link href={`/admin/organizations/${p.organizationId}`} className="hover:underline">
                      {p.organization.name}
                    </Link>
                    <span className="ml-2 text-white/40">
                      {p.plan} · {p.status}
                    </span>
                  </span>
                  <span>
                    {formatMoney(p.amount, p.currency as CurrencyCode)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

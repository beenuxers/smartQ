import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter =
    status === "paid" || status === "failed" || status === "pending"
      ? status
      : undefined;

  const payments = await prisma.payment.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      organization: { select: { id: true, name: true, country: true } },
    },
  });

  const paidCount = await prisma.payment.count({ where: { status: "paid" } });
  const failedCount = await prisma.payment.count({ where: { status: "failed" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl display">
          Payments
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {paidCount} paid · {failedCount} failed across the platform
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { href: "/admin/payments", label: "All" },
          { href: "/admin/payments?status=paid", label: "Paid" },
          { href: "/admin/payments?status=failed", label: "Failed" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 ${
              (filter === undefined && tab.label === "All") || filter === tab.label.toLowerCase()
                ? "bg-[#0f6b5c] text-white"
                : "bg-white/10 text-white/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="px-4 py-3">When</th>
              <th>Organization</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Card</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3 whitespace-nowrap">
                  {p.createdAt.toLocaleString()}
                </td>
                <td>
                  <Link
                    href={`/admin/organizations/${p.organizationId}`}
                    className="text-[#7dd3c0] hover:underline"
                  >
                    {p.organization.name}
                  </Link>
                  <span className="ml-2 text-white/40">{p.organization.country}</span>
                </td>
                <td>
                  {p.plan}/{p.billingCycle}
                </td>
                <td>{formatMoney(p.amount, p.currency as CurrencyCode)}</td>
                <td>
                  <span
                    className={
                      p.status === "paid"
                        ? "text-emerald-400"
                        : p.status === "failed"
                          ? "text-red-400"
                          : "text-white/60"
                    }
                  >
                    {p.status}
                  </span>
                  {p.failureReason ? (
                    <div className="text-xs text-white/40">{p.failureReason}</div>
                  ) : null}
                </td>
                <td>{p.cardLast4 ? `•••• ${p.cardLast4}` : "—"}</td>
                <td className="text-white/50">{p.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? (
          <p className="px-4 py-8 text-sm text-white/50">No payments match this filter.</p>
        ) : null}
      </div>
    </div>
  );
}

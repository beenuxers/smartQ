import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";
import { setOutletActive, updateOrganizationPlan } from "../../actions";

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      outlets: { orderBy: { createdAt: "asc" } },
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!org) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/organizations" className="text-sm text-white/50">
          ← Organizations
        </Link>
        <h1 className="mt-2 text-3xl display">
          {org.name}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {org.country} · {org.locale} · {org.currency} · created{" "}
          {org.createdAt.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-white/50">Plan</div>
          <div className="mt-1 text-2xl capitalize display">
            {org.plan}
          </div>
          <div className="text-sm text-white/50">{org.billingCycle}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-white/50">Seatings used</div>
          <div className="mt-1 text-2xl display">
            {org.seatingsUsed}
          </div>
          <div className="text-sm text-white/50">Month {org.usageMonth || "—"}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-white/50">WhatsApp used</div>
          <div className="mt-1 text-2xl display">
            {org.whatsappUsed}
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg display">
          Set plan
        </h2>
        <form action={updateOrganizationPlan} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="organizationId" value={org.id} />
          <label className="text-sm">
            <span className="mb-1 block text-white/50">Plan</span>
            <select
              name="plan"
              defaultValue={org.plan}
              className="rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/50">Cycle</span>
            <select
              name="billingCycle"
              defaultValue={org.billingCycle}
              className="rounded-xl border border-white/15 bg-[#0d1411] px-3 py-2"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </label>
          <button className="rounded-[10px] bg-[#0f6b5c] px-4 py-2 text-sm font-semibold text-white">
            Save plan
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg display">
          Owners & members
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {org.memberships.map((m) => (
            <li key={m.id} className="flex justify-between border-b border-white/10 py-2">
              <span>
                {m.user.name}{" "}
                <span className="text-white/50">({m.user.email})</span>
              </span>
              <span className="capitalize text-white/50">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg display">
          Outlets
        </h2>
        <div className="mt-3 space-y-3">
          {org.outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-3 text-sm"
            >
              <div>
                <div className="font-medium">{outlet.name}</div>
                <div className="text-white/50">
                  /join/{outlet.slug} · {outlet.isActive ? "active" : "inactive"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/join/${outlet.slug}`}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs"
                  target="_blank"
                >
                  Guest join
                </Link>
                <Link
                  href={`/api/outlets/${outlet.slug}/qr`}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs"
                  target="_blank"
                >
                  QR
                </Link>
                <form action={setOutletActive}>
                  <input type="hidden" name="outletId" value={outlet.id} />
                  <input type="hidden" name="organizationId" value={org.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={outlet.isActive ? "false" : "true"}
                  />
                  <button className="rounded-full bg-white/10 px-3 py-1.5 text-xs">
                    {outlet.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-lg display">
          Recent payments
        </h2>
        {org.payments.length === 0 ? (
          <p className="text-sm text-white/50">No payments for this org.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="py-2">When</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {org.payments.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-2">{p.createdAt.toLocaleString()}</td>
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
                      <span className="text-white/40"> — {p.failureReason}</span>
                    ) : null}
                  </td>
                  <td>{p.cardLast4 ? `•••• ${p.cardLast4}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

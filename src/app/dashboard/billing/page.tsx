import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStripeBilling } from "@/lib/billing-provider";
import { prisma } from "@/lib/db";
import { isOwnerRole } from "@/lib/outlet-context";
import { PLANS, formatMoney, WHATSAPP_OVERAGE, getPlan } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";
import { reconcilePendingStripePayments } from "@/lib/reconcile-stripe";
import { PlanUsageBanner } from "@/components/plan-usage-banner";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { BillingActions } from "./billing-actions";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!isOwnerRole(session.user.role)) redirect("/dashboard");

  if (isStripeBilling()) {
    try {
      await reconcilePendingStripePayments(session.user.organizationId);
    } catch (err) {
      console.error("Stripe reconcile on billing page failed", err);
    }
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: {
      outlets: true,
      memberships: true,
    },
  });
  const currency = (org.currency as CurrencyCode) || "USD";
  const plan = getPlan(org.plan);
  const t = getMessages(resolveLocale(org.locale));

  const payments = await prisma.payment.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl display">Billing</h1>
        <p className="mt-2 text-muted">
          Current plan <strong>{plan.name}</strong> · {org.billingCycle} · {currency}.
          {isStripeBilling()
            ? " Paid upgrades go through Stripe Checkout."
            : " Use the test checkout to simulate payment (card 4242…)."}
        </p>
      </div>

      <PlanUsageBanner
        planId={org.plan}
        seatingsUsed={org.seatingsUsed}
        whatsappUsed={org.whatsappUsed}
        outletCount={org.outlets.length}
        staffCount={org.memberships.length}
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

      <div className="grid gap-4 md:grid-cols-3">
        {(["free", "starter", "growth"] as const).map((id) => {
          const p = PLANS[id];
          const active = org.plan === id;
          return (
            <article
              key={id}
              className={`panel ${active ? "ring-2 ring-[var(--accent)]" : ""}`}
            >
              <div className="badge">{active ? "Current" : p.name}</div>
              <div className="mt-3 text-3xl display">
                {formatMoney(p.prices[currency].monthly, currency)}
                <span className="text-base text-muted">/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                Annual equiv. {formatMoney(p.prices[currency].annualMonthly, currency)}/mo
              </p>
              <ul className="mt-4 space-y-1 text-sm text-muted">
                <li>{p.limits.seatingsPerMonth.toLocaleString()} seatings</li>
                <li>{p.limits.whatsappPerMonth.toLocaleString()} WhatsApp</li>
                <li>
                  {p.limits.outlets} outlet(s) · {p.limits.staffSeats} seats
                </li>
              </ul>
              <BillingActions plan={id} active={active} />
            </article>
          );
        })}
      </div>

      <div className="panel text-sm text-muted">
        Overage after WhatsApp allowance:{" "}
        {formatMoney(WHATSAPP_OVERAGE[currency], currency)} / message.
      </div>

      <div className="panel overflow-x-auto">
        <h2 className="mb-3 text-xl display">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">
            No payments yet. Choose Starter or Growth to{" "}
            {isStripeBilling() ? "checkout with Stripe" : "test checkout"}.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">When</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2">{p.createdAt.toLocaleString()}</td>
                  <td>
                    {p.plan} / {p.billingCycle}
                  </td>
                  <td>{formatMoney(p.amount, p.currency as CurrencyCode)}</td>
                  <td>
                    {p.status}
                    {p.failureReason ? ` — ${p.failureReason}` : ""}
                  </td>
                  <td>{p.cardLast4 ? `•••• ${p.cardLast4}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

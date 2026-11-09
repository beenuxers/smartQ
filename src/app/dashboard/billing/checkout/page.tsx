import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANS, formatMoney } from "@/lib/pricing";
import type { CurrencyCode, PlanId } from "@/lib/product";
import { amountForPlan, TEST_CARDS } from "@/lib/payments";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const params = await searchParams;
  const plan: "starter" | "growth" =
    params.plan === "growth" ? "growth" : "starter";
  const cycle = params.cycle === "annual" ? "annual" : "monthly";

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });
  const currency = (org.currency as CurrencyCode) || "USD";
  const amount = amountForPlan(plan as PlanId, cycle, currency);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/dashboard/billing" className="text-sm text-muted">
        ← Back to billing
      </Link>
      <div>
        <h1 className="text-4xl display">
          Test checkout
        </h1>
        <p className="mt-2 text-muted">
          Simulated payment for <strong>{PLANS[plan].name}</strong> ({cycle}) in {currency}. No real
          charge — use the test cards below.
        </p>
      </div>

      <div className="panel">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-muted">Due now</div>
            <div className="text-4xl display">
              {formatMoney(amount, currency)}
            </div>
          </div>
          <div className="badge">{currency}</div>
        </div>
      </div>

      <div className="panel text-sm text-muted space-y-1">
        <p>
          <strong>Success:</strong> {TEST_CARDS.success} (any future expiry / CVC)
        </p>
        <p>
          <strong>Decline:</strong> {TEST_CARDS.decline}
        </p>
      </div>

      <CheckoutForm plan={plan} billingCycle={cycle} amountLabel={formatMoney(amount, currency)} />
    </div>
  );
}

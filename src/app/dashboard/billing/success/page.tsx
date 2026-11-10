import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fulfillPaidPayment } from "@/lib/fulfill-payment";
import { formatMoney, PLANS } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";
import { getStripe } from "@/lib/stripe";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; plan?: string; session_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const params = await searchParams;
  let paymentId = params.paymentId;

  // Stripe redirects here with session_id — fulfill if webhook is slow.
  if (params.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const checkout = await stripe.checkout.sessions.retrieve(params.session_id);
      const metaPaymentId = checkout.metadata?.paymentId;
      if (
        metaPaymentId &&
        checkout.metadata?.organizationId === session.user.organizationId &&
        (checkout.payment_status === "paid" || checkout.status === "complete")
      ) {
        await fulfillPaidPayment(metaPaymentId);
        paymentId = metaPaymentId;
      }
    } catch (err) {
      console.error("Stripe success sync failed", err);
    }
  }

  const payment = paymentId
    ? await prisma.payment.findFirst({
        where: {
          id: paymentId,
          organizationId: session.user.organizationId,
          status: "paid",
        },
      })
    : null;

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="panel rise-in text-center">
        <div className="text-sm uppercase tracking-[0.16em] text-muted">Payment successful</div>
        <h1 className="mt-3 text-4xl display">
          You&apos;re on {PLANS[org.plan as keyof typeof PLANS]?.name ?? org.plan}
        </h1>
        {payment ? (
          <p className="mt-3 text-muted">
            Charged {formatMoney(payment.amount, payment.currency as CurrencyCode)}
            {payment.cardLast4 ? ` · card •••• ${payment.cardLast4}` : ""} · ref{" "}
            {payment.id.slice(-8)}
          </p>
        ) : (
          <p className="mt-3 text-muted">
            Plan updated. If your plan hasn&apos;t changed yet, refresh in a moment — Stripe may
            still be confirming.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Open waitlist
          </Link>
          <Link href="/dashboard/billing" className="btn btn-secondary">
            Billing history
          </Link>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "./db";
import { fulfillPaidPayment } from "./fulfill-payment";
import { getStripe } from "./stripe";

function sessionLooksPaid(session: {
  payment_status?: string | null;
  status?: string | null;
}) {
  return session.payment_status === "paid" || session.status === "complete";
}

/**
 * Heal pending Stripe payments for an org (webhook miss / success-page sync failure).
 * Returns how many payments were fulfilled.
 */
export async function reconcilePendingStripePayments(organizationId: string) {
  const pending = await prisma.payment.findMany({
    where: {
      organizationId,
      provider: "stripe",
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (pending.length === 0) return 0;

  const stripe = getStripe();
  let fulfilled = 0;

  // One list covers older rows that never got providerRef saved.
  let recentSessions: Awaited<
    ReturnType<typeof stripe.checkout.sessions.list>
  >["data"] = [];
  try {
    const listed = await stripe.checkout.sessions.list({ limit: 40 });
    recentSessions = listed.data;
  } catch (err) {
    console.error("Stripe session list failed during reconcile", err);
  }

  for (const payment of pending) {
    try {
      let session =
        payment.providerRef != null
          ? await stripe.checkout.sessions.retrieve(payment.providerRef)
          : recentSessions.find((s) => s.metadata?.paymentId === payment.id);

      if (!session) {
        session = recentSessions.find((s) => s.metadata?.paymentId === payment.id);
      }

      if (!session || !sessionLooksPaid(session)) continue;

      if (!payment.providerRef && session.id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { providerRef: session.id },
        });
      }

      let last4: string | null = null;
      if (typeof session.payment_intent === "string") {
        try {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
          const pm =
            typeof pi.payment_method === "string"
              ? await stripe.paymentMethods.retrieve(pi.payment_method)
              : pi.payment_method;
          last4 = pm && "card" in pm ? pm.card?.last4 ?? null : null;
        } catch {
          // optional
        }
      }

      await fulfillPaidPayment(payment.id, { cardLast4: last4 });
      fulfilled += 1;
    } catch (err) {
      console.error(`Reconcile failed for payment ${payment.id}`, err);
    }
  }

  return fulfilled;
}

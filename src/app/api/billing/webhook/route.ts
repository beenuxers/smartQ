import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillPaidPayment } from "@/lib/fulfill-payment";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) {
        console.error("checkout.session.completed missing paymentId metadata");
        return NextResponse.json({ received: true });
      }

      if (session.payment_status === "paid" || session.status === "complete") {
        await prisma.payment.updateMany({
          where: { id: paymentId },
          data: { providerRef: session.id },
        });
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
            // card last4 is nice-to-have
          }
        }
        await fulfillPaidPayment(paymentId, { cardLast4: last4 });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await prisma.payment.updateMany({
          where: { id: paymentId, status: "pending" },
          data: { status: "cancelled", failureReason: "Checkout expired" },
        });
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

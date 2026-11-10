import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isStripeBilling } from "@/lib/billing-provider";
import { prisma } from "@/lib/db";
import { isOwnerRole } from "@/lib/outlet-context";
import { amountForPlan, simulateCardCharge } from "@/lib/payments";
import { PLANS, type PlanId } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";
import { appBaseUrl, getStripe, toStripeUnitAmount } from "@/lib/stripe";

const localSchema = z.object({
  plan: z.enum(["starter", "growth"]),
  billingCycle: z.enum(["monthly", "annual"]),
  cardNumber: z.string().min(12),
  cardName: z.string().min(2),
  expiry: z.string().min(3),
  cvc: z.string().min(3).max(4),
});

const stripeSchema = z.object({
  plan: z.enum(["starter", "growth"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId || !isOwnerRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: session.user.organizationId },
    });
    const currency = (org.currency as CurrencyCode) || "USD";

    if (isStripeBilling()) {
      const body = stripeSchema.parse(json);
      const plan = body.plan as PlanId;
      const amount = amountForPlan(plan, body.billingCycle, currency);

      const payment = await prisma.payment.create({
        data: {
          organizationId: org.id,
          plan,
          billingCycle: body.billingCycle,
          amount,
          currency,
          status: "pending",
          provider: "stripe",
        },
      });

      const stripe = getStripe();
      const base = appBaseUrl();
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: session.user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: toStripeUnitAmount(amount, currency),
              product_data: {
                name: `SmartQ ${PLANS[plan].name} (${body.billingCycle})`,
                description: PLANS[plan].description,
              },
            },
          },
        ],
        metadata: {
          paymentId: payment.id,
          organizationId: org.id,
          plan,
          billingCycle: body.billingCycle,
        },
        success_url: `${base}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/dashboard/billing/checkout?plan=${plan}&cycle=${body.billingCycle}&cancelled=1`,
      });

      if (!checkout.url) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "failed", failureReason: "Missing Stripe checkout URL" },
        });
        return NextResponse.json({ error: "Could not start Stripe Checkout" }, { status: 502 });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerRef: checkout.id },
      });

      return NextResponse.json({
        ok: true,
        provider: "stripe",
        paymentId: payment.id,
        url: checkout.url,
      });
    }

    const body = localSchema.parse(json);
    const plan = body.plan as PlanId;
    const amount = amountForPlan(plan, body.billingCycle, currency);
    const charge = simulateCardCharge(body.cardNumber);
    const payment = await prisma.payment.create({
      data: {
        organizationId: org.id,
        plan,
        billingCycle: body.billingCycle,
        amount,
        currency,
        status: charge.ok ? "paid" : "failed",
        provider: "test",
        cardLast4: charge.last4,
        failureReason: charge.reason,
        paidAt: charge.ok ? new Date() : null,
      },
    });

    if (!charge.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: charge.reason || "Payment failed",
          paymentId: payment.id,
        },
        { status: 402 },
      );
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        plan,
        billingCycle: body.billingCycle,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: "local",
      paymentId: payment.id,
      plan,
      billingCycle: body.billingCycle,
      amount,
      currency,
      message: `Paid ${currency} ${amount} — now on ${PLANS[plan].name}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment could not be processed" }, { status: 400 });
  }
}

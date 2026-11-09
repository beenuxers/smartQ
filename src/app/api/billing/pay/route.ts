import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";
import { amountForPlan, simulateCardCharge } from "@/lib/payments";

const schema = z.object({
  plan: z.enum(["starter", "growth"]),
  billingCycle: z.enum(["monthly", "annual"]),
  cardNumber: z.string().min(12),
  cardName: z.string().min(2),
  expiry: z.string().min(3),
  cvc: z.string().min(3).max(4),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: session.user.organizationId },
    });
    const currency = (org.currency as CurrencyCode) || "USD";
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/pricing";

/**
 * Free plan only — paid plans must go through /api/billing/pay checkout.
 */
const schema = z.object({
  plan: z.enum(["free"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const plan = body.plan as PlanId;

  const org = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      plan,
      billingCycle: body.billingCycle,
    },
  });

  const provider = process.env.BILLING_PROVIDER || "local";

  await prisma.payment.create({
    data: {
      organizationId: org.id,
      plan: "free",
      billingCycle: body.billingCycle,
      amount: 0,
      currency: org.currency,
      status: "paid",
      provider,
      paidAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    plan: org.plan,
    billingCycle: org.billingCycle,
    provider,
    message: `Moved to ${PLANS.free.name}`,
  });
}

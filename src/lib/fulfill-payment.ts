import { prisma } from "./db";
import type { PlanId } from "./product";

/**
 * Idempotent: mark a pending payment paid and apply plan to the org.
 */
export async function fulfillPaidPayment(
  paymentId: string,
  extras?: { cardLast4?: string | null },
) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  if (payment.status === "paid") {
    return payment;
  }

  return prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        failureReason: null,
        cardLast4: extras?.cardLast4 ?? payment.cardLast4,
      },
    });

    await tx.organization.update({
      where: { id: payment.organizationId },
      data: {
        plan: payment.plan as PlanId,
        billingCycle: payment.billingCycle,
      },
    });

    return paid;
  });
}

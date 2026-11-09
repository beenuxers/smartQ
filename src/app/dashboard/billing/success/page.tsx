import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatMoney, PLANS } from "@/lib/pricing";
import type { CurrencyCode } from "@/lib/product";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; plan?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const params = await searchParams;
  const payment = params.paymentId
    ? await prisma.payment.findFirst({
        where: {
          id: params.paymentId,
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
            Charged {formatMoney(payment.amount, payment.currency as CurrencyCode)} · card ••••{" "}
            {payment.cardLast4} · ref {payment.id.slice(-8)}
          </p>
        ) : (
          <p className="mt-3 text-muted">Plan updated.</p>
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

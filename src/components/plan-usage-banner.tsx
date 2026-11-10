import Link from "next/link";
import { getPlan } from "@/lib/pricing";

export function PlanUsageBanner({
  planId,
  seatingsUsed,
  whatsappUsed,
  outletCount,
  staffCount,
  showUpgrade = true,
  labels,
}: {
  planId: string;
  seatingsUsed: number;
  whatsappUsed: number;
  outletCount: number;
  staffCount: number;
  showUpgrade?: boolean;
  labels: {
    plan: string;
    seatingsLeft: string;
    whatsappLeft: string;
    outlets: string;
    staff: string;
    upgrade: string;
    nearLimit: string;
  };
}) {
  const plan = getPlan(planId);
  const seatingsLeft = Math.max(plan.limits.seatingsPerMonth - seatingsUsed, 0);
  const whatsappLeft = Math.max(plan.limits.whatsappPerMonth - whatsappUsed, 0);
  const outletsLeft = Math.max(plan.limits.outlets - outletCount, 0);
  const staffLeft = Math.max(plan.limits.staffSeats - staffCount, 0);

  const near =
    seatingsLeft / Math.max(plan.limits.seatingsPerMonth, 1) <= 0.15 ||
    whatsappLeft / Math.max(plan.limits.whatsappPerMonth, 1) <= 0.15 ||
    outletsLeft === 0 ||
    staffLeft === 0;

  return (
    <div className={`panel text-sm ${near ? "ring-1 ring-[var(--accent)]" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">
            {labels.plan}: {plan.name}
            {near ? <span className="ml-2 text-accent">· {labels.nearLimit}</span> : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted">
            <span>
              {labels.seatingsLeft}: {seatingsLeft}/{plan.limits.seatingsPerMonth}
            </span>
            <span>
              {labels.whatsappLeft}: {whatsappLeft}/{plan.limits.whatsappPerMonth}
            </span>
            <span>
              {labels.outlets}: {outletCount}/{plan.limits.outlets}
            </span>
            <span>
              {labels.staff}: {staffCount}/{plan.limits.staffSeats}
            </span>
          </div>
        </div>
        {showUpgrade && planId !== "growth" ? (
          <Link href="/dashboard/billing" className="btn btn-secondary">
            {labels.upgrade}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

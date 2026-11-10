import Link from "next/link";
import { notFound } from "next/navigation";
import { HostWaitlist } from "@/app/dashboard/host-waitlist";
import { planHasFloor } from "@/lib/floor";
import { prisma } from "@/lib/db";
import { getQueueBoard, serializeParty } from "@/lib/queue";

const labels = {
  notify: "Notify",
  notifyAgain: "Notify again",
  markSeated: "Seated",
  markNoShow: "No-show",
  cancel: "Cancel",
  restore: "Restore to waiting",
  emptyQueue: "No parties waiting",
  emptyCalled: "No parties called",
  emptyDone: "No completed parties today",
  waiting: "Waiting",
  notified: "Notified",
  seated: "Seated",
  noShow: "No-show",
  cancelled: "Cancelled",
  tabWaiting: "Waiting",
  tabCalled: "Called",
  tabDone: "Done today",
  waitMins: "wait",
  addWalkIn: "Add walk-in",
  viewEdit: "View / edit",
  save: "Save",
  close: "Close",
  guestName: "Name",
  partySize: "Party size",
  phone: "WhatsApp number",
  notes: "Notes",
  notifyOk: "WhatsApp sent",
  notifySkipped: "Notified (WhatsApp quota skipped)",
  notifyFailed: "Queue updated; WhatsApp failed",
  actionFailed: "Action failed",
  assignTable: "Assign table",
  seatWithoutTable: "Seat without table",
  tableSeats: "Seats",
  preferredFit: "Best fit",
};

export default async function AdminOutletQueuePage({
  params,
}: {
  params: Promise<{ outletId: string }>;
}) {
  const { outletId } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: { organization: true },
  });
  if (!outlet) notFound();

  const board = await getQueueBoard(outlet.id, {
    timezone: outlet.timezone,
    queueDayCutoff: outlet.queueDayCutoff,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/organizations/${outlet.organizationId}`}
          className="text-sm text-white/50"
        >
          ← {outlet.organization.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl display">{outlet.name}</h1>
          <span className="admin-badge">Support queue</span>
        </div>
        <p className="mt-2 text-sm text-white/60">
          /join/{outlet.slug} · cutoff {outlet.queueDayCutoff} · {outlet.timezone}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        You are operating this outlet as platform support. Actions use the same APIs as the
        merchant host console.
      </div>

      <HostWaitlist
        outletId={outlet.id}
        outletSlug={outlet.slug}
        initialWaiting={board.waiting.map(serializeParty)}
        initialCalled={board.called.map(serializeParty)}
        initialDone={board.doneToday.map(serializeParty)}
        floorEnabled={planHasFloor(outlet.organization.plan)}
        labels={labels}
      />
    </div>
  );
}

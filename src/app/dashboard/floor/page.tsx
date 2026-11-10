import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { planHasFloor, serializeTable } from "@/lib/floor";
import { getMessages, resolveLocale } from "@/lib/i18n";
import { getSelectedOutlet, isOwnerRole } from "@/lib/outlet-context";
import { FloorBoard } from "./floor-board";

export default async function FloorPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
    include: { outlets: { orderBy: { createdAt: "asc" } } },
  });

  if (!planHasFloor(org.plan)) {
    redirect(
      isOwnerRole(session.user.role)
        ? "/dashboard/billing?feature=floor"
        : "/dashboard",
    );
  }

  const outlet = await getSelectedOutlet(org.outlets);
  if (!outlet) redirect("/dashboard/settings");

  const tables = await prisma.diningTable.findMany({
    where: { outletId: outlet.id },
    include: {
      party: {
        select: {
          id: true,
          queueNumber: true,
          guestName: true,
          partySize: true,
          phone: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const t = getMessages(resolveLocale(org.locale));
  const dining = tables.filter((x) => x.status === "occupied").length;
  const dirty = tables.filter((x) => x.status === "dirty").length;
  const free = tables.filter((x) => x.status === "free").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-muted">{t.floor}</p>
          <h1 className="display text-3xl font-semibold tracking-tight md:text-4xl">
            {outlet.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {free} {t.tableFree} · {dining} {t.tableOccupied} · {dirty} {t.tableDirty}
          </p>
        </div>
        <Link href="/dashboard/settings" className="btn btn-secondary">
          {t.manageTables}
        </Link>
      </div>

      <FloorBoard
        outletId={outlet.id}
        initialTables={tables.map(serializeTable)}
        labels={{
          free: t.tableFree,
          occupied: t.tableOccupied,
          dirty: t.tableDirty,
          clear: t.clearTable,
          ready: t.markReady,
          seatWalkIn: t.seatWalkIn,
          guestName: t.guestName,
          partySize: t.partySize,
          phone: t.phone,
          close: t.close,
          seats: t.tableSeats,
          emptyFloor: t.emptyFloor,
          actionFailed: t.actionFailed,
        }}
      />
    </div>
  );
}

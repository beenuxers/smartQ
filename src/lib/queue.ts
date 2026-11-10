import { prisma } from "./db";
import { getQueueDayWindow } from "./queue-day";

export type QueueParty = Awaited<ReturnType<typeof getQueueBoard>>["waiting"][number];

export function serializeParty(p: {
  id: string;
  queueNumber: number;
  guestName: string;
  partySize: number;
  phone: string;
  notes: string | null;
  status: string;
  joinedAt: Date;
  notifiedAt: Date | null;
  seatedAt: Date | null;
  completedAt: Date | null;
  positionLink: string;
}) {
  const waitMinutes = Math.max(
    0,
    Math.round((Date.now() - p.joinedAt.getTime()) / 60000),
  );
  return {
    id: p.id,
    queueNumber: p.queueNumber,
    guestName: p.guestName,
    partySize: p.partySize,
    phone: p.phone,
    notes: p.notes,
    status: p.status,
    joinedAt: p.joinedAt.toISOString(),
    notifiedAt: p.notifiedAt?.toISOString() ?? null,
    seatedAt: p.seatedAt?.toISOString() ?? null,
    completedAt: p.completedAt?.toISOString() ?? null,
    positionLink: p.positionLink,
    waitMinutes,
  };
}

export async function getQueueBoard(
  outletId: string,
  opts?: { timezone?: string; queueDayCutoff?: string; now?: Date },
) {
  let timezone = opts?.timezone;
  let queueDayCutoff = opts?.queueDayCutoff;
  if (!timezone || !queueDayCutoff) {
    const outlet = await prisma.outlet.findUniqueOrThrow({
      where: { id: outletId },
      select: { timezone: true, queueDayCutoff: true },
    });
    timezone = timezone ?? outlet.timezone;
    queueDayCutoff = queueDayCutoff ?? outlet.queueDayCutoff;
  }

  const { dayStart, dayEnd } = getQueueDayWindow(
    opts?.now ?? new Date(),
    timezone,
    queueDayCutoff || "04:00",
  );

  const [waiting, called, doneToday] = await Promise.all([
    prisma.party.findMany({
      where: { outletId, status: "waiting" },
      orderBy: { queueNumber: "asc" },
    }),
    prisma.party.findMany({
      where: { outletId, status: "notified" },
      orderBy: { queueNumber: "asc" },
    }),
    prisma.party.findMany({
      where: {
        outletId,
        status: { in: ["seated", "no_show", "cancelled"] },
        OR: [
          { completedAt: { gte: dayStart, lt: dayEnd } },
          { seatedAt: { gte: dayStart, lt: dayEnd } },
          { joinedAt: { gte: dayStart, lt: dayEnd } },
        ],
      },
      orderBy: [{ completedAt: "desc" }, { joinedAt: "desc" }],
    }),
  ]);

  return { waiting, called, doneToday, dayStart, dayEnd };
}

import { prisma } from "./db";

export type QueueParty = Awaited<ReturnType<typeof getQueueBoard>>["waiting"][number];

function startOfDay(day = new Date()) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(day = new Date()) {
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return end;
}

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

export async function getQueueBoard(outletId: string, day = new Date()) {
  const start = startOfDay(day);
  const end = endOfDay(day);

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
          { completedAt: { gte: start, lte: end } },
          { seatedAt: { gte: start, lte: end } },
          { joinedAt: { gte: start, lte: end } },
        ],
      },
      orderBy: [{ completedAt: "desc" }, { joinedAt: "desc" }],
    }),
  ]);

  return { waiting, called, doneToday };
}

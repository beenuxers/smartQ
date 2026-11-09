import { prisma } from "./db";

export async function getOutletDailyStats(outletId: string, day = new Date()) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const parties = await prisma.party.findMany({
    where: {
      outletId,
      joinedAt: { gte: start, lte: end },
    },
  });

  const joins = parties.length;
  const seatings = parties.filter((p) => p.status === "seated").length;
  const noShows = parties.filter((p) => p.status === "no_show").length;
  const waitSamples = parties
    .filter((p) => p.seatedAt)
    .map((p) => (p.seatedAt!.getTime() - p.joinedAt.getTime()) / 60000);
  const avgWait =
    waitSamples.length === 0
      ? 0
      : Math.round(
          waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length,
        );

  return { joins, seatings, noShows, avgWait };
}

export async function getWaitingParties(outletId: string) {
  return prisma.party.findMany({
    where: {
      outletId,
      status: { in: ["waiting", "notified"] },
    },
    orderBy: { queueNumber: "asc" },
  });
}

export async function getPartiesAhead(outletId: string, queueNumber: number) {
  return prisma.party.count({
    where: {
      outletId,
      status: { in: ["waiting", "notified"] },
      queueNumber: { lt: queueNumber },
    },
  });
}

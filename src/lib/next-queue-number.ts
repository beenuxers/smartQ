import { prisma } from "./db";
import { getQueueDayWindow } from "./queue-day";

export async function allocateNextQueueNumber(outlet: {
  id: string;
  timezone: string;
  queueDayCutoff: string;
}) {
  const { dayStart, dayEnd } = getQueueDayWindow(
    new Date(),
    outlet.timezone,
    outlet.queueDayCutoff || "04:00",
  );

  const last = await prisma.party.findFirst({
    where: {
      outletId: outlet.id,
      joinedAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { queueNumber: "desc" },
  });

  return {
    queueNumber: (last?.queueNumber ?? 0) + 1,
    dayStart,
    dayEnd,
  };
}

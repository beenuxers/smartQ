import { prisma } from "./db";
import {
  getCalendarMonthWindow,
  getCalendarWeekWindow,
  getQueueDayWindow,
  listRecentQueueDays,
} from "./queue-day";

export type ReportRange = "day" | "week" | "month";

export type OutletReportStats = {
  joins: number;
  seatings: number;
  noShows: number;
  cancels: number;
  notified: number;
  avgWait: number;
  rangeStart: Date;
  rangeEnd: Date;
  label: string;
};

function summarizeParties(
  parties: Array<{
    status: string;
    joinedAt: Date;
    seatedAt: Date | null;
    notifiedAt: Date | null;
  }>,
  rangeStart: Date,
  rangeEnd: Date,
  label: string,
): OutletReportStats {
  const joins = parties.length;
  const seatings = parties.filter((p) => p.status === "seated").length;
  const noShows = parties.filter((p) => p.status === "no_show").length;
  const cancels = parties.filter((p) => p.status === "cancelled").length;
  const notified = parties.filter((p) => p.notifiedAt != null).length;
  const waitSamples = parties
    .filter((p) => p.seatedAt)
    .map((p) => (p.seatedAt!.getTime() - p.joinedAt.getTime()) / 60000);
  const avgWait =
    waitSamples.length === 0
      ? 0
      : Math.round(waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length);

  return {
    joins,
    seatings,
    noShows,
    cancels,
    notified,
    avgWait,
    rangeStart,
    rangeEnd,
    label,
  };
}

export async function getOutletReportStats(
  outletId: string,
  opts: {
    timezone: string;
    queueDayCutoff: string;
    range: ReportRange;
    now?: Date;
  },
): Promise<OutletReportStats> {
  const now = opts.now ?? new Date();
  let rangeStart: Date;
  let rangeEnd: Date;
  let label: string;

  if (opts.range === "week") {
    const w = getCalendarWeekWindow(now, opts.timezone);
    rangeStart = w.start;
    rangeEnd = w.end;
    label = w.label;
  } else if (opts.range === "month") {
    const m = getCalendarMonthWindow(now, opts.timezone);
    rangeStart = m.start;
    rangeEnd = m.end;
    label = m.label;
  } else {
    const d = getQueueDayWindow(now, opts.timezone, opts.queueDayCutoff);
    rangeStart = d.dayStart;
    rangeEnd = d.dayEnd;
    label = d.label;
  }

  const parties = await prisma.party.findMany({
    where: {
      outletId,
      joinedAt: { gte: rangeStart, lt: rangeEnd },
    },
  });

  return summarizeParties(parties, rangeStart, rangeEnd, label);
}

/** @deprecated prefer getOutletReportStats — kept for call sites expecting old shape */
export async function getOutletDailyStats(
  outletId: string,
  day = new Date(),
  outletMeta?: { timezone: string; queueDayCutoff: string },
) {
  let timezone = outletMeta?.timezone;
  let queueDayCutoff = outletMeta?.queueDayCutoff;
  if (!timezone || !queueDayCutoff) {
    const outlet = await prisma.outlet.findUniqueOrThrow({
      where: { id: outletId },
      select: { timezone: true, queueDayCutoff: true },
    });
    timezone = timezone ?? outlet.timezone;
    queueDayCutoff = queueDayCutoff ?? outlet.queueDayCutoff;
  }

  const stats = await getOutletReportStats(outletId, {
    timezone,
    queueDayCutoff: queueDayCutoff || "04:00",
    range: "day",
    now: day,
  });
  return {
    joins: stats.joins,
    seatings: stats.seatings,
    noShows: stats.noShows,
    avgWait: stats.avgWait,
  };
}

export async function getQueueDayTrend(
  outletId: string,
  opts: { timezone: string; queueDayCutoff: string; days?: number; now?: Date },
) {
  const windows = listRecentQueueDays(
    opts.now ?? new Date(),
    opts.timezone,
    opts.queueDayCutoff || "04:00",
    opts.days ?? 7,
  );

  const rows = [];
  for (const w of windows) {
    const parties = await prisma.party.findMany({
      where: {
        outletId,
        joinedAt: { gte: w.dayStart, lt: w.dayEnd },
      },
      select: { status: true },
    });
    rows.push({
      label: w.label,
      joins: parties.length,
      seatings: parties.filter((p) => p.status === "seated").length,
    });
  }
  return rows;
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

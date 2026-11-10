export type QueueDayWindow = {
  dayStart: Date;
  dayEnd: Date;
  /** YYYY-MM-DD label of the queue day in outlet TZ (the calendar date of dayStart local). */
  label: string;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseCutoff(cutoff: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(cutoff.trim());
  if (!match) return { hour: 4, minute: 0 };
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Interpret a wall-clock time in `timeZone` as a UTC Date. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  // Iterate a few times to converge on correct offset (DST-safe enough for HH:mm).
  let instant = utcGuess;
  for (let i = 0; i < 3; i++) {
    const z = getZonedParts(new Date(instant), timeZone);
    const asLocalMs = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, 0);
    const desiredMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    instant += desiredMs - asLocalMs;
  }
  return new Date(instant);
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Queue business day: runs from cutoff → cutoff+24h in the outlet timezone.
 * Before cutoff, still counts as the previous queue day.
 */
export function getQueueDayWindow(
  now: Date,
  timeZone: string,
  queueDayCutoff = "04:00",
): QueueDayWindow {
  const tz = timeZone || "Asia/Singapore";
  const { hour: cutH, minute: cutM } = parseCutoff(queueDayCutoff || "04:00");
  const z = getZonedParts(now, tz);

  const minutesNow = z.hour * 60 + z.minute;
  const minutesCut = cutH * 60 + cutM;
  const startDate =
    minutesNow < minutesCut
      ? addCalendarDays(z.year, z.month, z.day, -1)
      : { year: z.year, month: z.month, day: z.day };
  const endDate = addCalendarDays(startDate.year, startDate.month, startDate.day, 1);

  const dayStart = zonedWallTimeToUtc(
    startDate.year,
    startDate.month,
    startDate.day,
    cutH,
    cutM,
    tz,
  );
  const dayEnd = zonedWallTimeToUtc(
    endDate.year,
    endDate.month,
    endDate.day,
    cutH,
    cutM,
    tz,
  );

  const label = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
  return { dayStart, dayEnd, label };
}

/** Calendar week (Mon–Sun) in outlet TZ containing `now`, as UTC bounds. */
export function getCalendarWeekWindow(now: Date, timeZone: string) {
  const tz = timeZone || "Asia/Singapore";
  const z = getZonedParts(now, tz);
  // en-US weekday: use UTC noon trick via formatter
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(now);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offsetFromMon = map[weekday] ?? 0;
  const monday = addCalendarDays(z.year, z.month, z.day, -offsetFromMon);
  const nextMonday = addCalendarDays(monday.year, monday.month, monday.day, 7);
  return {
    start: zonedWallTimeToUtc(monday.year, monday.month, monday.day, 0, 0, tz),
    end: zonedWallTimeToUtc(
      nextMonday.year,
      nextMonday.month,
      nextMonday.day,
      0,
      0,
      tz,
    ),
    label: `${monday.year}-${String(monday.month).padStart(2, "0")}-${String(monday.day).padStart(2, "0")}`,
  };
}

/** Calendar month in outlet TZ containing `now`. */
export function getCalendarMonthWindow(now: Date, timeZone: string) {
  const tz = timeZone || "Asia/Singapore";
  const z = getZonedParts(now, tz);
  const nextMonth =
    z.month === 12
      ? { year: z.year + 1, month: 1, day: 1 }
      : { year: z.year, month: z.month + 1, day: 1 };
  return {
    start: zonedWallTimeToUtc(z.year, z.month, 1, 0, 0, tz),
    end: zonedWallTimeToUtc(nextMonth.year, nextMonth.month, 1, 0, 0, tz),
    label: `${z.year}-${String(z.month).padStart(2, "0")}`,
  };
}

/** Previous N queue-day windows ending with the current one (oldest first). */
export function listRecentQueueDays(
  now: Date,
  timeZone: string,
  queueDayCutoff: string,
  count: number,
): QueueDayWindow[] {
  const days: QueueDayWindow[] = [];
  let cursor = now;
  for (let i = 0; i < count; i++) {
    const w = getQueueDayWindow(cursor, timeZone, queueDayCutoff);
    days.push(w);
    cursor = new Date(w.dayStart.getTime() - 60_000);
  }
  return days.reverse();
}

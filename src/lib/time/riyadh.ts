// Single source of truth for Saudi local time. Storage stays UTC everywhere;
// only bucketing/display converts to Asia/Riyadh.
export const RIYADH_TZ = "Asia/Riyadh";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export interface RiyadhParts {
  /** 0 = Sunday, matching Postgres EXTRACT(DOW). */
  dayOfWeek: number;
  hour: number;
  minute: number;
  day: number;
  month: number;
  year: number;
}

export function riyadhParts(date: Date = new Date()): RiyadhParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RIYADH_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour"));
  return {
    dayOfWeek: WEEKDAY_INDEX[get("weekday")] ?? 0,
    hour: hour === 24 ? 0 : hour,
    minute: Number(get("minute")),
    day: Number(get("day")),
    month: Number(get("month")),
    year: Number(get("year")),
  };
}

/** Day-of-week + hour bucket for a moment `minutesAhead` in the future. */
export function riyadhBucketAhead(minutesAhead: number, from: Date = new Date()) {
  const target = new Date(from.getTime() + minutesAhead * 60_000);
  const p = riyadhParts(target);
  return { dayOfWeek: p.dayOfWeek, hour: p.hour, at: target };
}

export function formatRiyadhTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: RIYADH_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Reset-adjusted charting day logic (MI-15, schema decision from MI-9; timezone
 * & DST hardening in MI-25).
 *
 * The charting day is always computed in the **household's** timezone
 * (`settings.timezone`), never each device's local time. That single fixed zone
 * is what makes both spouses agree on "today" even when they're physically in
 * different timezones or travelling — and it's why timestamps are stored in UTC
 * and converted on read. `Intl` gives DST-aware wall-clock time in the zone, and
 * the day arithmetic below is calendar-date-only, so DST transitions never skip
 * or duplicate a chart day.
 */

/** Wall-clock fields (numeric) that `now` shows in `timeZone`, DST-aware. */
function wallClockInTimeZone(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  let hour = get("hour");
  // Some engines emit "24" for midnight under hour12:false; normalize to 0.
  if (hour === 24) hour = 0;
  return { year: get("year"), month: get("month"), day: get("day"), hour, minute: get("minute"), second: get("second") };
}

/**
 * The charting date (`YYYY-MM-DD`) that `now` falls in, in the household zone.
 * A moment before the reset time belongs to the previous charting day.
 */
export function chartDateFor(now: Date, resetTime: string, timeZone: string): string {
  const wall = wallClockInTimeZone(now, timeZone);
  let { year, month, day } = wall;
  const secondsOfDay = wall.hour * 3600 + wall.minute * 60 + wall.second;

  if (secondsOfDay < parseTimeToSeconds(resetTime)) {
    // Before today's reset → still the previous charting day.
    const prev = new Date(Date.UTC(year, month - 1, day));
    prev.setUTCDate(prev.getUTCDate() - 1);
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth() + 1;
    day = prev.getUTCDate();
  }

  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/**
 * UTC instant for **midday in `timeZone`** on `chartDate` (`YYYY-MM-DD`), as an
 * ISO string. Used to place an edit-added intercourse event (MI-23) solidly
 * inside its target charting day for any timezone — midday is far from any reset
 * boundary, so `chartDateFor` always buckets the event back to `chartDate`.
 *
 * Computed with a single offset correction: interpret noon as if it were UTC,
 * see what wall-clock that instant shows in the zone, and shift by the gap. Noon
 * is never inside a DST gap/overlap, so the wall time is unambiguous.
 */
export function zonedNoonToUtc(chartDate: string, timeZone: string): string {
  const [y, mo, d] = chartDate.split("-").map(Number);
  const noonAsUtc = Date.UTC(y, mo - 1, d, 12, 0, 0);
  const seen = wallClockInTimeZone(new Date(noonAsUtc), timeZone);
  const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
  const offset = seenAsUtc - noonAsUtc; // how far the zone is ahead of UTC
  return new Date(noonAsUtc - offset).toISOString();
}

function parseTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Shift a `YYYY-MM-DD` chart date by `days` (negative = earlier). DST-safe (UTC math). */
export function addChartDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1, 2)}-${pad(
    shifted.getUTCDate(),
    2,
  )}`;
}

/**
 * Inclusive ascending list of chart dates from `start` to `end` (both
 * `YYYY-MM-DD`). Returns `[]` if `start` is after `end`. Used to build a
 * contiguous day-cards column (MI-21), including days with no entry.
 */
export function enumerateChartDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addChartDays(cursor, 1);
  }
  return dates;
}

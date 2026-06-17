/**
 * Reset-adjusted charting date (MI-15, schema decision from MI-9).
 *
 * A "charting day" runs from the household's reset time to the next reset time
 * (e.g. 4:00 AM). A reading taken before the reset belongs to the *previous*
 * calendar day. This returns the chart date as a `YYYY-MM-DD` string computed in
 * the household's timezone — used both to query today's entry and to record it.
 */
export function chartDateFor(now: Date, resetTime: string, timeZone: string): string {
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
  let year = get("year");
  let month = get("month");
  let day = get("day");
  let hour = get("hour");
  // Some engines emit "24" for midnight under hour12:false; normalize to 0.
  if (hour === 24) hour = 0;

  const secondsOfDay = hour * 3600 + get("minute") * 60 + get("second");

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

function parseTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

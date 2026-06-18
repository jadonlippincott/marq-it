import { addChartDays, enumerateChartDates } from "@/lib/chart-date";
import type { ChartEntry, Reading } from "@/lib/chart-data";

/**
 * Day-card model for the Charting column (MI-21).
 *
 * One card per charting day over a contiguous window, oldest first so today is
 * last (the column opens scrolled to the bottom). Each card overlays the day's
 * reading (if any) and intercourse count onto its date.
 */
export type DayCard = {
  chartDate: string;
  reading: Reading | null;
  intercourseCount: number;
  isToday: boolean;
};

/** Minimum number of days the column spans, so there's always something to scroll. */
export const DEFAULT_MIN_DAYS = 30;

/**
 * Build the ascending list of day cards ending at `today`. The window starts at
 * the earliest recorded entry, or `minDays` before today — whichever is earlier
 * — so recorded history is always shown in full and the column never feels
 * empty. `today` is always the last card.
 */
export function buildDayCards({
  today,
  entries,
  intercourseByDate,
  minDays = DEFAULT_MIN_DAYS,
}: {
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
  minDays?: number;
}): DayCard[] {
  const readingByDate = new Map(entries.map((e) => [e.chartDate, e.reading]));

  // Earliest date we must include: oldest entry vs. the minimum window.
  const windowStart = addChartDays(today, -(minDays - 1));
  const earliestEntry = entries.reduce<string | null>(
    (min, e) => (min === null || e.chartDate < min ? e.chartDate : min),
    null,
  );
  const start = earliestEntry && earliestEntry < windowStart ? earliestEntry : windowStart;

  return enumerateChartDates(start, today).map((chartDate) => ({
    chartDate,
    reading: readingByDate.get(chartDate) ?? null,
    intercourseCount: intercourseByDate[chartDate] ?? 0,
    isToday: chartDate === today,
  }));
}

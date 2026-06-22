import { chartDateFor } from "@/lib/chart-date";
import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

/**
 * Charting data layer (MI-20, extended for the day-cards column in MI-21).
 *
 * Resolves the signed-in member's household and its selected protocol, then
 * loads the household's day entries and per-day intercourse counts for the
 * chart. The calendar header (MI-22), edit (MI-23), and Realtime sync (MI-24)
 * build on top of `ChartData`.
 */
export type Protocol = Database["public"]["Enums"]["protocol"];
export type Reading = Database["public"]["Enums"]["reading_type"];

/** One charting day's recorded reading. */
export type ChartEntry = {
  chartDate: string;
  reading: Reading;
};

export type ChartData = {
  householdId: string;
  /** The signed-in member's id — recorded as updated_by/recorded_by on edits. */
  memberId: string;
  protocol: Protocol;
  /** Household reset time + timezone, carried so edits can place/bucket by day. */
  resetTime: string;
  timeZone: string;
  /** Day entries, most-recent first. Empty until the couple records a reading. */
  entries: ChartEntry[];
  /** Intercourse event count keyed by reset-adjusted chart date. */
  intercourseByDate: Record<string, number>;
  /** The current charting day (reset-adjusted) — where the column opens. */
  today: string;
  isEmpty: boolean;
};

/**
 * Load the member's household chart data: protocol, day entries, and per-day
 * intercourse counts. Returns null if the signed-in user has no membership yet.
 */
export async function loadChartData(
  authUserId: string,
  now: Date = new Date(),
): Promise<ChartData | null> {
  const { data: member } = await supabase
    .from("members")
    .select("id, household_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (!member) return null;

  const [settingsResult, entriesResult, intercourseResult] = await Promise.all([
    supabase
      .from("settings")
      .select("protocol, reset_time, timezone")
      .eq("household_id", member.household_id)
      .maybeSingle(),
    supabase
      .from("day_entries")
      .select("chart_date, reading")
      .eq("household_id", member.household_id)
      .order("chart_date", { ascending: false }),
    supabase
      .from("intercourse_events")
      .select("occurred_at")
      .eq("household_id", member.household_id),
  ]);

  const protocol: Protocol = settingsResult.data?.protocol ?? "nursing_mother";
  const resetTime = settingsResult.data?.reset_time ?? "04:00:00";
  const timeZone = settingsResult.data?.timezone ?? "UTC";

  const entries: ChartEntry[] = (entriesResult.data ?? []).map((e) => ({
    chartDate: e.chart_date,
    reading: e.reading,
  }));

  // Bucket each intercourse event into its reset-adjusted chart date — the
  // table stores occurred_at (timestamp), not a chart_date.
  const intercourseByDate: Record<string, number> = {};
  for (const event of intercourseResult.data ?? []) {
    const date = chartDateFor(new Date(event.occurred_at), resetTime, timeZone);
    intercourseByDate[date] = (intercourseByDate[date] ?? 0) + 1;
  }

  return {
    householdId: member.household_id,
    memberId: member.id,
    protocol,
    resetTime,
    timeZone,
    entries,
    intercourseByDate,
    today: chartDateFor(now, resetTime, timeZone),
    isEmpty: entries.length === 0,
  };
}

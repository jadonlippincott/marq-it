import { chartDateFor } from "@/lib/chart-date";
import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

/**
 * Today's shared Low/High/Peak reading (MI-15).
 *
 * Exactly one reading per charting day, shared across both spouses. The chart
 * date is computed client-side from the household settings (reset time + tz);
 * the DB `unique(household_id, chart_date)` constraint is the race tiebreaker.
 */
export type Reading = Database["public"]["Enums"]["reading_type"]; // "low" | "high" | "peak"
export type ReadingLabel = "Low" | "High" | "Peak";

const LABEL_TO_READING: Record<ReadingLabel, Reading> = { Low: "low", High: "high", Peak: "peak" };
const READING_TO_LABEL: Record<Reading, ReadingLabel> = { low: "Low", high: "High", peak: "Peak" };

export function labelToReading(label: ReadingLabel): Reading {
  return LABEL_TO_READING[label];
}
export function readingToLabel(reading: Reading): ReadingLabel {
  return READING_TO_LABEL[reading];
}

/** Postgres unique_violation — another insert won the race for today. */
export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

export type TodayState = {
  householdId: string;
  memberId: string;
  chartDate: string;
  /** Today's recorded reading, or null if not yet recorded (unlocked). */
  reading: Reading | null;
  /** Display name of whoever recorded today's reading, if locked. */
  recordedByName: string | null;
};

/**
 * Resolve the member's household, today's chart date, and today's reading (if
 * any). Returns null if the signed-in user has no membership yet.
 */
export async function loadTodayState(
  authUserId: string,
  now: Date = new Date(),
): Promise<TodayState | null> {
  const { data: member } = await supabase
    .from("members")
    .select("id, household_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (!member) return null;

  const [settingsResult, membersResult] = await Promise.all([
    supabase
      .from("settings")
      .select("reset_time, timezone")
      .eq("household_id", member.household_id)
      .maybeSingle(),
    supabase.from("members").select("id, display_name").eq("household_id", member.household_id),
  ]);

  const resetTime = settingsResult.data?.reset_time ?? "04:00:00";
  const timeZone = settingsResult.data?.timezone ?? "UTC";
  const chartDate = chartDateFor(now, resetTime, timeZone);

  const { data: entry } = await supabase
    .from("day_entries")
    .select("reading, recorded_by")
    .eq("household_id", member.household_id)
    .eq("chart_date", chartDate)
    .maybeSingle();

  const namesById = new Map((membersResult.data ?? []).map((m) => [m.id, m.display_name]));

  return {
    householdId: member.household_id,
    memberId: member.id,
    chartDate,
    reading: entry?.reading ?? null,
    recordedByName: entry?.recorded_by ? (namesById.get(entry.recorded_by) ?? null) : null,
  };
}

export type RecordResult = { ok: boolean; conflict: boolean; error: string | null };

/**
 * Record today's reading. On a unique-violation (the spouse recorded first in a
 * race) returns `{ conflict: true }` — the caller should reload to show the
 * winning reading rather than treat it as an error.
 */
export async function recordReading(state: TodayState, reading: Reading): Promise<RecordResult> {
  const { error } = await supabase.from("day_entries").insert({
    household_id: state.householdId,
    chart_date: state.chartDate,
    reading,
    recorded_by: state.memberId,
  });
  if (!error) return { ok: true, conflict: false, error: null };
  if (isUniqueViolation(error)) return { ok: false, conflict: true, error: null };
  return { ok: false, conflict: false, error: error.message };
}

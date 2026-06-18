import { chartDateFor } from "@/lib/chart-date";
import { supabase } from "@/lib/supabase";

/**
 * Intercourse events (MI-16).
 *
 * Unlike the once-per-day reading (MI-15), intercourse is unrestricted: many
 * events per charting day, never locked. Each tap inserts one timestamped row.
 * The table stores `occurred_at` (not a chart_date), so "today's count" is the
 * set of events whose reset-adjusted chart date equals today's — computed with
 * the same `chartDateFor` the reading lock uses, keeping the day boundary (and
 * DST handling) consistent across the app.
 */

/**
 * Events older than this can never belong to the current charting day, so we
 * bound the count query to a recent window rather than scanning all history.
 * 26h comfortably covers a full 24h charting day plus any reset-time offset.
 */
const RECENT_WINDOW_MS = 26 * 60 * 60 * 1000;

export type RecordIntercourseResult = { ok: boolean; error: string | null };

/** Record one intercourse event for the household at the current time. */
export async function recordIntercourse(
  householdId: string,
  memberId: string,
): Promise<RecordIntercourseResult> {
  const { error } = await supabase.from("intercourse_events").insert({
    household_id: householdId,
    recorded_by: memberId,
    // occurred_at defaults to now() server-side.
  });
  return error ? { ok: false, error: error.message } : { ok: true, error: null };
}

/**
 * Count today's intercourse events for the household. Fetches the recent window
 * and keeps only events whose chart date matches `chartDate`, so the count
 * respects the household's reset time rather than calendar midnight.
 */
export async function countTodayIntercourse(
  householdId: string,
  chartDate: string,
  resetTime: string,
  timeZone: string,
  now: Date = new Date(),
): Promise<number> {
  const since = new Date(now.getTime() - RECENT_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("intercourse_events")
    .select("occurred_at")
    .eq("household_id", householdId)
    .gte("occurred_at", since);

  return (data ?? []).filter(
    (e) => chartDateFor(new Date(e.occurred_at), resetTime, timeZone) === chartDate,
  ).length;
}

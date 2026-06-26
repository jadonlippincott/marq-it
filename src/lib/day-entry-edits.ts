import { chartDateFor, zonedNoonToUtc } from "@/lib/chart-date";
import type { Reading } from "@/lib/chart-data";
import { supabase } from "@/lib/supabase";

/**
 * Editing a day's entry from the Charting page (MI-23).
 *
 * Corrects readings and intercourse counts for any day in the chart. Reading
 * edits go through the day_entries `unique(household_id, chart_date)` constraint
 * (so a change is an update, never a duplicate — the one-reading-per-day rule),
 * stamping `updated_by` as a lightweight audit. Intercourse is a set of
 * timestamped events: increment inserts one placed inside the target chart day,
 * decrement removes one from it. Conflict resolution between spouses is
 * last-write-wins for now (Realtime reconciliation is MI-24).
 */
export type EditResult = { ok: boolean; error: string | null };

/** Set (or change) the reading for a day. Upsert preserves recorded_by on update. */
export async function setReading(
  householdId: string,
  chartDate: string,
  memberId: string,
  reading: Reading,
): Promise<EditResult> {
  const { error } = await supabase
    .from("day_entries")
    .upsert(
      { household_id: householdId, chart_date: chartDate, reading, updated_by: memberId },
      { onConflict: "household_id,chart_date" },
    );
  return error ? { ok: false, error: error.message } : { ok: true, error: null };
}

/** Clear the reading for a day by removing its entry. */
export async function clearReading(householdId: string, chartDate: string): Promise<EditResult> {
  const { error } = await supabase
    .from("day_entries")
    .delete()
    .eq("household_id", householdId)
    .eq("chart_date", chartDate);
  return error ? { ok: false, error: error.message } : { ok: true, error: null };
}

/**
 * Add one intercourse event to a day, placed at midday in the household timezone
 * so it buckets into the target chart day regardless of timezone (MI-25).
 */
export async function incrementIntercourse(
  householdId: string,
  chartDate: string,
  memberId: string,
  timeZone: string,
): Promise<EditResult> {
  const { error } = await supabase.from("intercourse_events").insert({
    household_id: householdId,
    recorded_by: memberId,
    occurred_at: zonedNoonToUtc(chartDate, timeZone),
  });
  return error ? { ok: false, error: error.message } : { ok: true, error: null };
}

/**
 * Remove one intercourse event from a day. Finds an event whose reset-adjusted
 * chart date matches and deletes it by id; a no-op (ok) if the day has none.
 */
export async function decrementIntercourse(
  householdId: string,
  chartDate: string,
  resetTime: string,
  timeZone: string,
): Promise<EditResult> {
  const { data, error: fetchError } = await supabase
    .from("intercourse_events")
    .select("id, occurred_at")
    .eq("household_id", householdId);
  if (fetchError) return { ok: false, error: fetchError.message };

  const match = (data ?? []).find(
    (e) => chartDateFor(new Date(e.occurred_at), resetTime, timeZone) === chartDate,
  );
  if (!match) return { ok: true, error: null };

  const { error } = await supabase.from("intercourse_events").delete().eq("id", match.id);
  return error ? { ok: false, error: error.message } : { ok: true, error: null };
}

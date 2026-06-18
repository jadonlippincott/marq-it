import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

/**
 * Charting data layer (MI-20).
 *
 * Resolves the signed-in member's household and its selected protocol, then
 * loads the household's day entries for the chart. This is the scaffold's data
 * source — the day-cards column (MI-21), calendar header (MI-22), edit (MI-23),
 * and Realtime sync (MI-24) build on top of `ChartData`.
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
  protocol: Protocol;
  /** Day entries, most-recent first. Empty until the couple records a reading. */
  entries: ChartEntry[];
  isEmpty: boolean;
};

/**
 * Load the member's household chart data: selected protocol + day entries.
 * Returns null if the signed-in user has no membership yet.
 */
export async function loadChartData(authUserId: string): Promise<ChartData | null> {
  const { data: member } = await supabase
    .from("members")
    .select("household_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (!member) return null;

  const [settingsResult, entriesResult] = await Promise.all([
    supabase
      .from("settings")
      .select("protocol")
      .eq("household_id", member.household_id)
      .maybeSingle(),
    supabase
      .from("day_entries")
      .select("chart_date, reading")
      .eq("household_id", member.household_id)
      .order("chart_date", { ascending: false }),
  ]);

  const protocol: Protocol = settingsResult.data?.protocol ?? "nursing_mother";
  const entries: ChartEntry[] = (entriesResult.data ?? []).map((e) => ({
    chartDate: e.chart_date,
    reading: e.reading,
  }));

  return {
    householdId: member.household_id,
    protocol,
    entries,
    isEmpty: entries.length === 0,
  };
}

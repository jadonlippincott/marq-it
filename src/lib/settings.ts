import type { Protocol } from "@/lib/chart-data";
import { supabase } from "@/lib/supabase";

export type HouseholdSettings = {
  householdId: string;
  resetTime: string;
  timezone: string;
  protocol: Protocol;
};

export async function loadSettings(authUserId: string): Promise<HouseholdSettings | null> {
  const { data: member } = await supabase
    .from("members")
    .select("id, household_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (!member) return null;

  const { data } = await supabase
    .from("settings")
    .select("protocol, reset_time, timezone")
    .eq("household_id", member.household_id)
    .maybeSingle();

  return {
    householdId: member.household_id,
    resetTime: data?.reset_time ?? "04:00:00",
    timezone: data?.timezone ?? "UTC",
    protocol: data?.protocol ?? "nursing_mother",
  };
}

export async function saveResetTime(
  householdId: string,
  resetTime: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { household_id: householdId, reset_time: resetTime, updated_at: new Date().toISOString() },
      { onConflict: "household_id" },
    );
  return { error: error?.message ?? null };
}

export async function saveProtocol(
  householdId: string,
  protocol: Protocol,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { household_id: householdId, protocol, updated_at: new Date().toISOString() },
      { onConflict: "household_id" },
    );
  return { error: error?.message ?? null };
}

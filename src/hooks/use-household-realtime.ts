import { useEffect, useId, useRef } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Subscribe to a household's shared charting data over Supabase Realtime (MI-24).
 *
 * Fires `onChange` whenever this household's day_entries or intercourse_events
 * change, so both spouses' devices stay in sync without a manual refresh. RLS
 * scopes delivery to the member's own household. One channel per household, torn
 * down on unmount or when `householdId` clears — keeping the live subscription's
 * battery/network cost bounded to the screens that need it.
 *
 * Shared by the Home (use-today-reading) and Charting (use-chart-data) hooks.
 */
const TABLES = ["day_entries", "intercourse_events"] as const;

export function useHouseholdRealtime(
  householdId: string | null | undefined,
  onChange: () => void,
) {
  // Hold the latest callback in a ref so the subscription only re-runs when the
  // household changes, not on every render the caller re-creates onChange.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Unique per hook instance: Home and Charting can be mounted at the same time
  // (Charting pushed over Home), and Supabase reuses a channel by topic name —
  // a shared name would make the second mount add callbacks to an already-
  // subscribed channel, which throws. useId keeps each subscriber's topic distinct.
  const instanceId = useId();

  useEffect(() => {
    if (!householdId) return;
    const filter = `household_id=eq.${householdId}`;
    let channel = supabase.channel(`household:${householdId}:${instanceId}`);
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => {
          onChangeRef.current();
        },
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, instanceId]);
}

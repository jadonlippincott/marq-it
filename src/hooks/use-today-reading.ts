import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  type ReadingLabel,
  type TodayState,
  labelToReading,
  loadTodayState,
  recordReading,
} from "@/lib/today-reading";

/**
 * Drives the Home Low/High/Peak shared lock (MI-15).
 *
 * Loads today's reading for the household, records a new one (no-op once
 * locked), and subscribes to Realtime changes on day_entries so the lock syncs
 * to the other spouse's device within seconds. After recording — including a
 * race conflict — it reloads to reflect the authoritative server state.
 */
export function useTodayReading() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const next = await (userId ? loadTodayState(userId) : Promise.resolve(null));
    setState(next);
    setLoading(false);
  }, [userId]);

  // Initial load / reload on auth change. Inline async loader so state updates
  // happen after an await, never synchronously within the effect.
  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await (userId ? loadTodayState(userId) : Promise.resolve(null));
      if (active) {
        setState(next);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Realtime: reload whenever this household's day_entries change. RLS scopes
  // delivery to the member's own household.
  useEffect(() => {
    const householdId = state?.householdId;
    if (!householdId) return;
    const channel = supabase
      .channel(`day_entries:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_entries", filter: `household_id=eq.${householdId}` },
        () => {
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [state?.householdId, refresh]);

  // Re-evaluate on foreground so crossing the reset time (or opening the app the
  // next morning) recomputes today's chart_date and unlocks for the new day.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        refresh();
      }
    });
    return () => {
      sub.remove();
    };
  }, [refresh]);

  const record = useCallback(
    async (label: ReadingLabel) => {
      if (!state || state.reading || saving) return;
      setSaving(true);
      await recordReading(state, labelToReading(label));
      await refresh();
      setSaving(false);
    },
    [state, saving, refresh],
  );

  return {
    loading,
    saving,
    hasHousehold: state !== null,
    reading: state?.reading ?? null,
    recordedByName: state?.recordedByName ?? null,
    record,
  };
}

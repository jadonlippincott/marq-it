import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { useHouseholdRealtime } from "@/hooks/use-household-realtime";
import { useAuth } from "@/lib/auth";
import { recordIntercourse } from "@/lib/intercourse";
import {
  type ReadingLabel,
  type TodayState,
  labelToReading,
  loadTodayState,
  recordReading,
} from "@/lib/today-reading";

/**
 * Drives the Home action buttons: the Low/High/Peak shared lock (MI-15) and the
 * unrestricted intercourse tally (MI-16).
 *
 * Loads today's reading + intercourse count for the household, records new ones,
 * and subscribes to Realtime changes on both day_entries and intercourse_events
 * so the lock and the count sync to the other spouse's device within seconds.
 * Intercourse never locks; taps bump an optimistic count immediately and are
 * reconciled to the authoritative server count on the following reload.
 */
export function useTodayReading() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Displayed intercourse count, kept locally so optimistic taps feel instant;
  // re-synced from the authoritative state on every load.
  const [intercourseCount, setIntercourseCount] = useState(0);

  const refresh = useCallback(async () => {
    const next = await (userId ? loadTodayState(userId) : Promise.resolve(null));
    setState(next);
    setIntercourseCount(next?.intercourseCount ?? 0);
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
        setIntercourseCount(next?.intercourseCount ?? 0);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Realtime: reload whenever this household's day_entries or intercourse_events
  // change, so the lock and count sync to the other spouse within seconds.
  useHouseholdRealtime(state?.householdId, refresh);

  // Re-evaluate on foreground so crossing the reset time (or opening the app the
  // next morning) recomputes today's chart_date — unlocking the reading and
  // resetting the intercourse count for the new day.
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

  const recordIntercourseEvent = useCallback(async () => {
    if (!state) return;
    setIntercourseCount((c) => c + 1); // optimistic; reconciled by refresh
    await recordIntercourse(state.householdId, state.memberId);
    await refresh();
  }, [state, refresh]);

  return {
    loading,
    saving,
    hasHousehold: state !== null,
    reading: state?.reading ?? null,
    recordedByName: state?.recordedByName ?? null,
    intercourseCount,
    record,
    recordIntercourse: recordIntercourseEvent,
  };
}

import { useCallback, useEffect, useState } from "react";

import { useHouseholdRealtime } from "@/hooks/use-household-realtime";
import { useAuth } from "@/lib/auth";
import { type ChartData, loadChartData } from "@/lib/chart-data";

/**
 * Loads the household's charting data for the Charting page (MI-20).
 *
 * Follows the codebase's hook-based fetch pattern (see use-today-reading).
 * Exposes `refresh` so edits (MI-23) reflect immediately, and subscribes to
 * Realtime (MI-24) so a tap or edit on the other spouse's device propagates to
 * the chart without a manual refresh.
 */
export function useChartData() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await (userId ? loadChartData(userId) : Promise.resolve(null));
    setData(next);
  }, [userId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await (userId ? loadChartData(userId) : Promise.resolve(null));
      if (active) {
        setData(next);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Live-sync the chart to the other spouse's taps and edits.
  useHouseholdRealtime(data?.householdId, refresh);

  return {
    loading,
    hasHousehold: data !== null,
    householdId: data?.householdId ?? null,
    memberId: data?.memberId ?? null,
    protocol: data?.protocol ?? null,
    resetTime: data?.resetTime ?? null,
    timeZone: data?.timeZone ?? null,
    entries: data?.entries ?? [],
    intercourseByDate: data?.intercourseByDate ?? {},
    today: data?.today ?? null,
    isEmpty: data?.isEmpty ?? true,
    refresh,
  };
}

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { type ChartData, loadChartData } from "@/lib/chart-data";

/**
 * Loads the household's charting data for the Charting page (MI-20).
 *
 * Follows the codebase's hook-based fetch pattern (see use-today-reading). The
 * Realtime subscription that keeps the chart in sync between spouses is a
 * separate concern — it lands in MI-24; this hook is load-on-mount for now.
 */
export function useChartData() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return {
    loading,
    hasHousehold: data !== null,
    protocol: data?.protocol ?? null,
    entries: data?.entries ?? [],
    intercourseByDate: data?.intercourseByDate ?? {},
    today: data?.today ?? null,
    isEmpty: data?.isEmpty ?? true,
  };
}

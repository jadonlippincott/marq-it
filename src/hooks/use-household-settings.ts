import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/lib/auth";
import { type HouseholdSettings, loadSettings, saveResetTime } from "@/lib/settings";
import { supabase } from "@/lib/supabase";

/**
 * Loads and saves household settings for the Settings screen (MI-17).
 *
 * Subscribes to Realtime on the `settings` table so a reset-time change made
 * by one spouse propagates to the other device without a manual refresh.
 */
export function useHouseholdSettings() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [settings, setSettings] = useState<HouseholdSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await (userId ? loadSettings(userId) : Promise.resolve(null));
    setSettings(next);
  }, [userId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await (userId ? loadSettings(userId) : Promise.resolve(null));
      if (active) {
        setSettings(next);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Hold the latest refresh in a ref so the Realtime subscription doesn't
  // re-run every time refresh is recreated (mirrors use-household-realtime).
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  const instanceId = useId();

  useEffect(() => {
    if (!settings?.householdId) return;
    const channel = supabase
      .channel(`settings:${settings.householdId}:${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: `household_id=eq.${settings.householdId}`,
        },
        () => {
          refreshRef.current();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings?.householdId, instanceId]);

  const updateResetTime = useCallback(
    async (newResetTime: string) => {
      if (!settings?.householdId) return;
      setError(null);
      setSaving(true);
      const { error: saveError } = await saveResetTime(settings.householdId, newResetTime);
      if (saveError) {
        setError(saveError);
      } else {
        await refresh();
      }
      setSaving(false);
    },
    [settings?.householdId, refresh],
  );

  return { loading, saving, error, settings, updateResetTime };
}

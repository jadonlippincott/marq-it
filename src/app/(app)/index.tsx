import { Link } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { ActionButtons, type Action } from "@/components/action-buttons";
import { Screen } from "@/components/screen";
import { useTodayReading } from "@/hooks/use-today-reading";
import { readingToLabel } from "@/lib/today-reading";

/**
 * Home — the landing hub (MI-14) with the once-per-day shared reading lock
 * (MI-15). Tapping Low/High/Peak records today's reading and locks all three
 * for both spouses (synced via Realtime) until the next reset time. Editing is
 * on the Charting page (MI-23) — Home is record-only. Intercourse is MI-16.
 */
export default function HomeScreen() {
  const { loading, reading, recordedByName, record } = useTodayReading();
  const lockedReading = reading ? readingToLabel(reading) : null;

  function onAction(action: Action) {
    if (action === "Intercourse") return; // MI-16
    record(action); // narrowed to Low | High | Peak
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-10">
        <View className="gap-1">
          <Text className="text-center text-sm font-medium uppercase tracking-widest text-gray-400">
            Today
          </Text>
          <Text className="text-center text-2xl font-bold text-gray-900">Log a reading</Text>
        </View>

        {loading ? (
          <View className="min-h-60 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <View className="gap-3">
            <ActionButtons onPress={onAction} lockedReading={lockedReading} />
            <Text className="text-center text-sm text-gray-500">
              {lockedReading
                ? `Today's reading is ${lockedReading}${
                    recordedByName ? ` (recorded by ${recordedByName})` : ""
                  }. Edit it on the chart.`
                : "Tap to record today's reading — one per day, shared with your spouse."}
            </Text>
          </View>
        )}

        <View className="gap-3">
          <Link href="/charting" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View chart"
              className="min-h-12 items-center justify-center rounded-2xl border border-gray-300 active:bg-gray-100"
            >
              <Text className="text-base font-semibold text-gray-900">View chart</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              className="min-h-12 items-center justify-center rounded-2xl border border-gray-300 active:bg-gray-100"
            >
              <Text className="text-base font-semibold text-gray-900">Settings</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

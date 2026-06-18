import { Text, View } from "react-native";

import type { ChartEntry } from "@/lib/chart-data";

/**
 * Nursing Mother (10-day) chart view — scaffold (MI-20).
 *
 * Renders the chart container and an empty state. The scrollable day-cards
 * column lands in MI-21 (it will consume `entries`), the calendar mini-view
 * header in MI-22, and per-card editing in MI-23 — all mount inside this view.
 */
export function NursingMotherChart({
  entries,
  isEmpty,
}: {
  entries: ChartEntry[];
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <View testID="nursing-mother-chart" className="flex-1 items-center justify-center gap-2">
        <Text className="text-lg font-semibold text-gray-900">No entries yet</Text>
        <Text className="px-8 text-center text-sm text-gray-500">
          Record today&apos;s reading from Home and it will appear here on your chart.
        </Text>
      </View>
    );
  }

  return (
    <View testID="nursing-mother-chart" className="flex-1 gap-2">
      <Text className="text-sm font-medium uppercase tracking-widest text-gray-400">
        Nursing Mother
      </Text>
      {/* Day-cards column renders here (MI-21); calendar header above (MI-22). */}
      <Text className="text-sm text-gray-500">
        {entries.length} {entries.length === 1 ? "day" : "days"} charted.
      </Text>
    </View>
  );
}

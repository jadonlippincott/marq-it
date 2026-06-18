import { Text, View } from "react-native";

import { DayCardsColumn } from "@/components/charting/day-cards-column";
import type { ChartEntry } from "@/lib/chart-data";
import { buildDayCards } from "@/lib/day-cards";

/**
 * Nursing Mother (10-day) chart view (MI-20 scaffold, MI-21 day-cards column).
 *
 * Renders the scrollable day-cards column (one card per charting day, opening on
 * today) or an empty state before any reading is recorded. The calendar mini-view
 * header (MI-22) and per-card editing (MI-23) mount inside this view next.
 */
export function NursingMotherChart({
  today,
  entries,
  intercourseByDate,
  isEmpty,
}: {
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
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

  const cards = buildDayCards({ today, entries, intercourseByDate });

  return (
    <View testID="nursing-mother-chart" className="flex-1 gap-2">
      <Text className="text-sm font-medium uppercase tracking-widest text-gray-400">
        Nursing Mother
      </Text>
      {/* Calendar mini-view header mounts above the column in MI-22. */}
      <DayCardsColumn cards={cards} />
    </View>
  );
}

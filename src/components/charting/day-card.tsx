import { Pressable, Text, View } from "react-native";

import type { DayCard as DayCardModel } from "@/lib/day-cards";
import type { Reading } from "@/lib/chart-data";

/** Fixed card height — shared with the column's getItemLayout for scroll-to-today. */
export const DAY_CARD_HEIGHT = 76;

const READING_STYLE: Record<Reading, { badge: string; label: string; text: string }> = {
  low: { badge: "bg-reading-low", label: "Low", text: "text-white" },
  high: { badge: "bg-reading-high", label: "High", text: "text-gray-900" },
  peak: { badge: "bg-reading-peak", label: "Peak", text: "text-white" },
};

/** Format a `YYYY-MM-DD` chart date as e.g. "Mon, Jun 10" without timezone drift. */
function formatChartDate(chartDate: string): string {
  const [y, m, d] = chartDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function DayCard({ card, onPress }: { card: DayCardModel; onPress?: () => void }) {
  const reading = card.reading ? READING_STYLE[card.reading] : null;

  return (
    <Pressable
      testID={`day-card-${card.chartDate}`}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${card.chartDate}`}
      onPress={onPress}
      style={{ height: DAY_CARD_HEIGHT }}
      className={`flex-row items-center justify-between rounded-2xl border px-4 active:opacity-70 ${
        card.isToday ? "border-2 border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <View className="gap-0.5">
        <Text className="text-base font-semibold text-gray-900">{formatChartDate(card.chartDate)}</Text>
        {card.isToday ? (
          <Text className="text-xs font-medium uppercase tracking-wide text-blue-600">Today</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        {card.intercourseCount > 0 ? (
          <Text testID={`day-card-intercourse-${card.chartDate}`} className="text-sm text-gray-500">
            ♥ {card.intercourseCount}
          </Text>
        ) : null}
        {reading ? (
          <View className={`rounded-full px-3 py-1 ${reading.badge}`}>
            <Text className={`text-sm font-bold ${reading.text}`}>{reading.label}</Text>
          </View>
        ) : (
          <Text className="text-sm text-gray-300">—</Text>
        )}
      </View>
    </Pressable>
  );
}

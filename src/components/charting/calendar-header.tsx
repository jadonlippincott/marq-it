import { useEffect, useRef } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { type DayCard as DayCardModel, hasActivity, indexOfChartDate } from "@/lib/day-cards";

const CHIP_WIDTH = 48;
const CHIP_GAP = 8;

/** Split a `YYYY-MM-DD` chart date into a weekday abbrev + day number, UTC-safe. */
function chipLabels(chartDate: string): { weekday: string; day: string } {
  const [y, m, d] = chartDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date),
    day: String(d),
  };
}

/**
 * Calendar mini-view header (MI-22) — a horizontal week strip of date chips.
 *
 * Built from the same day cards as the column, so it shows the chart's range,
 * highlights today, rings the selected date, and dots days with a reading or
 * intercourse. Tapping a chip selects that date; the strip auto-centers on the
 * selected date so it tracks both taps and column scrolling (two-way sync).
 */
export function CalendarHeader({
  cards,
  selectedDate,
  onSelectDate,
}: {
  cards: DayCardModel[];
  selectedDate: string;
  onSelectDate: (chartDate: string) => void;
}) {
  const listRef = useRef<FlatList<DayCardModel>>(null);

  // Keep the selected date centered as it changes (tap or column scroll).
  useEffect(() => {
    const index = indexOfChartDate(cards, selectedDate);
    if (index >= 0) listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
  }, [cards, selectedDate]);

  return (
    <FlatList
      ref={listRef}
      testID="calendar-header"
      horizontal
      data={cards}
      keyExtractor={(card) => card.chartDate}
      getItemLayout={(_, index) => ({
        length: CHIP_WIDTH + CHIP_GAP,
        offset: (CHIP_WIDTH + CHIP_GAP) * index,
        index,
      })}
      onScrollToIndexFailed={() => {
        // Best-effort: the effect retries on the next render.
      }}
      ItemSeparatorComponent={() => <View style={{ width: CHIP_GAP }} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}
      renderItem={({ item }) => {
        const { weekday, day } = chipLabels(item.chartDate);
        const selected = item.chartDate === selectedDate;
        return (
          <Pressable
            testID={`calendar-chip-${item.chartDate}`}
            accessibilityRole="button"
            accessibilityLabel={`${weekday} ${day}`}
            accessibilityState={{ selected }}
            onPress={() => onSelectDate(item.chartDate)}
            style={{ width: CHIP_WIDTH }}
            className={`items-center rounded-2xl py-2 ${
              selected ? "bg-blue-600" : item.isToday ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs ${selected ? "text-blue-100" : "text-gray-500"}`}
            >
              {weekday}
            </Text>
            <Text
              className={`text-base font-bold ${selected ? "text-white" : "text-gray-900"}`}
            >
              {day}
            </Text>
            <View
              testID={hasActivity(item) ? `calendar-marker-${item.chartDate}` : undefined}
              className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                hasActivity(item) ? (selected ? "bg-white" : "bg-blue-500") : "bg-transparent"
              }`}
            />
          </Pressable>
        );
      }}
    />
  );
}

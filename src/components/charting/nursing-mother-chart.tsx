import { useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { CalendarHeader } from "@/components/charting/calendar-header";
import { DayCardsColumn, type DayCardsColumnHandle } from "@/components/charting/day-cards-column";
import type { ChartEntry } from "@/lib/chart-data";
import { buildDayCards } from "@/lib/day-cards";

/**
 * Nursing Mother (10-day) chart view.
 *
 * Renders the calendar mini-view header (MI-22) above the scrollable day-cards
 * column (MI-21), or an empty state before any reading is recorded. The header
 * and column share a selected date: tapping a date scrolls the column to it, and
 * scrolling the column moves the header (two-way sync). Per-card editing is MI-23.
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

  return (
    <ChartContent today={today} entries={entries} intercourseByDate={intercourseByDate} />
  );
}

function ChartContent({
  today,
  entries,
  intercourseByDate,
}: {
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
}) {
  const cards = useMemo(
    () => buildDayCards({ today, entries, intercourseByDate }),
    [today, entries, intercourseByDate],
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const columnRef = useRef<DayCardsColumnHandle>(null);

  // Header tap → select + scroll the column there.
  const onSelectDate = (chartDate: string) => {
    setSelectedDate(chartDate);
    columnRef.current?.scrollToDate(chartDate);
  };

  return (
    <View testID="nursing-mother-chart" className="flex-1 gap-2">
      <Text className="text-sm font-medium uppercase tracking-widest text-gray-400">
        Nursing Mother
      </Text>
      <CalendarHeader cards={cards} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      {/* Column scroll → header follows (only while the user is dragging). */}
      <DayCardsColumn ref={columnRef} cards={cards} onVisibleDateChange={setSelectedDate} />
    </View>
  );
}

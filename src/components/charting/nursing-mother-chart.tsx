import { useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { CalendarHeader } from "@/components/charting/calendar-header";
import { DayCardsColumn, type DayCardsColumnHandle } from "@/components/charting/day-cards-column";
import { EditDayModal } from "@/components/charting/edit-day-modal";
import type { ChartEntry, Reading } from "@/lib/chart-data";
import { buildDayCards } from "@/lib/day-cards";
import {
  clearReading,
  decrementIntercourse,
  incrementIntercourse,
  setReading,
} from "@/lib/day-entry-edits";

/** Everything the chart needs to persist an edit (MI-23). */
export type ChartEditContext = {
  householdId: string;
  memberId: string;
  resetTime: string;
  timeZone: string;
  onRefresh: () => Promise<void>;
};

/**
 * Nursing Mother (10-day) chart view.
 *
 * Renders the calendar mini-view header (MI-22) above the scrollable day-cards
 * column (MI-21), or an empty state before any reading is recorded. The header
 * and column share a selected date (two-way sync); tapping a card opens an edit
 * sheet to change/clear the reading and adjust the intercourse count (MI-23).
 */
export function NursingMotherChart({
  today,
  entries,
  intercourseByDate,
  isEmpty,
  edit,
}: {
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
  isEmpty: boolean;
  edit: ChartEditContext;
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
    <ChartContent today={today} entries={entries} intercourseByDate={intercourseByDate} edit={edit} />
  );
}

function ChartContent({
  today,
  entries,
  intercourseByDate,
  edit,
}: {
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
  edit: ChartEditContext;
}) {
  const cards = useMemo(
    () => buildDayCards({ today, entries, intercourseByDate }),
    [today, entries, intercourseByDate],
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columnRef = useRef<DayCardsColumnHandle>(null);

  // Header tap → select + scroll the column there.
  const onSelectDate = (chartDate: string) => {
    setSelectedDate(chartDate);
    columnRef.current?.scrollToDate(chartDate);
  };

  // The live card for the open editor, re-derived from cards so it reflects
  // edits after each refresh.
  const editingCard = editingDate ? (cards.find((c) => c.chartDate === editingDate) ?? null) : null;

  // Run one edit op, surface its error, then reload the chart.
  const runEdit = async (op: () => Promise<{ ok: boolean; error: string | null }>) => {
    if (!editingDate || saving) return;
    setSaving(true);
    setError(null);
    const result = await op();
    if (!result.ok) setError(result.error ?? "Couldn't save the change.");
    await edit.onRefresh();
    setSaving(false);
  };

  const closeEditor = () => {
    setEditingDate(null);
    setError(null);
  };

  return (
    <View testID="nursing-mother-chart" className="flex-1 gap-2">
      <Text className="text-sm font-medium uppercase tracking-widest text-gray-400">
        Nursing Mother
      </Text>
      <CalendarHeader cards={cards} selectedDate={selectedDate} onSelectDate={onSelectDate} />
      {/* Column scroll → header follows (only while the user is dragging). */}
      <DayCardsColumn
        ref={columnRef}
        cards={cards}
        onVisibleDateChange={setSelectedDate}
        onCardPress={setEditingDate}
      />

      <EditDayModal
        card={editingCard}
        saving={saving}
        error={error}
        onSetReading={(reading: Reading) =>
          runEdit(() => setReading(edit.householdId, editingDate!, edit.memberId, reading))
        }
        onClearReading={() => runEdit(() => clearReading(edit.householdId, editingDate!))}
        onIncrement={() =>
          runEdit(() => incrementIntercourse(edit.householdId, editingDate!, edit.memberId))
        }
        onDecrement={() =>
          runEdit(() =>
            decrementIntercourse(edit.householdId, editingDate!, edit.resetTime, edit.timeZone),
          )
        }
        onClose={closeEditor}
      />
    </View>
  );
}

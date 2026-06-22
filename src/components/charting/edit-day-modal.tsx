import { Modal, Pressable, Text, View } from "react-native";

import type { Reading } from "@/lib/chart-data";
import type { DayCard } from "@/lib/day-cards";

/**
 * Edit sheet for a single day's entry (MI-23).
 *
 * Change or clear the reading (Low/High/Peak) and increment/decrement the
 * intercourse count for the tapped day. The handlers persist; this component
 * just reflects the live card and disables itself while a save is in flight.
 */
const READINGS: { value: Reading; label: string; badge: string; text: string }[] = [
  { value: "low", label: "Low", badge: "bg-reading-low", text: "text-white" },
  { value: "high", label: "High", badge: "bg-reading-high", text: "text-gray-900" },
  { value: "peak", label: "Peak", badge: "bg-reading-peak", text: "text-white" },
];

function formatLong(chartDate: string): string {
  const [y, m, d] = chartDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function EditDayModal({
  card,
  saving = false,
  error = null,
  onSetReading,
  onClearReading,
  onIncrement,
  onDecrement,
  onClose,
}: {
  /** The day being edited, or null when the modal is closed. */
  card: DayCard | null;
  saving?: boolean;
  error?: string | null;
  onSetReading: (reading: Reading) => void;
  onClearReading: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClose: () => void;
}) {
  const visible = card !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close editor"
        onPress={onClose}
        className="flex-1 justify-end bg-black/40"
      >
        {/* Stop taps inside the sheet from closing it. */}
        <Pressable testID="edit-day-modal" onPress={() => {}} className="gap-5 rounded-t-3xl bg-white p-6">
          {card ? (
            <>
              <View className="gap-1">
                <Text className="text-xs font-medium uppercase tracking-widest text-gray-400">
                  Edit day
                </Text>
                <Text className="text-xl font-bold text-gray-900">{formatLong(card.chartDate)}</Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Reading</Text>
                <View className="flex-row gap-2">
                  {READINGS.map((r) => {
                    const selected = card.reading === r.value;
                    return (
                      <Pressable
                        key={r.value}
                        accessibilityRole="button"
                        accessibilityLabel={r.label}
                        accessibilityState={{ selected, disabled: saving }}
                        disabled={saving}
                        onPress={() => onSetReading(r.value)}
                        className={`flex-1 items-center rounded-2xl py-3 ${r.badge} ${
                          selected ? "" : "opacity-40"
                        }`}
                      >
                        <Text className={`font-bold ${r.text}`}>{r.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear reading"
                  disabled={saving || card.reading === null}
                  onPress={onClearReading}
                  className="items-center rounded-2xl border border-gray-300 py-2 active:bg-gray-100"
                >
                  <Text
                    className={`text-sm font-semibold ${
                      card.reading === null ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Clear reading
                  </Text>
                </Pressable>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Intercourse</Text>
                <View className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease intercourse count"
                    disabled={saving || card.intercourseCount === 0}
                    onPress={onDecrement}
                    className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
                  >
                    <Text className="text-2xl font-bold text-gray-900">−</Text>
                  </Pressable>
                  <Text testID="intercourse-count" className="text-xl font-bold text-gray-900">
                    {card.intercourseCount}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase intercourse count"
                    disabled={saving}
                    onPress={onIncrement}
                    className="h-10 w-10 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
                  >
                    <Text className="text-2xl font-bold text-white">+</Text>
                  </Pressable>
                </View>
              </View>

              {error ? (
                <Text accessibilityRole="alert" className="text-sm text-red-600">
                  {error}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={onClose}
                className="items-center rounded-2xl bg-gray-900 py-3 active:opacity-80"
              >
                <Text className="font-semibold text-white">Done</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

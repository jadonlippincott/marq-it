import { Pressable, Text, View } from "react-native";

/**
 * The four primary Home actions: Low / High / Peak / Intercourse.
 *
 * Color-coded by meaning (MI-14). The once-per-day shared lock (MI-15) is driven
 * by `lockedReading`: when set, the three readings become non-interactive — the
 * chosen one stays highlighted with a "Recorded" caption, the others dim.
 * Intercourse is always available and accumulates (MI-16): each tap fires
 * `onPress` and `intercourseCount` shows today's running tally.
 */
export const ACTIONS = ["Low", "High", "Peak", "Intercourse"] as const;
export type Action = (typeof ACTIONS)[number];
export type ReadingLabel = "Low" | "High" | "Peak";

const ACTION_STYLES: Record<Action, { container: string; label: string }> = {
  Low: { container: "bg-reading-low", label: "text-white" },
  High: { container: "bg-reading-high", label: "text-gray-900" },
  Peak: { container: "bg-reading-peak", label: "text-white" },
  Intercourse: { container: "bg-intercourse", label: "text-gray-900" },
};

const READING_ACTIONS: Action[] = ["Low", "High", "Peak"];

export function ActionButtons({
  onPress,
  lockedReading,
  intercourseCount = 0,
}: {
  onPress?: (action: Action) => void;
  /** The recorded reading for today, or null/undefined if unlocked. */
  lockedReading?: ReadingLabel | null;
  /** Intercourse events recorded so far today; shown as a tally (MI-16). */
  intercourseCount?: number;
}) {
  return (
    <View className="flex-row flex-wrap justify-between gap-3" accessibilityRole="menu">
      {ACTIONS.map((action) => {
        const style = ACTION_STYLES[action];
        const isReading = READING_ACTIONS.includes(action);
        const locked = isReading && lockedReading != null;
        const isChosen = action === lockedReading;
        // Locked readings are non-interactive; Intercourse always taps.
        const disabled = locked;
        const dimmed = locked && !isChosen;

        return (
          <Pressable
            key={action}
            accessibilityRole="button"
            accessibilityLabel={action}
            accessibilityState={{ disabled, selected: isChosen }}
            disabled={disabled}
            onPress={() => onPress?.(action)}
            className={`min-h-28 w-[48%] items-center justify-center rounded-3xl active:opacity-80 ${
              style.container
            } ${dimmed ? "opacity-40" : ""}`}
          >
            <Text className={`text-xl font-bold ${style.label}`}>{action}</Text>
            {isChosen ? (
              <Text className={`mt-1 text-xs font-medium ${style.label}`}>Recorded</Text>
            ) : null}
            {action === "Intercourse" && intercourseCount > 0 ? (
              <Text className={`mt-1 text-xs font-medium ${style.label}`}>
                {intercourseCount} today
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

/**
 * The four primary Home actions: Low / High / Peak / Intercourse.
 *
 * Color-coded by meaning (MI-14): Low/High/Peak use the reading palette
 * (green/amber/red), Intercourse is a distinct blue. Large tap targets, 2×2
 * grid. The component stays presentational — `onPress` is wired with real
 * behavior later (the once-per-day shared lock is MI-15; Intercourse
 * multi-press is MI-16) and it's reused/unit-tested in isolation.
 */
export const ACTIONS = ["Low", "High", "Peak", "Intercourse"] as const;
export type Action = (typeof ACTIONS)[number];

const ACTION_STYLES: Record<Action, { container: string; label: string }> = {
  Low: { container: "bg-reading-low", label: "text-white" },
  High: { container: "bg-reading-high", label: "text-gray-900" },
  Peak: { container: "bg-reading-peak", label: "text-white" },
  Intercourse: { container: "bg-blue-600", label: "text-white" },
};

export function ActionButtons({ onPress }: { onPress?: (action: Action) => void }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-3" accessibilityRole="menu">
      {ACTIONS.map((action) => {
        const style = ACTION_STYLES[action];
        return (
          <Pressable
            key={action}
            accessibilityRole="button"
            accessibilityLabel={action}
            onPress={() => onPress?.(action)}
            className={`min-h-28 w-[48%] items-center justify-center rounded-3xl active:opacity-80 ${style.container}`}
          >
            <Text className={`text-xl font-bold ${style.label}`}>{action}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

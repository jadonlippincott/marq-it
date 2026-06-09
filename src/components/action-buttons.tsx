import { Pressable, Text, View } from "react-native";

/**
 * The four primary Home actions: Low / High / Peak / Intercourse.
 *
 * PLACEHOLDER for MI-7 — renders the buttons only. The actual behavior is
 * implemented later:
 *   - Low/High/Peak once-per-day shared lock  -> MI-15
 *   - Intercourse multi-press                 -> MI-16
 * This component is deliberately presentational (no navigation/data) so it can
 * be unit-tested in isolation and reused by the Home screen.
 */
export const ACTIONS = ["Low", "High", "Peak", "Intercourse"] as const;
export type Action = (typeof ACTIONS)[number];

export function ActionButtons({ onPress }: { onPress?: (action: Action) => void }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-3" accessibilityRole="menu">
      {ACTIONS.map((action) => (
        <Pressable
          key={action}
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={() => onPress?.(action)}
          className="min-h-24 w-[48%] items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200"
        >
          <Text className="text-xl font-semibold text-gray-900">{action}</Text>
        </Pressable>
      ))}
    </View>
  );
}

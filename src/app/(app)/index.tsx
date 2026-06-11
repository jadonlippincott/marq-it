import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ActionButtons } from "@/components/action-buttons";
import { Screen } from "@/components/screen";

/**
 * Home — the landing hub (MI-14).
 *
 * The four color-coded action buttons are the focus, with prominent navigation
 * to Charting and Settings below. Button behavior (the once-per-day shared lock
 * and Intercourse multi-press) is wired in MI-15/16.
 */
export default function HomeScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-10">
        <View className="gap-1">
          <Text className="text-center text-sm font-medium uppercase tracking-widest text-gray-400">
            Today
          </Text>
          <Text className="text-center text-2xl font-bold text-gray-900">Log a reading</Text>
        </View>

        <ActionButtons />

        <View className="gap-3">
          <Link href="/charting" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View chart"
              className="min-h-12 items-center justify-center rounded-2xl border border-gray-300 active:bg-gray-100"
            >
              <Text className="text-base font-semibold text-gray-900">View chart</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              className="min-h-12 items-center justify-center rounded-2xl border border-gray-300 active:bg-gray-100"
            >
              <Text className="text-base font-semibold text-gray-900">Settings</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

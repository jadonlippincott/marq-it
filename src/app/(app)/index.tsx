import { Link } from "expo-router";
import { Text, View } from "react-native";

import { ActionButtons } from "@/components/action-buttons";
import { Screen } from "@/components/screen";

/**
 * Home — the landing hub.
 *
 * PLACEHOLDER for MI-7: renders the four action buttons and links to the other
 * pages. Button behavior and the day-lock come later (MI-14/15/16).
 */
export default function HomeScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <ActionButtons />

        <View className="gap-2">
          <Link href="/charting" className="text-center text-base text-blue-600">
            Charting →
          </Link>
          <Link href="/settings" className="text-center text-base text-blue-600">
            Settings →
          </Link>
        </View>

        <Text className="text-center text-xs text-gray-400">
          Scaffold (MI-7). Actions are placeholders — see MI-14/15/16.
        </Text>
      </View>
    </Screen>
  );
}

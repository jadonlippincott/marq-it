import { Text, View } from "react-native";

import { Screen } from "@/components/screen";

/**
 * Settings — PLACEHOLDER for MI-7.
 * Reset-time picker (MI-17), day-boundary logic (MI-18), and protocol
 * selection (MI-19) are implemented in the Settings epic (MI-4).
 */
export default function SettingsScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-2">
        <Text className="text-center text-lg font-semibold text-gray-900">Settings</Text>
        <Text className="text-center text-sm text-gray-500">
          Reset time & protocol selection — TODO (MI-17 / MI-18 / MI-19).
        </Text>
      </View>
    </Screen>
  );
}

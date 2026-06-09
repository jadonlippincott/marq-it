import { Text, View } from "react-native";

import { Screen } from "@/components/screen";

/**
 * Charting — PLACEHOLDER for MI-7.
 * The Nursing Mother (10-day) view — day-cards column (MI-21), calendar header
 * (MI-22), edit (MI-23), routed by protocol (MI-20) — is built in the Charting
 * epic (MI-5).
 */
export default function ChartingScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-2">
        <Text className="text-center text-lg font-semibold text-gray-900">Charting</Text>
        <Text className="text-center text-sm text-gray-500">
          Nursing Mother (10-day) chart — TODO (MI-20 / MI-21 / MI-22 / MI-23).
        </Text>
      </View>
    </Screen>
  );
}

import { ActivityIndicator, Text, View } from "react-native";

import { ProtocolView } from "@/components/charting/protocol-view";
import { Screen } from "@/components/screen";
import { useChartData } from "@/hooks/use-chart-data";

/**
 * Charting — the per-protocol chart shell (MI-20).
 *
 * Loads the household's chart data and routes to the view for the selected
 * protocol (only Nursing Mother is implemented). The day-cards column (MI-21),
 * calendar header (MI-22), editing (MI-23), and Realtime sync (MI-24) build on
 * top of this scaffold.
 */
export default function ChartingScreen() {
  const { loading, hasHousehold, protocol, entries, isEmpty } = useChartData();

  return (
    <Screen>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : !hasHousehold || !protocol ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-lg font-semibold text-gray-900">Charting</Text>
          <Text className="px-8 text-center text-sm text-gray-500">
            Set up your household to start charting.
          </Text>
        </View>
      ) : (
        <ProtocolView protocol={protocol} entries={entries} isEmpty={isEmpty} />
      )}
    </Screen>
  );
}

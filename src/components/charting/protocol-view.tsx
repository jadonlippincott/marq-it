import { Text, View } from "react-native";

import { NursingMotherChart } from "@/components/charting/nursing-mother-chart";
import type { ChartEntry, Protocol } from "@/lib/chart-data";

/**
 * Protocol-based routing for the Charting page (MI-20).
 *
 * Each protocol maps to a view and a `supported` flag. Only Nursing Mother (the
 * 10-day protocol) is implemented; the other two are selectable in Settings but
 * render a "not yet supported" stub here (per the domain rules in CLAUDE.md).
 */
export const PROTOCOL_META: Record<Protocol, { label: string; supported: boolean }> = {
  nursing_mother: { label: "Nursing Mother", supported: true },
  transition_to_period: { label: "Transition to Period", supported: false },
  regular_cycle: { label: "Regular Cycle", supported: false },
};

export function ProtocolView({
  protocol,
  today,
  entries,
  intercourseByDate,
  isEmpty,
}: {
  protocol: Protocol;
  today: string;
  entries: ChartEntry[];
  intercourseByDate: Record<string, number>;
  isEmpty: boolean;
}) {
  if (protocol === "nursing_mother") {
    return (
      <NursingMotherChart
        today={today}
        entries={entries}
        intercourseByDate={intercourseByDate}
        isEmpty={isEmpty}
      />
    );
  }

  return (
    <View testID="protocol-unsupported" className="flex-1 items-center justify-center gap-2">
      <Text className="text-lg font-semibold text-gray-900">
        {PROTOCOL_META[protocol].label}
      </Text>
      <Text className="px-8 text-center text-sm text-gray-500">
        This protocol isn&apos;t available yet. Switch to Nursing Mother in Settings to chart.
      </Text>
    </View>
  );
}

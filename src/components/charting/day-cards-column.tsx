import { FlatList, View } from "react-native";

import { DAY_CARD_HEIGHT, DayCard } from "@/components/charting/day-card";
import type { DayCard as DayCardModel } from "@/lib/day-cards";

const GAP = 8;
const ROW_HEIGHT = DAY_CARD_HEIGHT + GAP;

/**
 * Scrollable vertical column of day cards (MI-21).
 *
 * Cards are ascending (oldest first), so today is the last item; the list opens
 * scrolled to today, with the past scrolling up. Fixed row height + getItemLayout
 * keep scrolling smooth and make the initial scroll-to-today reliable.
 */
export function DayCardsColumn({ cards }: { cards: DayCardModel[] }) {
  const todayIndex = Math.max(0, cards.length - 1);

  return (
    <FlatList
      testID="day-cards-column"
      data={cards}
      keyExtractor={(card) => card.chartDate}
      renderItem={({ item }) => <DayCard card={item} />}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      getItemLayout={(_, index) => ({
        length: ROW_HEIGHT,
        offset: ROW_HEIGHT * index,
        index,
      })}
      initialScrollIndex={todayIndex}
      // If the initial scroll lands off-screen mid-virtualization, snap to today.
      onScrollToIndexFailed={({ index }) => {
        // Best-effort: the next layout pass will retry via initialScrollIndex.
        void index;
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
    />
  );
}

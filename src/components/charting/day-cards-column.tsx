import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { FlatList, View, type ViewToken } from "react-native";

import { DAY_CARD_HEIGHT, DayCard } from "@/components/charting/day-card";
import { type DayCard as DayCardModel, indexOfChartDate } from "@/lib/day-cards";

const GAP = 8;
const ROW_HEIGHT = DAY_CARD_HEIGHT + GAP;

export type DayCardsColumnHandle = {
  /** Scroll so the card for `chartDate` is visible (centered when possible). */
  scrollToDate: (chartDate: string) => void;
};

/**
 * Scrollable vertical column of day cards (MI-21, two-way synced in MI-22).
 *
 * Cards are ascending (oldest first), so today is the last item; the list opens
 * scrolled to today, with the past scrolling up. Exposes `scrollToDate` so the
 * calendar header can drive it, and reports the bottom-most visible date via
 * `onVisibleDateChange` so the header can follow manual scrolling.
 */
export const DayCardsColumn = forwardRef<
  DayCardsColumnHandle,
  { cards: DayCardModel[]; onVisibleDateChange?: (chartDate: string) => void }
>(function DayCardsColumn({ cards, onVisibleDateChange }, ref) {
  const listRef = useRef<FlatList<DayCardModel>>(null);
  const todayIndex = Math.max(0, cards.length - 1);
  // Only follow the user's own scrolling — ignore viewable changes caused by a
  // programmatic scrollToDate (header tap), so the two don't fight.
  const userDragging = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate: (chartDate: string) => {
        const index = indexOfChartDate(cards, chartDate);
        if (index >= 0) listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
      },
    }),
    [cards],
  );

  // Report the last (bottom-most) visible card so the header tracks where the
  // user is — bottom-anchored because the column opens at today on the bottom.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!userDragging.current) return;
      const last = viewableItems.at(-1)?.item as DayCardModel | undefined;
      if (last) onVisibleDateChange?.(last.chartDate);
    },
  ).current;

  const onScrollToIndexFailed = useCallback(() => {
    // Best-effort: the next layout pass retries via initialScrollIndex.
  }, []);

  return (
    <FlatList
      ref={listRef}
      testID="day-cards-column"
      data={cards}
      keyExtractor={(card) => card.chartDate}
      renderItem={({ item }) => <DayCard card={item} />}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
      initialScrollIndex={todayIndex}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      onScrollBeginDrag={() => {
        userDragging.current = true;
      }}
      onMomentumScrollEnd={() => {
        userDragging.current = false;
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
    />
  );
});

import type { ChartEntry } from "@/lib/chart-data";
import { buildDayCards, hasActivity, indexOfChartDate, type DayCard } from "@/lib/day-cards";

const TODAY = "2024-06-10";

describe("buildDayCards", () => {
  it("spans at least minDays, ending at today (today is the last card)", () => {
    const cards = buildDayCards({ today: TODAY, entries: [], intercourseByDate: {}, minDays: 5 });
    expect(cards).toHaveLength(5);
    expect(cards[0].chartDate).toBe("2024-06-06");
    expect(cards.at(-1)?.chartDate).toBe(TODAY);
    expect(cards.at(-1)?.isToday).toBe(true);
    expect(cards.filter((c) => c.isToday)).toHaveLength(1);
  });

  it("extends the window back to the earliest entry when older than minDays", () => {
    const entries: ChartEntry[] = [{ chartDate: "2024-06-01", reading: "low" }];
    const cards = buildDayCards({ today: TODAY, entries, intercourseByDate: {}, minDays: 5 });
    expect(cards[0].chartDate).toBe("2024-06-01");
    expect(cards.at(-1)?.chartDate).toBe(TODAY);
    expect(cards).toHaveLength(10); // Jun 1 → Jun 10 inclusive
  });

  it("overlays readings and intercourse counts onto the right dates", () => {
    const entries: ChartEntry[] = [
      { chartDate: "2024-06-10", reading: "peak" },
      { chartDate: "2024-06-08", reading: "high" },
    ];
    const cards = buildDayCards({
      today: TODAY,
      entries,
      intercourseByDate: { "2024-06-10": 2, "2024-06-09": 1 },
      minDays: 5,
    });
    const byDate = Object.fromEntries(cards.map((c) => [c.chartDate, c]));

    expect(byDate["2024-06-10"]).toMatchObject({ reading: "peak", intercourseCount: 2 });
    expect(byDate["2024-06-09"]).toMatchObject({ reading: null, intercourseCount: 1 });
    expect(byDate["2024-06-08"]).toMatchObject({ reading: "high", intercourseCount: 0 });
    expect(byDate["2024-06-07"]).toMatchObject({ reading: null, intercourseCount: 0 });
  });

  it("is ascending by date", () => {
    const cards = buildDayCards({ today: TODAY, entries: [], intercourseByDate: {}, minDays: 4 });
    const dates = cards.map((c) => c.chartDate);
    expect(dates).toEqual([...dates].sort());
  });
});

describe("indexOfChartDate", () => {
  const cards = buildDayCards({ today: TODAY, entries: [], intercourseByDate: {}, minDays: 5 });

  it("finds the index of a date in the window", () => {
    expect(indexOfChartDate(cards, "2024-06-06")).toBe(0);
    expect(indexOfChartDate(cards, TODAY)).toBe(cards.length - 1);
  });

  it("returns -1 for a date outside the window", () => {
    expect(indexOfChartDate(cards, "2020-01-01")).toBe(-1);
  });
});

describe("hasActivity", () => {
  const base: DayCard = { chartDate: "2024-06-10", reading: null, intercourseCount: 0, isToday: false };

  it("is true when there is a reading or intercourse", () => {
    expect(hasActivity({ ...base, reading: "low" })).toBe(true);
    expect(hasActivity({ ...base, intercourseCount: 1 })).toBe(true);
  });

  it("is false for an empty day", () => {
    expect(hasActivity(base)).toBe(false);
  });
});

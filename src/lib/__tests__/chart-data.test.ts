import { loadChartData } from "@/lib/chart-data";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

/**
 * Wire up the per-table query chains loadChartData expects:
 *   members:            from().select().eq().maybeSingle()
 *   settings:           from().select().eq().maybeSingle()
 *   day_entries:        from().select().eq().order()
 *   intercourse_events: from().select().eq()
 */
function mockTables(opts: {
  member: { household_id: string } | null;
  settings?: { protocol?: string; reset_time?: string; timezone?: string } | null;
  entries?: { chart_date: string; reading: string }[];
  intercourse?: { occurred_at: string }[];
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "members") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.member }) }) }),
      };
    }
    if (table === "settings") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.settings ?? null }) }),
        }),
      };
    }
    if (table === "day_entries") {
      return {
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: opts.entries ?? [] }) }) }),
      };
    }
    if (table === "intercourse_events") {
      return {
        select: () => ({ eq: () => Promise.resolve({ data: opts.intercourse ?? [] }) }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

beforeEach(() => mockFrom.mockReset());

describe("loadChartData", () => {
  const NOW = new Date("2024-06-10T12:00:00Z");

  it("returns null when the user has no membership", async () => {
    mockTables({ member: null });
    expect(await loadChartData("auth-1", NOW)).toBeNull();
  });

  it("loads protocol, entries, today, and per-day intercourse counts", async () => {
    mockTables({
      member: { household_id: "hh-1" },
      settings: { protocol: "nursing_mother", reset_time: "04:00:00", timezone: "UTC" },
      entries: [
        { chart_date: "2024-06-10", reading: "peak" },
        { chart_date: "2024-06-09", reading: "high" },
      ],
      intercourse: [
        { occurred_at: "2024-06-10T11:00:00Z" }, // today
        { occurred_at: "2024-06-10T05:00:00Z" }, // today
        { occurred_at: "2024-06-09T20:00:00Z" }, // yesterday
        { occurred_at: "2024-06-10T03:00:00Z" }, // before reset → 2024-06-09
      ],
    });

    const data = await loadChartData("auth-1", NOW);
    expect(data).toEqual({
      householdId: "hh-1",
      protocol: "nursing_mother",
      entries: [
        { chartDate: "2024-06-10", reading: "peak" },
        { chartDate: "2024-06-09", reading: "high" },
      ],
      intercourseByDate: { "2024-06-10": 2, "2024-06-09": 2 },
      today: "2024-06-10",
      isEmpty: false,
    });
  });

  it("reports an empty chart and defaults protocol/reset when settings are absent", async () => {
    mockTables({ member: { household_id: "hh-1" }, settings: null, entries: [], intercourse: [] });
    const data = await loadChartData("auth-1", NOW);
    expect(data?.isEmpty).toBe(true);
    expect(data?.protocol).toBe("nursing_mother"); // default
    expect(data?.entries).toEqual([]);
    expect(data?.intercourseByDate).toEqual({});
  });
});

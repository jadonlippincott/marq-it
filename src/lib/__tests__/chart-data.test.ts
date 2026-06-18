import { loadChartData } from "@/lib/chart-data";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

/**
 * Wire up the per-table query chains loadChartData expects:
 *   members:     from().select().eq().maybeSingle()
 *   settings:    from().select().eq().maybeSingle()
 *   day_entries: from().select().eq().order()
 */
function mockTables(opts: {
  member: { household_id: string } | null;
  protocol?: string | null;
  entries?: { chart_date: string; reading: string }[];
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
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: opts.protocol ? { protocol: opts.protocol } : null }),
          }),
        }),
      };
    }
    if (table === "day_entries") {
      return {
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: opts.entries ?? [] }) }) }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

beforeEach(() => mockFrom.mockReset());

describe("loadChartData", () => {
  it("returns null when the user has no membership", async () => {
    mockTables({ member: null });
    expect(await loadChartData("auth-1")).toBeNull();
  });

  it("loads protocol and entries (most-recent first), flagging non-empty", async () => {
    mockTables({
      member: { household_id: "hh-1" },
      protocol: "nursing_mother",
      entries: [
        { chart_date: "2024-06-10", reading: "peak" },
        { chart_date: "2024-06-09", reading: "high" },
      ],
    });

    const data = await loadChartData("auth-1");
    expect(data).toEqual({
      householdId: "hh-1",
      protocol: "nursing_mother",
      entries: [
        { chartDate: "2024-06-10", reading: "peak" },
        { chartDate: "2024-06-09", reading: "high" },
      ],
      isEmpty: false,
    });
  });

  it("reports an empty chart and defaults protocol when settings/entries are absent", async () => {
    mockTables({ member: { household_id: "hh-1" }, protocol: null, entries: [] });
    const data = await loadChartData("auth-1");
    expect(data?.isEmpty).toBe(true);
    expect(data?.protocol).toBe("nursing_mother"); // default
    expect(data?.entries).toEqual([]);
  });
});

import { countTodayIntercourse, recordIntercourse } from "@/lib/intercourse";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => mockFrom.mockReset());

describe("recordIntercourse", () => {
  it("inserts an event for the household and reports ok", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await recordIntercourse("hh-1", "m-1");

    expect(result).toEqual({ ok: true, error: null });
    expect(mockFrom).toHaveBeenCalledWith("intercourse_events");
    // occurred_at is omitted — it defaults to now() server-side.
    expect(insert).toHaveBeenCalledWith({ household_id: "hh-1", recorded_by: "m-1" });
  });

  it("surfaces insert errors", async () => {
    mockFrom.mockReturnValue({ insert: jest.fn().mockResolvedValue({ error: { message: "denied" } }) });
    const result = await recordIntercourse("hh-1", "m-1");
    expect(result).toEqual({ ok: false, error: "denied" });
  });
});

describe("countTodayIntercourse", () => {
  // Build the chainable query mock: from().select().eq().gte() resolves to data.
  function mockEvents(occurredAt: string[]) {
    const gte = jest.fn().mockResolvedValue({ data: occurredAt.map((occurred_at) => ({ occurred_at })) });
    const eq = jest.fn().mockReturnValue({ gte });
    const select = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });
    return { select, eq, gte };
  }

  const RESET = "04:00:00";
  const NOW = new Date("2024-06-10T12:00:00Z"); // chart date 2024-06-10 (after 04:00 reset)

  it("counts only events whose chart date matches today (reset-adjusted)", async () => {
    mockEvents([
      "2024-06-10T11:00:00Z", // today (after reset) ✓
      "2024-06-10T05:00:00Z", // today (after reset) ✓
      "2024-06-10T03:00:00Z", // before reset → previous chart day ✗
      "2024-06-09T23:00:00Z", // yesterday ✗
    ]);

    const count = await countTodayIntercourse("hh-1", "2024-06-10", RESET, "UTC", NOW);
    expect(count).toBe(2);
  });

  it("returns 0 when there are no recent events", async () => {
    mockEvents([]);
    expect(await countTodayIntercourse("hh-1", "2024-06-10", RESET, "UTC", NOW)).toBe(0);
  });

  it("bounds the query to a recent window via gte(occurred_at)", async () => {
    const { gte } = mockEvents([]);
    await countTodayIntercourse("hh-1", "2024-06-10", RESET, "UTC", NOW);
    // 26h before NOW.
    expect(gte).toHaveBeenCalledWith("occurred_at", "2024-06-09T10:00:00.000Z");
  });
});

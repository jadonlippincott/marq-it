import {
  isUniqueViolation,
  labelToReading,
  readingToLabel,
  recordReading,
  type TodayState,
} from "@/lib/today-reading";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

const state: TodayState = {
  householdId: "hh-1",
  memberId: "m-1",
  chartDate: "2024-06-10",
  reading: null,
  recordedByName: null,
};

beforeEach(() => mockFrom.mockReset());

describe("label/reading mapping", () => {
  it("round-trips labels and readings", () => {
    expect(labelToReading("Low")).toBe("low");
    expect(labelToReading("High")).toBe("high");
    expect(labelToReading("Peak")).toBe("peak");
    expect(readingToLabel("low")).toBe("Low");
    expect(readingToLabel("peak")).toBe("Peak");
  });
});

describe("isUniqueViolation", () => {
  it("detects 23505 and ignores others", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});

describe("recordReading", () => {
  function mockInsert(result: { error: unknown }) {
    const insert = jest.fn().mockResolvedValue(result);
    mockFrom.mockReturnValue({ insert });
    return insert;
  }

  it("inserts the reading and reports ok", async () => {
    const insert = mockInsert({ error: null });
    const result = await recordReading(state, "low");

    expect(result).toEqual({ ok: true, conflict: false, error: null });
    expect(mockFrom).toHaveBeenCalledWith("day_entries");
    expect(insert).toHaveBeenCalledWith({
      household_id: "hh-1",
      chart_date: "2024-06-10",
      reading: "low",
      recorded_by: "m-1",
    });
  });

  it("treats a unique violation as a conflict (spouse won the race), not an error", async () => {
    mockInsert({ error: { code: "23505", message: "duplicate key" } });
    const result = await recordReading(state, "high");
    expect(result).toEqual({ ok: false, conflict: true, error: null });
  });

  it("surfaces other errors", async () => {
    mockInsert({ error: { code: "42501", message: "permission denied" } });
    const result = await recordReading(state, "peak");
    expect(result).toEqual({ ok: false, conflict: false, error: "permission denied" });
  });
});

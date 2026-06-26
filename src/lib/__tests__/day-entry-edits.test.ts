import { chartDateFor } from "@/lib/chart-date";
import {
  clearReading,
  decrementIntercourse,
  incrementIntercourse,
  setReading,
} from "@/lib/day-entry-edits";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => mockFrom.mockReset());

describe("setReading", () => {
  it("upserts the reading on the household+date conflict, stamping updated_by", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const result = await setReading("hh-1", "2024-06-10", "m-1", "peak");

    expect(result).toEqual({ ok: true, error: null });
    expect(mockFrom).toHaveBeenCalledWith("day_entries");
    expect(upsert).toHaveBeenCalledWith(
      { household_id: "hh-1", chart_date: "2024-06-10", reading: "peak", updated_by: "m-1" },
      { onConflict: "household_id,chart_date" },
    );
  });

  it("surfaces an upsert error", async () => {
    mockFrom.mockReturnValue({ upsert: jest.fn().mockResolvedValue({ error: { message: "denied" } }) });
    expect(await setReading("hh-1", "2024-06-10", "m-1", "low")).toEqual({ ok: false, error: "denied" });
  });
});

describe("clearReading", () => {
  it("deletes the day's entry by household and date", async () => {
    const eq2 = jest.fn().mockResolvedValue({ error: null });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const del = jest.fn().mockReturnValue({ eq: eq1 });
    mockFrom.mockReturnValue({ delete: del });

    const result = await clearReading("hh-1", "2024-06-10");

    expect(result).toEqual({ ok: true, error: null });
    expect(eq1).toHaveBeenCalledWith("household_id", "hh-1");
    expect(eq2).toHaveBeenCalledWith("chart_date", "2024-06-10");
  });
});

describe("incrementIntercourse", () => {
  it("inserts an event placed at midday in the household timezone", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await incrementIntercourse("hh-1", "2024-06-08", "m-1", "America/New_York");

    expect(result).toEqual({ ok: true, error: null });
    // Noon EDT (UTC-4) on 2024-06-08 = 16:00Z.
    expect(insert).toHaveBeenCalledWith({
      household_id: "hh-1",
      recorded_by: "m-1",
      occurred_at: "2024-06-08T16:00:00.000Z",
    });
  });

  it("places the event so it buckets back to the same day even in a far-west zone", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    await incrementIntercourse("hh-1", "2024-06-08", "m-1", "Pacific/Pago_Pago"); // UTC-11
    const occurredAt = insert.mock.calls[0][0].occurred_at as string;
    // The naive noon-UTC hack would have mis-bucketed this to the previous day.
    expect(chartDateFor(new Date(occurredAt), "04:00:00", "Pacific/Pago_Pago")).toBe("2024-06-08");
  });
});

describe("decrementIntercourse", () => {
  function mockEventsAndDelete(events: { id: string; occurred_at: string }[]) {
    const eqDelete = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: eqDelete });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => Promise.resolve({ data: events }) }),
      delete: del,
    });
    return { del, eqDelete };
  }

  it("deletes one event from the target day (matched by chart date)", async () => {
    const { eqDelete } = mockEventsAndDelete([
      { id: "e1", occurred_at: "2024-06-10T11:00:00Z" }, // today
      { id: "e2", occurred_at: "2024-06-08T12:00:00Z" }, // target day
    ]);

    const result = await decrementIntercourse("hh-1", "2024-06-08", "04:00:00", "UTC");

    expect(result).toEqual({ ok: true, error: null });
    expect(eqDelete).toHaveBeenCalledWith("id", "e2");
  });

  it("is a no-op (ok) when the day has no events", async () => {
    const { del } = mockEventsAndDelete([{ id: "e1", occurred_at: "2024-06-10T11:00:00Z" }]);
    const result = await decrementIntercourse("hh-1", "2024-06-08", "04:00:00", "UTC");
    expect(result).toEqual({ ok: true, error: null });
    expect(del).not.toHaveBeenCalled();
  });
});

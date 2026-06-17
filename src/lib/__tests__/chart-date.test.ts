import { chartDateFor } from "@/lib/chart-date";

describe("chartDateFor", () => {
  const RESET = "04:00:00";

  it("returns the previous day before the reset time (UTC)", () => {
    expect(chartDateFor(new Date("2024-06-10T02:00:00Z"), RESET, "UTC")).toBe("2024-06-09");
  });

  it("returns the current day at/after the reset time (UTC)", () => {
    expect(chartDateFor(new Date("2024-06-10T04:00:00Z"), RESET, "UTC")).toBe("2024-06-10");
    expect(chartDateFor(new Date("2024-06-10T09:00:00Z"), RESET, "UTC")).toBe("2024-06-10");
  });

  it("treats one second before reset as the previous day", () => {
    expect(chartDateFor(new Date("2024-06-10T03:59:59Z"), RESET, "UTC")).toBe("2024-06-09");
  });

  it("respects the household timezone (America/New_York)", () => {
    // 06:00Z = 02:00 EDT → before 04:00 reset → previous day
    expect(chartDateFor(new Date("2024-06-10T06:00:00Z"), RESET, "America/New_York")).toBe(
      "2024-06-09",
    );
    // 09:00Z = 05:00 EDT → after reset → same day
    expect(chartDateFor(new Date("2024-06-10T09:00:00Z"), RESET, "America/New_York")).toBe(
      "2024-06-10",
    );
  });

  it("rolls back across a month boundary", () => {
    expect(chartDateFor(new Date("2024-07-01T02:00:00Z"), RESET, "UTC")).toBe("2024-06-30");
  });

  it("rolls back across a year boundary", () => {
    expect(chartDateFor(new Date("2025-01-01T02:00:00Z"), RESET, "UTC")).toBe("2024-12-31");
  });
});

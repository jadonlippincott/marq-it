import { addChartDays, chartDateFor, enumerateChartDates } from "@/lib/chart-date";

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

describe("addChartDays", () => {
  it("shifts forward and backward", () => {
    expect(addChartDays("2024-06-10", 1)).toBe("2024-06-11");
    expect(addChartDays("2024-06-10", -1)).toBe("2024-06-09");
  });

  it("crosses month and year boundaries", () => {
    expect(addChartDays("2024-06-30", 1)).toBe("2024-07-01");
    expect(addChartDays("2025-01-01", -1)).toBe("2024-12-31");
  });
});

describe("enumerateChartDates", () => {
  it("returns an inclusive ascending range", () => {
    expect(enumerateChartDates("2024-06-08", "2024-06-11")).toEqual([
      "2024-06-08",
      "2024-06-09",
      "2024-06-10",
      "2024-06-11",
    ]);
  });

  it("returns a single date when start equals end", () => {
    expect(enumerateChartDates("2024-06-10", "2024-06-10")).toEqual(["2024-06-10"]);
  });

  it("returns empty when start is after end", () => {
    expect(enumerateChartDates("2024-06-11", "2024-06-10")).toEqual([]);
  });

  it("spans a month boundary", () => {
    expect(enumerateChartDates("2024-06-29", "2024-07-01")).toEqual([
      "2024-06-29",
      "2024-06-30",
      "2024-07-01",
    ]);
  });
});

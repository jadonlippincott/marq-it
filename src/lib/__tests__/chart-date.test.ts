import {
  addChartDays,
  chartDateFor,
  enumerateChartDates,
  zonedNoonToUtc,
} from "@/lib/chart-date";

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

describe("chartDateFor — fixed household timezone (MI-25)", () => {
  const RESET = "04:00:00";

  it("both spouses agree on the chart date regardless of their device timezone", () => {
    // Same instant, same household zone → same chart date. The household zone is
    // the only input, so a travelling spouse on a different device still agrees.
    const instant = new Date("2024-06-10T09:00:00Z"); // 05:00 EDT, after reset
    expect(chartDateFor(instant, RESET, "America/New_York")).toBe("2024-06-10");
    expect(chartDateFor(instant, RESET, "America/New_York")).toBe(
      chartDateFor(instant, RESET, "America/New_York"),
    );
  });

  it("resolves the reset boundary by household zone, not the device", () => {
    // 06:00Z = 02:00 EDT → before the 04:00 reset → previous chart day.
    expect(chartDateFor(new Date("2024-06-10T06:00:00Z"), RESET, "America/New_York")).toBe(
      "2024-06-09",
    );
  });
});

describe("chartDateFor — DST transitions (MI-25)", () => {
  const RESET = "04:00:00";
  const TZ = "America/New_York";

  it("does not skip or duplicate a day across spring-forward (Mar 10 2024)", () => {
    // Local clocks jump 02:00→03:00 on 2024-03-10; the 04:00 reset is unaffected.
    // Sample each day at noon local (16:00Z before DST, 16:00Z is 12:00 EDT after).
    expect(chartDateFor(new Date("2024-03-09T17:00:00Z"), RESET, TZ)).toBe("2024-03-09"); // 12:00 EST
    expect(chartDateFor(new Date("2024-03-10T16:00:00Z"), RESET, TZ)).toBe("2024-03-10"); // 12:00 EDT
    expect(chartDateFor(new Date("2024-03-11T16:00:00Z"), RESET, TZ)).toBe("2024-03-11");
  });

  it("does not skip or duplicate a day across fall-back (Nov 3 2024)", () => {
    // Local clocks fall 02:00→01:00 on 2024-11-03; consecutive noons map 1:1.
    expect(chartDateFor(new Date("2024-11-02T16:00:00Z"), RESET, TZ)).toBe("2024-11-02"); // 12:00 EDT
    expect(chartDateFor(new Date("2024-11-03T17:00:00Z"), RESET, TZ)).toBe("2024-11-03"); // 12:00 EST
    expect(chartDateFor(new Date("2024-11-04T17:00:00Z"), RESET, TZ)).toBe("2024-11-04");
  });

  it("just after the reset on the fall-back day stays on that day", () => {
    // 04:30 EST on Nov 3 (after the 01:00 fall-back) = 09:30Z.
    expect(chartDateFor(new Date("2024-11-03T09:30:00Z"), RESET, TZ)).toBe("2024-11-03");
  });
});

describe("zonedNoonToUtc (MI-25)", () => {
  it("returns the UTC instant for midday in the zone", () => {
    expect(zonedNoonToUtc("2024-06-08", "UTC")).toBe("2024-06-08T12:00:00.000Z");
    expect(zonedNoonToUtc("2024-06-08", "America/New_York")).toBe("2024-06-08T16:00:00.000Z"); // EDT -4
  });

  it("round-trips through chartDateFor to the same day, including hard zones", () => {
    for (const tz of ["UTC", "America/New_York", "Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
      const instant = new Date(zonedNoonToUtc("2024-06-08", tz));
      expect(chartDateFor(instant, "04:00:00", tz)).toBe("2024-06-08");
    }
  });

  it("accounts for DST when placing midday (EST vs EDT)", () => {
    expect(zonedNoonToUtc("2024-01-08", "America/New_York")).toBe("2024-01-08T17:00:00.000Z"); // EST -5
    expect(zonedNoonToUtc("2024-06-08", "America/New_York")).toBe("2024-06-08T16:00:00.000Z"); // EDT -4
  });
});

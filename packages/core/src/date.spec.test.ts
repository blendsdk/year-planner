import { describe, expect, it } from "vitest";
import {
  addDays,
  compareDateKeys,
  dayOfWeek,
  daysInMonth,
  diffDays,
  formatDateKey,
  isoWeekOf,
  maxDate,
  minDate,
  parseDateKey,
  subtractDays,
} from "./date";

describe("RD-02-AC-01/02: Gregorian date keys and Saturday-first weekday", () => {
  it("parses a valid date and formats it back", () => {
    const result = parseDateKey("2016-01-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(formatDateKey(result.date)).toBe("2016-01-01");
  });

  it("rejects impossible and out-of-range dates", () => {
    expect(parseDateKey("2027-02-29")).toMatchObject({
      ok: false,
      diagnostic: { code: "INVALID_DATE" },
    });
    expect(parseDateKey("1500-01-01")).toMatchObject({
      ok: false,
      diagnostic: { code: "UNSUPPORTED_YEAR" },
    });
  });

  it("maps 2016-01-01 to Friday (sat-first index 6) and 2017-01-01 to Sunday (1)", () => {
    expect(dayOfWeek("2016-01-01")).toBe(6);
    expect(dayOfWeek("2017-01-01")).toBe(1);
  });

  it("adds and subtracts days across month and year boundaries", () => {
    expect(addDays("2016-12-31", 1)).toBe("2017-01-01");
    expect(subtractDays("2017-01-01", 1)).toBe("2016-12-31");
    expect(diffDays("2016-01-01", "2016-01-31")).toBe(30);
  });

  it("compares and selects min/max dates", () => {
    expect(compareDateKeys("2016-01-01", "2016-01-02")).toBe(-1);
    expect(minDate("2016-01-02", "2016-01-01")).toBe("2016-01-01");
    expect(maxDate("2016-01-02", "2016-01-01")).toBe("2016-01-02");
  });
});

describe("RD-02-AC-03: month lengths", () => {
  it("handles leap years and century rules", () => {
    expect(daysInMonth(2016, 1)).toBe(29);
    expect(daysInMonth(2017, 1)).toBe(28);
    expect(daysInMonth(1900, 1)).toBe(28);
    expect(daysInMonth(2000, 1)).toBe(29);
    expect(daysInMonth(1600, 1)).toBe(29);
  });
});

describe("RD-02-AC-04: ISO week-year", () => {
  it("returns the correct ISO week and week-year", () => {
    expect(isoWeekOf("2016-01-01")).toEqual({ week: 53, weekYear: 2015 });
    expect(isoWeekOf("2016-01-04")).toEqual({ week: 1, weekYear: 2016 });
    expect(isoWeekOf("2017-01-01")).toEqual({ week: 52, weekYear: 2016 });
    expect(isoWeekOf("2017-01-02")).toEqual({ week: 1, weekYear: 2017 });
  });
});

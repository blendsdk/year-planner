import { describe, expect, it } from "vitest";
import { addDays, fromEpochDay, parseDateKey, toEpochDay } from "./date";

describe("date internals", () => {
  it("round-trips epoch days for every month start 2015-2018", () => {
    for (let year = 2015; year <= 2018; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        expect(fromEpochDay(toEpochDay(date))).toBe(date);
        expect(parseDateKey(date).ok).toBe(true);
      }
    }
  });

  it("adds negative and large day offsets", () => {
    expect(addDays("2016-01-01", 0)).toBe("2016-01-01");
    expect(addDays("2016-01-01", 365)).toBe("2016-12-31");
    expect(addDays("2016-01-01", 366)).toBe("2017-01-01");
    expect(addDays("2016-01-01", -1)).toBe("2015-12-31");
  });
});

import {
  compareDateKeys,
  dayOfWeek,
  daysInMonth,
  diffDays,
  eachDate,
  formatDateKey,
  isDateKey,
  isLeapYear,
  isoWeekOf,
  maxDate,
  minDate,
  subtractDays,
} from "./date";

describe("date validation and helpers", () => {
  it("validates date keys and rejects malformed values", () => {
    expect(isDateKey("2016-01-01")).toBe(true);
    expect(isDateKey("2016-1-1")).toBe(false);
    expect(isDateKey("2016-13-01")).toBe(false);
    expect(isDateKey("2016-04-31")).toBe(false);
    expect(isDateKey("1599-12-31")).toBe(false);
    expect(parseDateKey("9999-12-31").ok).toBe(true);
    expect(parseDateKey("10000-01-01").ok).toBe(false);
  });

  it("throws for invalid month and date input", () => {
    expect(() => daysInMonth(2016, -1)).toThrow(RangeError);
    expect(() => daysInMonth(2016, 12)).toThrow(RangeError);
    expect(() => dayOfWeek("nope")).toThrow(RangeError);
    expect(() => isoWeekOf("nope")).toThrow(RangeError);
    expect(() => addDays("nope", 1)).toThrow(RangeError);
    expect(() => diffDays("2016-01-01", "nope")).toThrow(RangeError);
  });

  it("identifies leap years and formats keys", () => {
    expect(isLeapYear(1600)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(formatDateKey("2016-01-01")).toBe("2016-01-01");
  });

  it("returns every date in a range and an empty list for an empty range", () => {
    expect(eachDate("2016-12-30", "2017-01-02")).toEqual([
      "2016-12-30",
      "2016-12-31",
      "2017-01-01",
    ]);
    expect(eachDate("2016-01-01", "2016-01-01")).toEqual([]);
  });

  it("compares, selects min/max and subtracts days", () => {
    expect(compareDateKeys("2016-01-01", "2016-01-01")).toBe(0);
    expect(compareDateKeys("2016-01-02", "2016-01-01")).toBe(1);
    expect(minDate("2016-01-01", "2016-01-01")).toBe("2016-01-01");
    expect(maxDate("2016-01-01", "2016-01-01")).toBe("2016-01-01");
    expect(subtractDays("2016-03-01", 1)).toBe("2016-02-29");
  });

  it("round-trips the supported date extremes", () => {
    expect(fromEpochDay(toEpochDay("1600-01-01"))).toBe("1600-01-01");
    expect(fromEpochDay(toEpochDay("9999-12-31"))).toBe("9999-12-31");
  });
});

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

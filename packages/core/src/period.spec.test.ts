import { describe, expect, it } from "vitest";
import { parseDateKey } from "./date";
import {
  type AllDayPeriod,
  durationDays,
  isAllDayPeriod,
  isDateInterval,
  projectTimedPeriod,
  type TimedPeriod,
  validateAllDayPeriod,
  validatePeriod,
  validateTimedPeriod,
} from "./period";

const allDay = (startDate: string, endDateExclusive: string): AllDayPeriod => ({
  kind: "all-day",
  startDate,
  endDateExclusive,
});

describe("RD-02-AC-05/06/11: period validation and timed projection", () => {
  it("validates a date-only period and rejects reverse ranges", () => {
    expect(validateAllDayPeriod(allDay("2027-01-28", "2027-02-07"))).toEqual([]);
    expect(validateAllDayPeriod(allDay("2027-02-07", "2027-01-28"))).toMatchObject([
      { code: "INVALID_RANGE" },
    ]);
    expect(validateAllDayPeriod(allDay("2027-02-29", "2027-03-02"))).toMatchObject([
      { code: "INVALID_DATE" },
    ]);
  });

  it("validates timed instants, zones and ordering", () => {
    const period: TimedPeriod = {
      kind: "timed",
      start: "2027-01-31T23:30:00Z",
      endExclusive: "2027-02-01T01:00:00Z",
      timeZone: "UTC",
    };
    expect(validateTimedPeriod(period)).toEqual([]);
    expect(validateTimedPeriod({ ...period, start: "not-a-date" })).toMatchObject([
      { code: "INVALID_INSTANT" },
    ]);
    expect(validateTimedPeriod({ ...period, timeZone: "Mars/Olympus" })).toMatchObject([
      { code: "INVALID_TIMEZONE" },
    ]);
    expect(
      validateTimedPeriod({
        ...period,
        start: "2027-02-01T01:00:00Z",
        endExclusive: "2027-01-31T23:30:00Z",
      }),
    ).toMatchObject([{ code: "INVALID_RANGE" }]);
  });

  it("projects a timed period to the dates it touches in an explicit zone", () => {
    expect(
      projectTimedPeriod(
        {
          kind: "timed",
          start: "2027-01-31T23:30:00Z",
          endExclusive: "2027-02-01T01:00:00Z",
          timeZone: "UTC",
        },
        "UTC",
      ),
    ).toEqual(allDay("2027-01-31", "2027-02-02"));
  });

  it("projects across a DST transition deterministically", () => {
    expect(
      projectTimedPeriod(
        {
          kind: "timed",
          start: "2027-03-14T06:30:00Z",
          endExclusive: "2027-03-15T04:30:00Z",
          timeZone: "America/New_York",
        },
        "America/New_York",
      ),
    ).toEqual(allDay("2027-03-14", "2027-03-16"));
  });

  it("computes duration, guards types and rejects invalid projection input", () => {
    expect(durationDays(allDay("2027-01-28", "2027-02-07"))).toBe(10);
    expect(isAllDayPeriod(allDay("2027-01-01", "2027-01-02"))).toBe(true);
    expect(isAllDayPeriod({ kind: "timed" } as never)).toBe(false);
    expect(
      isDateInterval({ kind: "all-day", startDate: "2027-01-01", endDateExclusive: "2027-01-02" }),
    ).toBe(true);
    expect(
      isDateInterval({ kind: "all-day", startDate: "bad", endDateExclusive: "2027-01-02" }),
    ).toBe(false);
    expect(validatePeriod(allDay("2027-01-01", "2027-01-02"))).toEqual([]);
    expect(() =>
      projectTimedPeriod(
        {
          kind: "timed",
          start: "2027-01-01T00:00:00Z",
          endExclusive: "2027-01-02T00:00:00Z",
          timeZone: "UTC",
        },
        "Mars/Olympus",
      ),
    ).toThrow(/Unknown time zone/);
  });
});

describe("RD-02-AC-09: invalid input codes", () => {
  it("returns INVALID_RANGE for zero-length and reverse ranges", () => {
    expect(validateAllDayPeriod(allDay("2027-06-10", "2027-06-10"))).toMatchObject([
      { code: "INVALID_RANGE" },
    ]);
    expect(validateAllDayPeriod(allDay("2027-06-21", "2027-06-10"))).toMatchObject([
      { code: "INVALID_RANGE" },
    ]);
  });

  it("returns INVALID_DATE and UNSUPPORTED_YEAR from the date parser", () => {
    expect(parseDateKey("2027-02-29")).toMatchObject({
      ok: false,
      diagnostic: { code: "INVALID_DATE" },
    });
    expect(parseDateKey("1500-01-01")).toMatchObject({
      ok: false,
      diagnostic: { code: "UNSUPPORTED_YEAR" },
    });
  });
});

import { describe, expect, it } from "vitest";
import type { DateInterval } from "./interval";
import {
  contains,
  intersect,
  mergeAdjacent,
  normalize,
  overlaps,
  splitAtDateBoundary,
  subtract,
  union,
} from "./interval";

const interval = (startDate: string, endDateExclusive: string): DateInterval => ({
  startDate,
  endDateExclusive,
});

describe("RD-02-AC-07/08: half-open interval algebra", () => {
  it("subtracts the middle into two intervals", () => {
    expect(
      subtract(interval("2027-06-10", "2027-06-21"), interval("2027-06-14", "2027-06-17")),
    ).toEqual([interval("2027-06-10", "2027-06-14"), interval("2027-06-17", "2027-06-21")]);
  });

  it("treats touching intervals as non-overlapping", () => {
    expect(
      overlaps(interval("2027-01-01", "2027-01-02"), interval("2027-01-02", "2027-01-03")),
    ).toBe(false);
    expect(
      union(interval("2027-01-01", "2027-01-02"), interval("2027-01-02", "2027-01-03")),
    ).toEqual([interval("2027-01-01", "2027-01-02"), interval("2027-01-02", "2027-01-03")]);
    expect(
      mergeAdjacent(
        [interval("2027-01-01", "2027-01-02"), interval("2027-01-02", "2027-01-03")],
        true,
      ),
    ).toEqual([interval("2027-01-01", "2027-01-03")]);
  });

  it("intersects and reports containment", () => {
    expect(
      intersect(interval("2027-01-01", "2027-01-10"), interval("2027-01-05", "2027-01-12")),
    ).toEqual(interval("2027-01-05", "2027-01-10"));
    expect(
      intersect(interval("2027-01-01", "2027-01-02"), interval("2027-01-02", "2027-01-03")),
    ).toBeNull();
    expect(contains(interval("2027-01-01", "2027-01-10"), "2027-01-01")).toBe(true);
    expect(contains(interval("2027-01-01", "2027-01-10"), "2027-01-10")).toBe(false);
  });

  it("normalizes overlaps and splits at a date boundary", () => {
    expect(
      normalize([interval("2027-01-05", "2027-01-10"), interval("2027-01-01", "2027-01-06")]),
    ).toEqual([interval("2027-01-01", "2027-01-10")]);
    expect(splitAtDateBoundary(interval("2027-01-01", "2027-01-10"), "2027-01-05")).toEqual([
      interval("2027-01-01", "2027-01-05"),
      interval("2027-01-05", "2027-01-10"),
    ]);
  });
});

import { compareDateKeys, maxDate, minDate } from "./date.js";

/** A date-only half-open interval. */
export interface DateInterval {
  startDate: string;
  endDateExclusive: string;
}

/** Returns whether two half-open intervals overlap. */
export function overlaps(a: DateInterval, b: DateInterval): boolean {
  return (
    compareDateKeys(a.startDate, b.endDateExclusive) < 0 &&
    compareDateKeys(b.startDate, a.endDateExclusive) < 0
  );
}

/** Returns the intersection of two half-open intervals, or null. */
export function intersect(a: DateInterval, b: DateInterval): DateInterval | null {
  if (!overlaps(a, b)) return null;
  const startDate = maxDate(a.startDate, b.startDate);
  const endDateExclusive = minDate(a.endDateExclusive, b.endDateExclusive);
  return compareDateKeys(startDate, endDateExclusive) < 0 ? { startDate, endDateExclusive } : null;
}

/** Returns the union of two intervals, merging overlaps but not touches. */
export function union(a: DateInterval, b: DateInterval): DateInterval[] {
  if (overlaps(a, b)) {
    return [
      {
        startDate: minDate(a.startDate, b.startDate),
        endDateExclusive: maxDate(a.endDateExclusive, b.endDateExclusive),
      },
    ];
  }
  return [a, b];
}

/** Subtracts `b` from `a`, returning 0, 1 or 2 residual intervals. */
export function subtract(a: DateInterval, b: DateInterval): DateInterval[] {
  if (!overlaps(a, b)) return [a];
  const result: DateInterval[] = [];
  if (compareDateKeys(a.startDate, b.startDate) < 0) {
    result.push({ startDate: a.startDate, endDateExclusive: b.startDate });
  }
  if (compareDateKeys(b.endDateExclusive, a.endDateExclusive) < 0) {
    result.push({ startDate: b.endDateExclusive, endDateExclusive: a.endDateExclusive });
  }
  return result;
}

/** Merges overlapping (and optionally touching) intervals into a normalized set. */
export function mergeAdjacent(periods: DateInterval[], mergeTouching: boolean): DateInterval[] {
  if (periods.length === 0) return [];
  const sorted = [...periods].sort((a, b) => compareDateKeys(a.startDate, b.startDate));
  const result: DateInterval[] = [];
  for (const current of sorted) {
    const last = result[result.length - 1];
    if (!last) {
      result.push({ ...current });
      continue;
    }
    const overlapsOrTouches =
      compareDateKeys(current.startDate, last.endDateExclusive) < 0 ||
      (mergeTouching && compareDateKeys(current.startDate, last.endDateExclusive) === 0);
    if (overlapsOrTouches) {
      last.endDateExclusive = maxDate(last.endDateExclusive, current.endDateExclusive);
    } else {
      result.push({ ...current });
    }
  }
  return result;
}

/** Normalizes a set of intervals, merging overlaps and optionally touches. */
export function normalize(periods: DateInterval[], mergeTouching = false): DateInterval[] {
  return mergeAdjacent(periods, mergeTouching);
}

/** Returns whether a date is inside `[start, endExclusive)`. */
export function contains(period: DateInterval, date: string): boolean {
  return (
    compareDateKeys(period.startDate, date) <= 0 &&
    compareDateKeys(date, period.endDateExclusive) < 0
  );
}

/** Splits an interval at a date boundary, returning 1 or 2 intervals. */
export function splitAtDateBoundary(period: DateInterval, date: string): DateInterval[] {
  if (
    compareDateKeys(date, period.startDate) <= 0 ||
    compareDateKeys(date, period.endDateExclusive) >= 0
  ) {
    return [{ ...period }];
  }
  return [
    { startDate: period.startDate, endDateExclusive: date },
    { startDate: date, endDateExclusive: period.endDateExclusive },
  ];
}

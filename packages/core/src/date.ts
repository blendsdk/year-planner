import { type Diagnostic, diagnostic } from "./diagnostics.js";

/**
 * A validated Gregorian date-only key in `YYYY-MM-DD` form.
 * @public
 */
export type DateKey = string;

/**
 * Result of parsing a date key: either the canonical date or a diagnostic.
 * @public
 */
export type DateParseResult =
  | {
      /** True when the key parsed. */
      ok: true;
      /** Canonical date key. */
      date: DateKey;
    }
  | {
      /** False when the key is invalid. */
      ok: false;
      /** Reason the key was rejected. */
      diagnostic: Diagnostic;
    };

const MIN_YEAR = 1600;
const MAX_YEAR = 9999;
/**
 * Milliseconds in one day; used by date-only conversions.
 * @public
 */
export const MS_PER_DAY = 86_400_000;

/**
 * Returns whether a year is a Gregorian leap year.
 * @public
 */
export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Returns the number of days in a Gregorian month (month is 0-11).
 * @public
 */
export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    throw new RangeError(`Invalid month: ${year}-${month}`);
  }
  if (month === 1) return isLeapYear(year) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] as number;
}

/** Converts a Gregorian date to days since 1970-01-01. */
function daysFromCivil(year: number, month: number, day: number): number {
  let y = year;
  const m = month + 1;
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Converts days since 1970-01-01 back to a Gregorian date. */
function civilFromDays(epochDay: number): { year: number; month: number; day: number } {
  const z = epochDay + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { year: y + (m <= 2 ? 1 : 0), month: m - 1, day: d };
}

/**
 * Formats a Gregorian date as a zero-padded `DateKey`.
 * @public
 */
export function formatDateKey(date: DateKey): string {
  return date;
}

/**
 * Parses and validates a `DateKey` in the supported Gregorian range.
 * @public
 */
export function parseDateKey(value: string): DateParseResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match)
    return { ok: false, diagnostic: diagnostic("INVALID_DATE", `Invalid date: ${value}`) };

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return {
      ok: false,
      diagnostic: diagnostic("UNSUPPORTED_YEAR", `Year outside 1600-9999: ${value}`),
    };
  }
  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) {
    return { ok: false, diagnostic: diagnostic("INVALID_DATE", `Invalid date: ${value}`) };
  }
  return { ok: true, date: value };
}

/**
 * Returns whether a string is a valid supported `DateKey`.
 * @public
 */
export function isDateKey(value: string): value is DateKey {
  return parseDateKey(value).ok;
}

/**
 * Returns the Saturday-first weekday index: Sat=0, Sun=1, ... Fri=6.
 * @public
 */
export function dayOfWeek(date: DateKey): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const parsed = parseDateKey(date);
  if (!parsed.ok) throw new RangeError(parsed.diagnostic.message);
  const epochDay = daysFromCivil(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
  return ((((epochDay + 4) % 7) + 1 + 7) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Adds days to a date, returning a new `DateKey`.
 * @public
 */
export function addDays(date: DateKey, days: number): DateKey {
  const parsed = parseDateKey(date);
  if (!parsed.ok) throw new RangeError(parsed.diagnostic.message);
  const epochDay =
    daysFromCivil(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
    ) + days;
  const civil = civilFromDays(epochDay);
  return `${String(civil.year).padStart(4, "0")}-${String(civil.month + 1).padStart(2, "0")}-${String(
    civil.day,
  ).padStart(2, "0")}`;
}

/**
 * Subtracts days from a date.
 * @public
 */
export function subtractDays(date: DateKey, days: number): DateKey {
  return addDays(date, -days);
}

/**
 * Returns the number of whole days from `a` to `b` (b - a).
 * @public
 */
export function diffDays(a: DateKey, b: DateKey): number {
  const pa = parseDateKey(a);
  const pb = parseDateKey(b);
  if (!pa.ok) throw new RangeError(pa.diagnostic.message);
  if (!pb.ok) throw new RangeError(pb.diagnostic.message);
  return (
    daysFromCivil(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10))) -
    daysFromCivil(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)))
  );
}

/**
 * Compares two date keys lexicographically (valid ISO keys sort correctly).
 * @public
 */
export function compareDateKeys(a: DateKey, b: DateKey): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Returns the earlier of two dates.
 * @public
 */
export function minDate(a: DateKey, b: DateKey): DateKey {
  return compareDateKeys(a, b) <= 0 ? a : b;
}

/**
 * Returns the later of two dates.
 * @public
 */
export function maxDate(a: DateKey, b: DateKey): DateKey {
  return compareDateKeys(a, b) >= 0 ? a : b;
}

/**
 * Returns the ISO week number and ISO week-year for a date.
 * @public
 */
export function isoWeekOf(date: DateKey): {
  /** ISO week number (1-53). */
  week: number;
  /** ISO week-numbering year. */
  weekYear: number;
} {
  const parsed = parseDateKey(date);
  if (!parsed.ok) throw new RangeError(parsed.diagnostic.message);
  const epochDay = daysFromCivil(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
  const sat = dayOfWeek(date);
  const mondayBased = (sat + 5) % 7; // Mon=0 ... Sun=6
  const thursday = epochDay + (3 - mondayBased);
  const thursdayCivil = civilFromDays(thursday);
  const jan4 = daysFromCivil(thursdayCivil.year, 0, 4);
  const jan4Sat = ((((jan4 + 4) % 7) + 1 + 7) % 7) as number;
  const jan4Monday = jan4 - ((jan4Sat + 5) % 7);
  return {
    week: Math.floor((thursday - jan4Monday) / 7) + 1,
    weekYear: thursdayCivil.year,
  };
}

/**
 * Returns every date in `[start, endExclusive)`.
 * @public
 */
export function eachDate(start: DateKey, endExclusive: DateKey): DateKey[] {
  const dates: DateKey[] = [];
  let current = start;
  while (compareDateKeys(current, endExclusive) < 0) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Converts a date key to an epoch day.
 * @public
 */
export function toEpochDay(date: DateKey): number {
  return daysFromCivil(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
}

/**
 * Converts an epoch day back to a date key.
 * @public
 */
export function fromEpochDay(epochDay: number): DateKey {
  const civil = civilFromDays(epochDay);
  return `${String(civil.year).padStart(4, "0")}-${String(civil.month + 1).padStart(2, "0")}-${String(
    civil.day,
  ).padStart(2, "0")}`;
}

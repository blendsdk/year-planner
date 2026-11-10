import { addDays, isDateKey, parseDateKey, toEpochDay } from "./date.js";
import { type Diagnostic, diagnostic } from "./diagnostics.js";

/** A validated RFC 3339 instant/offset string. */
export type InstantISO = string;

/** A date-only half-open period. */
export interface AllDayPeriod {
  kind: "all-day";
  startDate: string;
  endDateExclusive: string;
}

/** A timed half-open period with an IANA display zone. */
export interface TimedPeriod {
  kind: "timed";
  start: InstantISO;
  endExclusive: InstantISO;
  timeZone: string;
}

/** A date-only or timed half-open period. */
export type PlannerPeriod = AllDayPeriod | TimedPeriod;

/** Returns whether a period is date-only. */
export function isAllDayPeriod(period: PlannerPeriod): period is AllDayPeriod {
  return period.kind === "all-day";
}

/** Validates a date-only period and its half-open ordering. */
export function validateAllDayPeriod(period: AllDayPeriod): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const start = parseDateKey(period.startDate);
  const end = parseDateKey(period.endDateExclusive);
  if (!start.ok) diagnostics.push(start.diagnostic);
  if (!end.ok) diagnostics.push(end.diagnostic);
  if (start.ok && end.ok && period.startDate >= period.endDateExclusive) {
    diagnostics.push(diagnostic("INVALID_RANGE", "Period end must be after start"));
  }
  return diagnostics;
}

/** Validates a timed period, its instants and its IANA zone. */
export function validateTimedPeriod(period: TimedPeriod): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const start = Date.parse(period.start);
  const end = Date.parse(period.endExclusive);
  if (!Number.isFinite(start))
    diagnostics.push(diagnostic("INVALID_INSTANT", `Invalid start: ${period.start}`));
  if (!Number.isFinite(end))
    diagnostics.push(diagnostic("INVALID_INSTANT", `Invalid end: ${period.endExclusive}`));
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: period.timeZone }).format(0);
  } catch {
    diagnostics.push(diagnostic("INVALID_TIMEZONE", `Unknown time zone: ${period.timeZone}`));
  }
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    diagnostics.push(diagnostic("INVALID_RANGE", "Period end must be after start"));
  }
  return diagnostics;
}

/** Validates any supported period. */
export function validatePeriod(period: PlannerPeriod): Diagnostic[] {
  return period.kind === "all-day" ? validateAllDayPeriod(period) : validateTimedPeriod(period);
}

/** Returns the number of calendar days in a date-only period. */
export function durationDays(period: AllDayPeriod): number {
  return toEpochDay(period.endDateExclusive) - toEpochDay(period.startDate);
}

/** Projects a timed period into the date span it touches in an explicit zone. */
export function projectTimedPeriod(period: TimedPeriod, timeZone: string): AllDayPeriod {
  const diagnostics = validateTimedPeriod({ ...period, timeZone });
  if (diagnostics.length > 0)
    throw new RangeError(diagnostics[0]?.message ?? "Invalid timed period");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const toDateKey = (instant: string): string => {
    const parts = formatter.formatToParts(new Date(instant));
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (!year || !month || !day) {
      throw new RangeError(`Could not project instant ${instant} in ${timeZone}`);
    }
    return `${year}-${month}-${day}`;
  };
  const endInclusive = toDateKey(new Date(Date.parse(period.endExclusive) - 1).toISOString());
  return {
    kind: "all-day",
    startDate: toDateKey(period.start),
    endDateExclusive: addDays(endInclusive, 1),
  };
}

/** Returns whether a string is a date-only period. */
export function isDateInterval(value: unknown): value is AllDayPeriod {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AllDayPeriod>;
  return (
    candidate.kind === "all-day" &&
    typeof candidate.startDate === "string" &&
    typeof candidate.endDateExclusive === "string" &&
    isDateKey(candidate.startDate) &&
    isDateKey(candidate.endDateExclusive)
  );
}

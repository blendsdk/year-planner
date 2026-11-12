import { addDays, type DateKey, type PlannerPeriod } from "@blendsdk/year-planner-core";

/**
 * Formatters derived from one explicit locale.
 */
export interface PlannerFormatters {
  locale: string;
  monthName(monthIndex: number): string;
  weekdayNames(): string[];
  formatNumber(value: number): string;
  formatDate(date: DateKey): string;
  formatPeriod(period: PlannerPeriod, displayTimeZone: string): string;
}

const FALLBACK_LOCALE = "en-US";
const SATURDAY = "2024-01-06";

function safeIntl<T>(factory: () => T): T | undefined {
  try {
    return factory();
  } catch {
    return undefined;
  }
}

function dateParts(date: DateKey): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * Builds locale formatters with an explicit Gregorian calendar.
 *
 * @param locale - Host locale; invalid values fall back to `en-US`.
 * @returns Formatters plus the effective locale.
 */
export function createFormatters(locale: string | undefined): PlannerFormatters {
  const requested = locale ?? FALLBACK_LOCALE;
  const monthFormat = safeIntl(
    () =>
      new Intl.DateTimeFormat(requested, {
        month: "short",
        calendar: "gregory",
        timeZone: "UTC",
      }),
  );
  const weekdayFormat = safeIntl(
    () =>
      new Intl.DateTimeFormat(requested, {
        weekday: "short",
        calendar: "gregory",
        timeZone: "UTC",
      }),
  );
  const dateFormat = safeIntl(
    () =>
      new Intl.DateTimeFormat(requested, {
        day: "numeric",
        month: "short",
        year: "numeric",
        calendar: "gregory",
        timeZone: "UTC",
      }),
  );
  const supported = isValidLocale(requested);
  const effective =
    supported && monthFormat && weekdayFormat && dateFormat ? requested : FALLBACK_LOCALE;
  const finalMonth =
    monthFormat ?? new Intl.DateTimeFormat(FALLBACK_LOCALE, { month: "short", timeZone: "UTC" });
  const finalWeekday =
    weekdayFormat ??
    new Intl.DateTimeFormat(FALLBACK_LOCALE, { weekday: "short", timeZone: "UTC" });
  const finalDate =
    dateFormat ??
    new Intl.DateTimeFormat(FALLBACK_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const numberFormat = safeIntl(() => new Intl.NumberFormat(effective)) ?? new Intl.NumberFormat();

  return {
    locale: effective,
    monthName: (monthIndex) => finalMonth.format(new Date(Date.UTC(2024, monthIndex, 1))),
    weekdayNames: () =>
      Array.from({ length: 7 }, (_, index) =>
        finalWeekday.format(dateParts(addDays(SATURDAY, index))),
      ),
    formatNumber: (value) => numberFormat.format(value),
    formatDate: (date) => finalDate.format(dateParts(date)),
    formatPeriod: (period, displayTimeZone) => {
      if (period.kind === "all-day") {
        const last = addDays(period.endDateExclusive, -1);
        return period.startDate === last
          ? finalDate.format(dateParts(period.startDate))
          : `${finalDate.format(dateParts(period.startDate))} - ${finalDate.format(dateParts(last))}`;
      }
      const formatter = safeIntl(
        () =>
          new Intl.DateTimeFormat(effective, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            calendar: "gregory",
            timeZone: displayTimeZone,
          }),
      );
      if (!formatter) return `${period.start} - ${period.endExclusive}`;
      return `${formatter.format(new Date(period.start))} - ${formatter.format(new Date(period.endExclusive))}`;
    },
  };
}

/**
 * Returns whether a locale can construct an Intl formatter.
 */
export function isValidLocale(locale: string): boolean {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length > 0;
  } catch {
    return false;
  }
}

/**
 * Returns whether a time zone is accepted by Intl.
 */
export function isValidTimeZone(timeZone: string): boolean {
  return safeIntl(() => new Intl.DateTimeFormat("en-US", { timeZone }).format(0)) !== undefined;
}

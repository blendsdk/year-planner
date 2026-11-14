import { addDays, type DateKey, type PlannerPeriod } from "@blendsdk/year-planner-core";
import { createDateLocaleFallback, hasDateLocaleFallback } from "./locale-fallback.js";
import { defaultPlannerMessages, type PlannerMessages } from "./messages.js";

/**
 * Formatters derived from one explicit locale.
 */
export interface PlannerFormatters {
  locale: string;
  messages: PlannerMessages;
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
 * Uses bundled calendar words when a browser lacks Armenian, Georgian or
 * Icelandic date data. Other supported locales keep native Intl formatting.
 *
 * @param locale - Host locale; invalid or unsupported values fall back to `en-US`.
 * @param messages - Active UI messages; defaults to English.
 * @returns Formatters plus the effective locale and messages.
 */
export function createFormatters(
  locale: string | undefined,
  messages: PlannerMessages = defaultPlannerMessages,
): PlannerFormatters {
  const requested = locale ?? FALLBACK_LOCALE;
  const fallback = hasNativeDateLocale(requested) ? undefined : createDateLocaleFallback(requested);
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
  // Preserve an explicit digit preference even when NumberFormat falls back to
  // another locale because this browser omits the requested locale's data.
  const numberingSystem = safeIntl(() => new Intl.Locale(effective).numberingSystem);
  const numberFormat =
    safeIntl(
      () => new Intl.NumberFormat(effective, numberingSystem ? { numberingSystem } : undefined),
    ) ?? new Intl.NumberFormat();
  const formatDate = (date: Date) => fallback?.formatDate(date) ?? finalDate.format(date);

  return {
    locale: effective,
    messages,
    monthName: (monthIndex) =>
      fallback?.monthName(monthIndex) ?? finalMonth.format(new Date(Date.UTC(2024, monthIndex, 1))),
    weekdayNames: () =>
      fallback?.weekdayNames() ??
      Array.from({ length: 7 }, (_, index) =>
        finalWeekday.format(dateParts(addDays(SATURDAY, index))),
      ),
    formatNumber: (value) => numberFormat.format(value),
    formatDate: (date) => formatDate(dateParts(date)),
    formatPeriod: (period, displayTimeZone) => {
      if (period.kind === "all-day") {
        const last = addDays(period.endDateExclusive, -1);
        return period.startDate === last
          ? formatDate(dateParts(period.startDate))
          : `${formatDate(dateParts(period.startDate))} - ${formatDate(dateParts(last))}`;
      }
      if (fallback) {
        return (
          safeIntl(
            () =>
              `${fallback.formatTimed(new Date(period.start), displayTimeZone)} - ${fallback.formatTimed(new Date(period.endExclusive), displayTimeZone)}`,
          ) ?? `${period.start} - ${period.endExclusive}`
        );
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
 * Returns whether dates can be localized using native Intl or bundled words.
 * Syntactically valid locales without either source retain the English fallback.
 */
export function isValidLocale(locale: string): boolean {
  return hasNativeDateLocale(locale) || hasDateLocaleFallback(locale);
}

/** Tests actual date-locale availability; Intl constructors silently fall back. */
function hasNativeDateLocale(locale: string): boolean {
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

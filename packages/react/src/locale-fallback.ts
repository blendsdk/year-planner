/**
 * Gregorian date words absent from some browser Intl builds.
 *
 * These are the short forms used by the planner, in calendar month order and
 * Saturday-first weekday order. Date templates preserve each locale's normal
 * punctuation, including Georgian contextual month abbreviations.
 */
interface DateLocaleData {
  /** Standalone short month names, January through December. */
  months: readonly string[];
  /** Short weekday names, Saturday through Friday. */
  weekdays: readonly string[];
  /** Local date pattern with day, month and year placeholders. */
  date: string;
  /** Local AM and PM labels for an explicitly requested 12-hour clock. */
  dayPeriods: readonly [string, string];
}

/** Eastern Armenian Gregorian calendar labels and short-date pattern. */
const ARMENIAN: DateLocaleData = {
  months: ["հնվ", "փտվ", "մրտ", "ապր", "մյս", "հնս", "հլս", "օգս", "սեպ", "հոկ", "նոյ", "դեկ"],
  weekdays: ["շբթ", "կիր", "երկ", "երք", "չրք", "հնգ", "ուր"],
  date: "{day} {month}, {year} թ.",
  dayPeriods: ["AM", "PM"],
};

/** Georgian Gregorian calendar labels and contextual short-date pattern. */
const GEORGIAN: DateLocaleData = {
  months: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
  weekdays: ["შაბ", "კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ"],
  date: "{day} {month}. {year}",
  dayPeriods: ["AM", "PM"],
};

/** Icelandic Gregorian calendar labels and short-date pattern. */
const ICELANDIC: DateLocaleData = {
  months: [
    "jan.",
    "feb.",
    "mar.",
    "apr.",
    "maí",
    "jún.",
    "júl.",
    "ágú.",
    "sep.",
    "okt.",
    "nóv.",
    "des.",
  ],
  weekdays: ["lau.", "sun.", "mán.", "þri.", "mið.", "fim.", "fös."],
  date: "{day}. {month} {year}",
  dayPeriods: ["f.h.", "e.h."],
};

/**
 * Looks up only the three known missing date locales. Parsing first rejects
 * malformed tags and lets regional variants and Unicode extensions share words.
 */
function dateLocaleData(locale: string): DateLocaleData | undefined {
  try {
    switch (new Intl.Locale(locale).language) {
      case "hy":
        return ARMENIAN;
      case "ka":
        return GEORGIAN;
      case "is":
        return ICELANDIC;
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/** Whether a valid locale has bundled Gregorian date words. */
export function hasDateLocaleFallback(locale: string): boolean {
  return dateLocaleData(locale) !== undefined;
}

/** Internal date-only fallback; timezone rules remain owned by native Intl. */
export interface DateLocaleFallback {
  /** Short standalone month name for a zero-based month. */
  monthName(monthIndex: number): string;
  /** Short weekday names in Saturday-first order. */
  weekdayNames(): string[];
  /** Local short date for the supplied UTC calendar date. */
  formatDate(date: Date): string;
  /** Local date and time after conversion to the host's display timezone. */
  formatTimed(date: Date, timeZone: string): string;
}

/**
 * Extracts a numeric part from the Latin-digit Gregorian formatter.
 * Missing parts indicate an invalid runtime result, not a date to invent.
 */
function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) throw new RangeError(`Missing date part: ${type}`);
  return Number(value);
}

/**
 * Supplies local date words without replacing Intl globally or bundling timezone
 * data. Call only when the runtime lacks the requested date locale.
 *
 * Number formatters are created once per planner locale, not once per date cell.
 * The explicit Gregorian/Latin parts formatter handles timezone boundaries and
 * daylight saving; the requested numbering system is applied only at output.
 */
export function createDateLocaleFallback(locale: string): DateLocaleFallback | undefined {
  const data = dateLocaleData(locale);
  if (!data) return undefined;
  const preferences = new Intl.Locale(locale);
  // A browser can also lack NumberFormat data and discard locale extensions.
  // Explicit options preserve the requested digits after that locale fallback.
  const numberingSystem = preferences.numberingSystem ?? "latn";
  const number = new Intl.NumberFormat(locale, { useGrouping: false, numberingSystem });
  const paddedNumber = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumIntegerDigits: 2,
    numberingSystem,
  });
  // Locale parsing accepts unknown extension values; explicit formatter options
  // do not. Ignore an unsupported clock preference just as native Intl does.
  const requestedCycle = preferences.hourCycle;
  const hourCycle =
    requestedCycle === "h11" ||
    requestedCycle === "h12" ||
    requestedCycle === "h23" ||
    requestedCycle === "h24"
      ? requestedCycle
      : "h23";

  /** Composes a Gregorian date with the local digits, words and punctuation. */
  const formatDateParts = (day: number, month: number, year: number): string => {
    return data.date
      .replace("{day}", number.format(day))
      .replace("{month}", data.months[month] ?? "")
      .replace("{year}", number.format(year));
  };

  return {
    monthName: (monthIndex) => data.months[monthIndex] ?? "",
    weekdayNames: () => [...data.weekdays],
    formatDate: (date) =>
      formatDateParts(date.getUTCDate(), date.getUTCMonth(), date.getUTCFullYear()),
    formatTimed: (date, timeZone) => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        calendar: "gregory",
        numberingSystem: "latn",
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle,
      }).formatToParts(date);
      const dateText = formatDateParts(
        numericPart(parts, "day"),
        numericPart(parts, "month") - 1,
        numericPart(parts, "year"),
      );
      const timeText = `${paddedNumber.format(numericPart(parts, "hour"))}:${paddedNumber.format(numericPart(parts, "minute"))}`;
      const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value;
      const suffix = dayPeriod
        ? ` ${data.dayPeriods[dayPeriod.toLowerCase() === "am" ? 0 : 1]}`
        : "";
      return `${dateText}, ${timeText}${suffix}`;
    },
  };
}

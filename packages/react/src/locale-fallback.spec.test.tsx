import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFormatters, isValidLocale } from "./locale.js";
import { YearPlanner } from "./YearPlanner.js";

/** Native timezone calculations retained by the limited-locale browser fixture. */
const NativeDateTimeFormat = Intl.DateTimeFormat;
/** Native numeric operations retained when the fixture removes locale data. */
const NativeNumberFormat = Intl.NumberFormat;

/** Simulates a browser falling back to English when its locale data is absent. */
function limitedLocale(locales: Intl.LocalesArgument): Intl.LocalesArgument {
  const locale =
    typeof locales === "string"
      ? locales
      : locales instanceof Intl.Locale
        ? locales.toString()
        : locales?.[0]?.toString();
  return locale && /^(hy|ka|is)(-|$)/i.test(locale) ? "en-US" : locales;
}

/**
 * Models Chromium's missing date locale data while preserving native date and
 * timezone calculations. Only the external Intl capability is replaced.
 */
class LimitedDateTimeFormat extends NativeDateTimeFormat {
  constructor(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
    super(limitedLocale(locales), options);
  }

  /** Reports the same missing date locales as the browser reproduction. */
  static override supportedLocalesOf(
    locales: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ): string[] {
    return NativeDateTimeFormat.supportedLocalesOf(locales, options).filter(
      (locale) => !/^(hy|ka|is)(-|$)/i.test(locale),
    );
  }
}

/** Models missing numeric locale data, including dropped locale extensions. */
class LimitedNumberFormat extends NativeNumberFormat {
  constructor(locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
    super(limitedLocale(locales), options);
  }
}

/** Gregorian names and date patterns expected by users of the bundled locales. */
const cases = [
  {
    locale: "hy-AM",
    months: ["հնվ", "փտվ", "մրտ", "ապր", "մյս", "հնս", "հլս", "օգս", "սեպ", "հոկ", "նոյ", "դեկ"],
    weekdays: ["շբթ", "կիր", "երկ", "երք", "չրք", "հնգ", "ուր"],
    date: "4 հնվ, 2016 թ.",
    lastDay: "5 հնվ, 2016 թ.",
    zonedStart: "31 դեկ, 2026 թ., 16:05",
    zonedEnd: "31 դեկ, 2026 թ., 17:05",
  },
  {
    locale: "ka-GE",
    months: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
    weekdays: ["შაბ", "კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ"],
    date: "4 იან. 2016",
    lastDay: "5 იან. 2016",
    zonedStart: "31 დეკ. 2026, 16:05",
    zonedEnd: "31 დეკ. 2026, 17:05",
  },
  {
    locale: "is-IS",
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
    date: "4. jan. 2016",
    lastDay: "5. jan. 2016",
    zonedStart: "31. des. 2026, 16:05",
    zonedEnd: "31. des. 2026, 17:05",
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "Intl",
    new Proxy(Intl, {
      get(target, property, receiver) {
        if (property === "DateTimeFormat") return LimitedDateTimeFormat;
        if (property === "NumberFormat") return LimitedNumberFormat;
        return Reflect.get(target, property, receiver);
      },
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each(cases)("date locale without browser data: $locale", (sample) => {
  it("preserves the requested locale and all calendar names", () => {
    expect(Intl.DateTimeFormat.supportedLocalesOf(sample.locale)).toEqual([]);
    const formatters = createFormatters(sample.locale);
    expect(isValidLocale(sample.locale)).toBe(true);
    expect(formatters.locale).toBe(sample.locale);
    expect(Array.from({ length: 12 }, (_, month) => formatters.monthName(month))).toEqual(
      sample.months,
    );
    expect(formatters.weekdayNames()).toEqual(sample.weekdays);
    expect(formatters.formatDate("2016-01-04")).toBe(sample.date);
  });

  it("formats all-day ranges with an inclusive final day", () => {
    const formatters = createFormatters(sample.locale);
    expect(
      formatters.formatPeriod(
        { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-05" },
        "UTC",
      ),
    ).toBe(sample.date);
    expect(
      formatters.formatPeriod(
        { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-06" },
        "UTC",
      ),
    ).toBe(`${sample.date} - ${sample.lastDay}`);
  });

  it("localizes timed periods after timezone and year-boundary conversion", () => {
    expect(
      createFormatters(sample.locale).formatPeriod(
        {
          kind: "timed",
          timeZone: "UTC",
          start: "2027-01-01T00:05:00Z",
          endExclusive: "2027-01-01T01:05:00Z",
        },
        "America/Los_Angeles",
      ),
    ).toBe(`${sample.zonedStart} - ${sample.zonedEnd}`);
  });

  it("renders localized calendar, accessible date and print labels without an invalid-locale diagnostic", () => {
    const onDiagnostic = vi.fn();
    const { container } = render(
      <YearPlanner year={2016} display={{ locale: sample.locale }} onDiagnostic={onDiagnostic} />,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(sample.weekdays[0] ?? "");
    expect(container.querySelector('[data-row-id="2016-01"] .yp-month')).toHaveTextContent(
      sample.months[0] ?? "",
    );
    expect(container.querySelector('[data-date="2016-01-04"]')).toHaveTextContent(sample.date);
    expect(container.querySelector(".yp-print-heading")).toHaveTextContent(
      sample.weekdays[0] ?? "",
    );
    expect(
      container.querySelector('[data-print-row-id="2016-01"] .yp-print-month'),
    ).toHaveTextContent(sample.months[0] ?? "");
    expect(onDiagnostic).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: "INVALID_LOCALE" }),
    );
  });
});

describe("fallback integration and edge cases", () => {
  it("updates the visible labels and inspector period when the language changes", () => {
    const props = {
      year: 2016,
      defaultSelection: { dates: [], items: ["project"] },
      layers: [{ id: "work", name: "Work", channel: "ribbon" as const, color: "#1d4e89" }],
      defaultItems: [
        {
          id: "project",
          title: "Project",
          layerId: "work",
          kind: "activity" as const,
          version: 1,
          period: {
            kind: "all-day" as const,
            startDate: "2016-01-04",
            endDateExclusive: "2016-01-06",
          },
        },
      ],
    };
    const { container, rerender } = render(
      <YearPlanner {...props} display={{ locale: "de-DE" }} />,
    );
    rerender(<YearPlanner {...props} display={{ locale: "hy-AM" }} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("շբթ");
    expect(container.querySelector('[data-yp-part="inspector"]')).toHaveTextContent(
      "4 հնվ, 2016 թ. - 5 հնվ, 2016 թ.",
    );
    rerender(<YearPlanner {...props} display={{ locale: "en-US" }} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Sat");
    expect(container.querySelector('[data-row-id="2016-01"] .yp-month')).toHaveTextContent("Jan");
  });

  it("uses the language fallback for a valid regional locale and keeps locale extensions", () => {
    const formatters = createFormatters("hy-AM-u-hc-h12-nu-arab");
    expect(formatters.monthName(0)).toBe("հնվ");
    expect(formatters.formatDate("2016-01-04")).toBe("٤ հնվ, ٢٠١٦ թ.");
    expect(formatters.formatNumber(4)).toBe("٤");
    expect(
      formatters.formatPeriod(
        {
          kind: "timed",
          timeZone: "UTC",
          start: "2027-01-04T13:05:00Z",
          endExclusive: "2027-01-04T14:05:00Z",
        },
        "UTC",
      ),
    ).toBe("٤ հնվ, ٢٠٢٧ թ., ٠١:٠٥ PM - ٤ հնվ, ٢٠٢٧ թ., ٠٢:٠٥ PM");
    expect(createFormatters("hy").monthName(0)).toBe("հնվ");
    expect(createFormatters("hy-GB").monthName(0)).toBe("հնվ");
  });

  it("uses real timezone rules across daylight saving changes", () => {
    expect(
      createFormatters("hy-AM").formatPeriod(
        {
          kind: "timed",
          timeZone: "UTC",
          start: "2027-03-28T00:30:00Z",
          endExclusive: "2027-03-28T01:30:00Z",
        },
        "Europe/Paris",
      ),
    ).toBe("28 մրտ, 2027 թ., 01:30 - 28 մրտ, 2027 թ., 03:30");
  });

  it("matches native Icelandic spacing in twelve-hour periods", () => {
    expect(
      createFormatters("is-IS-u-hc-h12").formatPeriod(
        {
          kind: "timed",
          timeZone: "UTC",
          start: "2027-01-04T13:05:00Z",
          endExclusive: "2027-01-04T14:05:00Z",
        },
        "UTC",
      ),
    ).toBe("4. jan. 2027, 01:05 e.h. - 4. jan. 2027, 02:05 e.h.");
  });

  it("ignores an unknown hour-cycle extension like native Intl", () => {
    expect(
      createFormatters("hy-AM-u-hc-h25").formatPeriod(
        {
          kind: "timed",
          timeZone: "UTC",
          start: "2027-01-04T13:05:00Z",
          endExclusive: "2027-01-04T14:05:00Z",
        },
        "UTC",
      ),
    ).toBe("4 հնվ, 2027 թ., 13:05 - 4 հնվ, 2027 թ., 14:05");
  });

  it("keeps leap-day dates and low years accurate", () => {
    const formatters = createFormatters("hy-AM");
    expect(formatters.formatDate("2028-02-29")).toBe("29 փտվ, 2028 թ.");
    expect(formatters.formatDate("0099-01-04")).toBe("4 հնվ, 99 թ.");
  });

  it("preserves native locales and safely falls back for invalid or unknown locale input", () => {
    expect(createFormatters("de-DE").monthName(2)).toBe("Mär");
    for (const locale of ["not-a-locale", "zz-ZZ", '<script>alert("locale")</script>']) {
      expect(isValidLocale(locale)).toBe(false);
      expect(createFormatters(locale).locale).toBe("en-US");
      expect(createFormatters(locale).monthName(0)).toBe("Jan");
    }
  });
});

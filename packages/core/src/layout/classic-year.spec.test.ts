import { describe, expect, it } from "vitest";
import { buildClassicYearLayout, dateToColumn, paginatePrintRows } from "./classic-year";

describe("RD-03-AC-01/02: classic 14-month layout", () => {
  const result = buildClassicYearLayout({ year: 2016 });
  if (!result.ok) throw new Error("expected layout");
  const layout = result.layout;

  it("has 14 rows from Dec 2015 to Jan 2017", () => {
    expect(layout.rows).toHaveLength(14);
    expect(layout.rows[0]?.rowId).toBe("2015-12");
    expect(layout.rows[1]?.rowId).toBe("2016-01");
    expect(layout.rows[13]?.rowId).toBe("2017-01");
  });

  it("has 37 day columns per row and mirrored month bands", () => {
    for (const row of layout.rows) {
      expect(row.columns).toHaveLength(37);
      expect(row.prefixWidths).toHaveLength(38);
    }
    expect(layout.monthBandWidth).toBe(70);
    expect(layout.totalDayWidth).toBe(1855);
  });
});

describe("RD-03-AC-03/04/05: date-to-column mapping", () => {
  const result = buildClassicYearLayout({ year: 2016 });
  if (!result.ok) throw new Error("expected layout");
  const layout = result.layout;
  const jan = layout.rows.find((row) => row.rowId === "2016-01");
  const jan2017 = layout.rows.find((row) => row.rowId === "2017-01");
  if (!jan || !jan2017) throw new Error("expected rows");

  it("places Jan 1 2016 at column 6 and Jan 31 at column 36", () => {
    expect(dateToColumn(jan, "2016-01-01")).toBe(6);
    expect(dateToColumn(jan, "2016-01-31")).toBe(36);
  });

  it("places Jan 1 2017 at column 1 and Jan 31 at column 31", () => {
    expect(dateToColumn(jan2017, "2017-01-01")).toBe(1);
    expect(dateToColumn(jan2017, "2017-01-31")).toBe(31);
  });

  it("counts 29 and 28 days for February 2016 and 2017", () => {
    const feb2016 = layout.rows.find((row) => row.rowId === "2016-02");
    if (!feb2016) throw new Error("expected February 2016 row");
    const result2017 = buildClassicYearLayout({ year: 2017 });
    if (!result2017.ok) throw new Error("expected 2017 layout");
    const feb2017 = result2017.layout.rows.find((row) => row.rowId === "2017-02");
    if (!feb2017) throw new Error("expected February 2017 row");
    expect(feb2016.columns.filter((column) => column.date).length).toBe(29);
    expect(feb2017.columns.filter((column) => column.date).length).toBe(28);
  });
});

describe("RD-03-AC-07/08/09/10/14/15: dynamic windows and input safety", () => {
  it("builds 12, 18, 24 and 36 month windows", () => {
    for (const monthCount of [12, 18, 24, 36]) {
      const result = buildClassicYearLayout({
        range: { start: { year: 2027, month: 0 }, monthCount },
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.layout.rows).toHaveLength(monthCount);
    }
  });

  it("rejects 11 and 37 months", () => {
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 0 }, monthCount: 11 } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: "INVALID_MONTH_COUNT" }],
    });
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 0 }, monthCount: 37 } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: "INVALID_MONTH_COUNT" }],
    });
  });

  it("rejects invalid contextMonths and ranges beyond 9999", () => {
    expect(
      buildClassicYearLayout({ year: 2016, contextMonths: { before: -1, after: 1 } }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: "INVALID_CONTEXT_MONTHS" }],
    });
    expect(
      buildClassicYearLayout({ range: { start: { year: 9999, month: 5 }, monthCount: 12 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "INVALID_RANGE" }] });
    expect(
      buildClassicYearLayout({ range: { start: { year: 1600, month: 0 }, monthCount: 12 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "UNSUPPORTED_VIEW_YEAR" }] });
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 12 }, monthCount: 12 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "INVALID_MONTH" }] });
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 1.5 }, monthCount: 12 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "INVALID_MONTH" }] });
  });

  it("defaults the year preset tint to the requested year", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("expected layout");
    expect(result.layout.rows[0]?.kind).toBe("context");
    expect(result.layout.rows[1]?.kind).toBe("current");
    expect(result.layout.rows[13]?.kind).toBe("context");
  });

  it("paginates 14 rows per page", () => {
    const result = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    });
    if (!result.ok) throw new Error("expected layout");
    expect(paginatePrintRows(result.layout, 14)).toHaveLength(3);
  });
});

describe("RD-03-AC-11/15: blank slots and input safety", () => {
  it("carries no date on blank slots and keeps every dated slot inside the month", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("expected layout");
    for (const row of result.layout.rows) {
      for (const column of row.columns) {
        if (column.date) {
          expect(column.date.startsWith(row.rowId)).toBe(true);
          expect(column.width).toBeGreaterThan(0);
        } else {
          expect(column.width).toBeGreaterThan(0);
        }
      }
      expect(row.columns.filter((column) => column.date).length).toBe(row.daysInMonth);
    }
  });
});

describe("RD-03-AC-12: weekend geometry", () => {
  it("makes weekend columns narrower and keeps prefix sums monotonic", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("expected layout");
    for (const row of result.layout.rows) {
      const weekend = row.columns.filter((column) => column.isWeekend);
      const weekday = row.columns.filter((column) => !column.isWeekend);
      expect(Math.max(...weekend.map((column) => column.width))).toBeLessThan(
        Math.min(...weekday.map((column) => column.width)),
      );
      for (let index = 1; index < row.prefixWidths.length; index += 1) {
        expect(row.prefixWidths[index]).toBeGreaterThan(row.prefixWidths[index - 1] ?? 0);
      }
    }
  });
});

describe("RD-03-AC-13: deterministic layout", () => {
  it("produces identical rows, prefixes and signature for identical inputs", () => {
    const first = buildClassicYearLayout({ year: 2016 });
    const second = buildClassicYearLayout({ year: 2016 });
    if (!first.ok || !second.ok) throw new Error("expected layouts");
    expect(first.layout.signature).toBe(second.layout.signature);
    expect(first.layout.rows).toEqual(second.layout.rows);
    expect(first.layout.totalDayWidth).toBe(second.layout.totalDayWidth);
  });
});

describe("RD-03-AC-07/08: exact dynamic windows", () => {
  it("renders January through December 2027 only for a 12-month window", () => {
    const result = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: 12 },
    });
    if (!result.ok) throw new Error("expected layout");
    expect(result.layout.rows.map((row) => row.rowId)).toEqual([
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
      "2027-07",
      "2027-08",
      "2027-09",
      "2027-10",
      "2027-11",
      "2027-12",
    ]);
    expect(result.layout.rows.every((row) => row.kind === "current")).toBe(true);
    expect(result.layout.highlightYear).toBe(2027);
  });

  it("renders July 2027 through December 2028 with context tint for an 18-month window", () => {
    const result = buildClassicYearLayout({
      range: { start: { year: 2027, month: 6 }, monthCount: 18 },
    });
    if (!result.ok) throw new Error("expected layout");
    expect(result.layout.rows).toHaveLength(18);
    expect(result.layout.rows[0]?.rowId).toBe("2027-07");
    expect(result.layout.rows[17]?.rowId).toBe("2028-12");
    expect(result.layout.rows[0]?.kind).toBe("current");
    expect(result.layout.rows[17]?.kind).toBe("context");
    expect(result.layout.rows.filter((row) => row.year === 2028)).toHaveLength(12);
  });
});

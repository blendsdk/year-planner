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

describe("RD-03-AC-07/08/09/10/14: dynamic windows", () => {
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

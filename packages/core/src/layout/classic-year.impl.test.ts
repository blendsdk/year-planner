import { describe, expect, it } from "vitest";
import {
  buildClassicYearLayout,
  dateToColumn,
  layoutSignature,
  paginatePrintRows,
  rowForDate,
} from "./classic-year";

describe("classic layout internals", () => {
  it("maps every possible month start column to the correct first date", () => {
    for (let year = 2015; year <= 2026; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        const result = buildClassicYearLayout({
          range: { start: { year, month }, monthCount: 12 },
        });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        const row = result.layout.rows[0];
        if (!row) throw new Error("missing row");
        const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        expect(dateToColumn(row, first)).toBe(row.firstColumn);
        expect(rowForDate(result.layout, first)?.rowId).toBe(row.rowId);
      }
    }
  });

  it("keeps prefix widths monotonic and total width consistent", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("expected layout");
    for (const row of result.layout.rows) {
      for (let index = 1; index < row.prefixWidths.length; index += 1) {
        expect(row.prefixWidths[index] as number).toBeGreaterThan(
          row.prefixWidths[index - 1] as number,
        );
      }
      expect(row.prefixWidths[37]).toBe(result.layout.totalDayWidth);
    }
  });

  it("produces a stable signature and validates print pagination", () => {
    const a = buildClassicYearLayout({ year: 2016 });
    const b = buildClassicYearLayout({ year: 2016 });
    if (!a.ok || !b.ok) throw new Error("expected layouts");
    expect(layoutSignature(a.layout)).toBe(layoutSignature(b.layout));
    expect(() => paginatePrintRows(a.layout, 0)).toThrow();
    expect(() => paginatePrintRows(a.layout, 15)).toThrow();
  });
});

import { clampToRow, rowDateRange } from "./classic-year";

describe("classic layout validation and helpers", () => {
  it("rejects invalid months, counts, years and context windows", () => {
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 12 }, monthCount: 12 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "INVALID_MONTH" }] });
    expect(
      buildClassicYearLayout({ range: { start: { year: 2027, month: 0 }, monthCount: 11 } }),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "INVALID_MONTH_COUNT" }] });
    expect(buildClassicYearLayout({})).toMatchObject({
      ok: false,
      diagnostics: [{ code: "MISSING_RANGE" }],
    });
    expect(buildClassicYearLayout({ year: 1600 })).toMatchObject({
      ok: false,
      diagnostics: [{ code: "UNSUPPORTED_VIEW_YEAR" }],
    });
    expect(buildClassicYearLayout({ year: 9999 })).toMatchObject({
      ok: false,
      diagnostics: [{ code: "UNSUPPORTED_VIEW_YEAR" }],
    });
    for (const contextMonths of [
      { before: 13, after: 0 },
      { before: 0, after: 13 },
      { before: 1.5, after: 0 },
    ]) {
      expect(buildClassicYearLayout({ year: 2027, contextMonths })).toMatchObject({
        ok: false,
        diagnostics: [{ code: "INVALID_CONTEXT_MONTHS" }],
      });
    }
  });

  it("honors an explicit highlight year", () => {
    const result = buildClassicYearLayout({ year: 2027, highlightYear: 2028 });
    if (!result.ok) throw new Error("expected layout");
    expect(result.layout.highlightYear).toBe(2028);
    expect(
      result.layout.rows.every((row) => row.kind === (row.year === 2028 ? "current" : "context")),
    ).toBe(true);
  });

  it("rejects dates outside a row and misses outside the layout", () => {
    const result = buildClassicYearLayout({ year: 2027 });
    if (!result.ok) throw new Error("expected layout");
    const january = result.layout.rows.find((row) => row.rowId === "2027-01");
    if (!january) throw new Error("missing January");
    expect(() => dateToColumn(january, "2026-12-31")).toThrow(RangeError);
    expect(() => dateToColumn(january, "2027-02-01")).toThrow(RangeError);
    expect(() => dateToColumn(january, "nope")).toThrow(RangeError);
    expect(rowForDate(result.layout, "2025-01-01")).toBeUndefined();
  });

  it("clamps dates to a row and reports row date ranges", () => {
    const result = buildClassicYearLayout({ year: 2027 });
    if (!result.ok) throw new Error("expected layout");
    const february = result.layout.rows.find((row) => row.rowId === "2027-02");
    if (!february) throw new Error("missing February");
    expect(rowDateRange(february)).toEqual({
      start: "2027-02-01",
      endExclusive: "2027-03-01",
    });
    expect(clampToRow(february, "2027-01-15")).toBe("2027-02-01");
    expect(clampToRow(february, "2027-03-15")).toBe("2027-02-28");
    expect(clampToRow(february, "2027-02-15")).toBe("2027-02-15");
    expect(paginatePrintRows(result.layout, 1)).toHaveLength(14);
    const wide = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: 36 },
    });
    if (!wide.ok) throw new Error("expected 36-month layout");
    expect(paginatePrintRows(wide.layout, 7)).toHaveLength(6);
  });
});

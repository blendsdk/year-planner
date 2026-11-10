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

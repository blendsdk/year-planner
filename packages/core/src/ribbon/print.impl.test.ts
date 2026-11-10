import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import { buildRibbonLayout } from "./fragments";
import { A3_LANDSCAPE_INNER_HEIGHT, A3_LANDSCAPE_INNER_WIDTH, planRibbonPrint } from "./print";

function ribbonFor(monthCount: number) {
  const layout = buildClassicYearLayout({
    range: { start: { year: 2027, month: 0 }, monthCount },
  });
  if (!layout.ok) throw new Error("layout");
  return buildRibbonLayout(layout.layout, {
    model: { groups: [], layers: [], items: [], resources: [] },
    visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
  });
}

describe("print internals", () => {
  it("defaults to A3 paginate with 14 rows per page", () => {
    const result = planRibbonPrint(ribbonFor(18));
    if (!result.ok) throw new Error("plan");
    expect(result.plan.page).toBe("A3");
    expect(result.plan.mode).toBe("paginate");
    expect(result.plan.scale).toBe(1);
    expect(result.plan.pages.map((page) => page.rows.length)).toEqual([14, 4]);
    expect(result.plan.pages.map((page) => page.firstRowIndex)).toEqual([0, 14]);
  });

  it("honours a custom rows per page", () => {
    const result = planRibbonPrint(ribbonFor(12), { rowsPerPage: 7 });
    if (!result.ok) throw new Error("plan");
    expect(result.plan.pages.map((page) => page.rows.length)).toEqual([7, 5]);
    for (const page of result.plan.pages) {
      expect(page.contentHeight).toBe(page.rows.length * 90 + 72);
      expect(page.scale).toBeCloseTo(
        Math.min(
          1,
          A3_LANDSCAPE_INNER_WIDTH / 1995,
          A3_LANDSCAPE_INNER_HEIGHT / page.contentHeight,
        ),
        6,
      );
    }
  });

  it("scales a single-row page by width", () => {
    const result = planRibbonPrint(ribbonFor(12), { rowsPerPage: 1 });
    if (!result.ok) throw new Error("plan");
    expect(result.plan.pages).toHaveLength(12);
    expect(result.plan.pages[0]?.scale).toBeCloseTo(1542 / 1995, 6);
  });

  it("handles zero rows", () => {
    const layout = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: 12 },
    });
    if (!layout.ok) throw new Error("layout");
    const ribbon = {
      ...buildRibbonLayout(layout.layout, {
        model: { groups: [], layers: [], items: [], resources: [] },
        visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
      }),
      rows: [],
    };
    const paginate = planRibbonPrint(ribbon);
    if (!paginate.ok) throw new Error("plan");
    expect(paginate.plan.pages).toHaveLength(0);
    const fit = planRibbonPrint(ribbon, { mode: "fit" });
    if (!fit.ok) throw new Error("plan");
    expect(fit.plan.pages).toHaveLength(1);
    expect(fit.plan.requiresPaginate).toBe(true);
  });

  it("emits the fit diagnostic at warning level", () => {
    const result = planRibbonPrint(ribbonFor(18), { mode: "fit" });
    if (!result.ok) throw new Error("plan");
    expect(result.plan.diagnostics).toHaveLength(1);
    expect(result.plan.diagnostics[0]?.level).toBe("warning");
    expect(result.plan.diagnostics[0]?.message).not.toContain("2027");
  });

  it("rejects a fractional rows per page", () => {
    const result = planRibbonPrint(ribbonFor(12), { rowsPerPage: 14.5 });
    expect(result.ok).toBe(false);
  });
});

describe("print no-warning regression", () => {
  it("does not warn when a small ribbon fits at scale 1", () => {
    const source = ribbonFor(12);
    const first = source.rows[0];
    if (!first) throw new Error("missing row");
    const ribbon = {
      ...source,
      totalWidth: 1000,
      rows: [{ ...first, height: 100 }],
      headerHeight: 0,
      footerHeight: 0,
    };
    const result = planRibbonPrint(ribbon, { mode: "fit" });
    if (!result.ok) throw new Error("plan");
    expect(result.plan.scale).toBe(1);
    expect(result.plan.requiresPaginate).toBe(false);
    expect(result.plan.diagnostics).toHaveLength(0);
  });
});

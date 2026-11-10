import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "../layout/classic-year";
import type { PlannerItem, PlannerModel } from "../model/types";
import { buildRibbonLayout } from "./fragments";
import {
  A3_LANDSCAPE_INNER_HEIGHT,
  A3_LANDSCAPE_INNER_WIDTH,
  PRINT_MIN_DATE_TEXT_PT,
  type PrintOptions,
  planRibbonPrint,
} from "./print";

function layoutFor(monthCount: number) {
  const result = buildClassicYearLayout({
    range: { start: { year: 2027, month: 0 }, monthCount },
  });
  if (!result.ok) throw new Error(result.diagnostics[0]?.message ?? "layout");
  return result.layout;
}

function ribbonFor(monthCount: number, items: PlannerItem[] = []) {
  const model: PlannerModel = {
    groups: [],
    layers: [{ id: "ribbon", name: "Ribbon", channel: "ribbon", color: "#1d4e89" }],
    items,
    resources: [],
  };
  return buildRibbonLayout(layoutFor(monthCount), {
    model,
    visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
  });
}

const options = (overrides: PrintOptions): PrintOptions => overrides;

describe("RD-05 print pagination", () => {
  it("uses the 14-row page boundaries", () => {
    const cases: Array<[number, number]> = [
      [12, 1],
      [14, 1],
      [15, 2],
      [18, 2],
      [24, 2],
      [28, 2],
      [29, 3],
      [36, 3],
    ];
    for (const [months, pages] of cases) {
      const result = planRibbonPrint(ribbonFor(months), options({ mode: "paginate" }));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.plan.pages).toHaveLength(pages);
      expect(result.plan.pages.flatMap((page) => page.rows)).toHaveLength(months);
    }
  });

  it("scales every page inside both A3 dimensions without splitting a row", () => {
    for (const months of [14, 18, 24, 29, 36]) {
      const result = planRibbonPrint(ribbonFor(months), options({ mode: "paginate" }));
      if (!result.ok) throw new Error("plan");
      for (const page of result.plan.pages) {
        expect(page.rows.length).toBeLessThanOrEqual(14);
        expect(page.contentHeight * page.scale).toBeLessThanOrEqual(
          A3_LANDSCAPE_INNER_HEIGHT + 0.001,
        );
        expect(1995 * page.scale).toBeLessThanOrEqual(A3_LANDSCAPE_INNER_WIDTH + 0.001);
      }
    }
  });

  it("splits 36 rows into 14/14/8 pages", () => {
    const result = planRibbonPrint(ribbonFor(36), options({ mode: "paginate" }));
    if (!result.ok) throw new Error("plan");
    expect(result.plan.pages.map((page) => page.rows.length)).toEqual([14, 14, 8]);
  });
});

describe("RD-05 print fit", () => {
  it("returns one page and a warning for 18 months", () => {
    const result = planRibbonPrint(ribbonFor(18), options({ mode: "fit" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.pages).toHaveLength(1);
    expect(result.plan.scale).toBeLessThan(0.7);
    expect(result.plan.scale).toBeCloseTo(1077 / 1692, 4);
    expect(result.plan.requiresPaginate).toBe(true);
    expect(result.plan.diagnostics.map((entry) => entry.code)).toContain("PRINT_FIT_TOO_SMALL");
    const printed = 12 * result.plan.scale * 0.75;
    expect(printed).toBeLessThan(PRINT_MIN_DATE_TEXT_PT);
  });

  it("returns a width-bound warning for 14 months", () => {
    const result = planRibbonPrint(ribbonFor(14), options({ mode: "fit" }));
    if (!result.ok) throw new Error("plan");
    expect(result.plan.pages).toHaveLength(1);
    expect(result.plan.scale).toBeCloseTo(1542 / 1995, 4);
    expect(result.plan.requiresPaginate).toBe(true);
    expect(result.plan.diagnostics.map((entry) => entry.code)).toContain("PRINT_FIT_TOO_SMALL");
  });

  it("shrinks an expanded 14-row page until it fits", () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      id: `item-${index}`,
      kind: "activity" as const,
      layerId: "ribbon",
      period: {
        kind: "all-day" as const,
        startDate: "2027-01-01",
        endDateExclusive: "2028-03-01",
      },
      title: `Item ${index}`,
      version: 1,
    }));
    const ribbon = buildRibbonLayout(
      layoutFor(14),
      {
        model: {
          groups: [],
          layers: [{ id: "ribbon", name: "Ribbon", channel: "ribbon", color: "#1d4e89" }],
          items,
          resources: [],
        },
        visibility: { hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] },
      },
      { density: "expanded" },
    );
    expect(ribbon.rows.every((row) => row.height === 378)).toBe(true);
    const result = planRibbonPrint(ribbon, options({ mode: "fit" }));
    if (!result.ok) throw new Error("plan");
    expect(result.plan.scale).toBeCloseTo(1077 / (14 * 378 + 72), 4);
    expect(result.plan.requiresPaginate).toBe(true);
    expect(result.plan.diagnostics.map((entry) => entry.code)).toContain("PRINT_FIT_TOO_SMALL");
  });
});

describe("RD-05 print validation", () => {
  it("rejects invalid page, mode and rowsPerPage values", () => {
    const ribbon = ribbonFor(14);
    const cases: PrintOptions[] = [
      options({ page: "A4" as never }),
      options({ mode: "auto" as never }),
      options({ rowsPerPage: 0 }),
      options({ rowsPerPage: 15 }),
      options({ rowsPerPage: 1.5 }),
    ];
    for (const entry of cases) {
      const result = planRibbonPrint(ribbon, entry);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "INVALID_PRINT_OPTIONS",
      );
    }
  });

  it("handles an empty ribbon", () => {
    const result = planRibbonPrint(ribbonFor(12), options({ mode: "paginate" }));
    if (!result.ok) throw new Error("plan");
    expect(result.plan.pages).toHaveLength(1);
    expect(result.plan.pages[0]?.rows).toHaveLength(12);
    expect(result.plan.pages[0]?.contentHeight).toBe(12 * 90 + 72);
  });
});

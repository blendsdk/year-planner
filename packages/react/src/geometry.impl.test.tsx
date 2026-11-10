import { buildClassicYearLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  clampZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  pointToDate,
  pointToFragment,
  rowTemplate,
  rowTop,
  scaledRowHeight,
  scaleFragment,
} from "./geometry";

describe("geometry helpers", () => {
  it("clamps zoom to the supported range and defaults invalid values", () => {
    expect(clampZoom(undefined)).toBe(1);
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(2)).toBe(MAX_ZOOM);
    expect(clampZoom(1.2)).toBe(1.2);
  });

  it("scales fragments and rows", () => {
    const fragment = {
      x: 80,
      y: 18,
      width: 165,
      height: 18,
    } as never;
    expect(scaleFragment(fragment, 0.75)).toEqual({
      x: 60,
      y: 13.5,
      width: 123.75,
      height: 13.5,
    });
    expect(scaledRowHeight(90, 1.5)).toBe(135);
  });

  it("builds a 39-track template and cumulative tops", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("layout");
    const row = result.layout.rows[0];
    if (!row) throw new Error("row");
    const template = rowTemplate(row, 1, 70).split(" ");
    expect(template).toHaveLength(39);
    expect(template[0]).toBe("70px");
    expect(template[38]).toBe("70px");
    expect(rowTop({ rows: [{ top: 0 }, { top: 90 }] } as never, 1)).toBe(90);
  });

  it("returns undefined outside the grid", () => {
    const result = buildClassicYearLayout({ year: 2016 });
    if (!result.ok) throw new Error("layout");
    const view = {
      zoom: 1,
      monthBandWidth: 70,
      scrollLeft: 0,
      scrollTop: 0,
      viewportRect: { left: 0, top: 0, width: 1200, height: 900 },
      headerHeight: 36,
    };
    expect(pointToDate(result.layout, { clientX: 0, clientY: 200 }, view)).toBeUndefined();
    expect(
      pointToFragment(
        {
          rows: [],
          fragments: [],
          density: "compact",
          compactMaxLanes: 3,
          laneHeight: 18,
          laneTop: 18,
          headerHeight: 36,
          footerHeight: 36,
          monthBandWidth: 70,
          totalDayWidth: 1855,
          totalWidth: 1995,
          height: 0,
          signature: "",
        },
        { clientX: 100, clientY: 200 },
        view,
      ),
    ).toBeUndefined();
  });
});

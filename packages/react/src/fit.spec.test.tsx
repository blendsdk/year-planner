import { describe, expect, it } from "vitest";
import {
  computeFit,
  FIT_MIN_TARGET,
  FIT_PROFILES,
  naturalGridHeight,
  naturalGridWidth,
} from "./fit.js";

/** The classic 14-month row has 27 weekday and 10 weekend columns. */
const WEEKDAYS = 27;
const WEEKENDS = 10;

/** Returns a defined fit result or fails the test with a clear message. */
function requiredFit(
  availableWidth: number,
  availableHeight: number,
  options: { rowCount?: number; userZoom?: number } = {},
) {
  const result = computeFit({
    availableWidth,
    availableHeight,
    rowCount: options.rowCount ?? 14,
    headerHeight: 36,
    footerHeight: 0,
    weekdayCount: WEEKDAYS,
    weekendCount: WEEKENDS,
    userZoom: options.userZoom ?? 1,
  });
  if (!result) throw new Error("expected fit geometry");
  return result;
}

/** Returns one profile by id, failing when the profile table is incomplete. */
function profile(id: "comfortable" | "compact" | "dense") {
  const found = FIT_PROFILES.find((entry) => entry.id === id);
  if (!found) throw new Error(`missing ${id} profile`);
  return found;
}

describe("RD-13-AC-01/02: two-dimensional fit", () => {
  it("fits the 14-month view at 1280 x 800 with one 24 px lane", () => {
    const result = requiredFit(1280, 800);
    expect(result.profile.id).toBe("comfortable");
    expect(result.lanes).toBe(1);
    expect(result.zoomY).toBe(1);
    expect(result.rowHeight).toBeCloseTo((800 - 36 - 1) / 14, 3);
    expect(result.zoomX).toBeCloseTo(
      1280 / naturalGridWidth(profile("comfortable"), WEEKDAYS, WEEKENDS),
      3,
    );
    expect(result.rowHeight).toBeGreaterThanOrEqual(18 + 24);
  });

  it("selects the dense profile for 1024 x 768 without going below 24 px", () => {
    const result = requiredFit(1024, 768, { rowCount: 12 });
    expect(result.profile.id).toBe("dense");
    expect(result.lanes).toBe(1);
    const width = naturalGridWidth(result.profile, WEEKDAYS, WEEKENDS);
    expect(width * result.zoomX).toBeLessThanOrEqual(1024 + 0.001);
    expect(result.profile.weekday * result.zoomX).toBeGreaterThanOrEqual(FIT_MIN_TARGET - 0.001);
    expect(result.profile.weekend * result.zoomX).toBeGreaterThanOrEqual(FIT_MIN_TARGET - 0.001);
  });

  it("keeps the column floor and lets the viewport scroll when nothing fits", () => {
    const result = requiredFit(400, 600, { rowCount: 14 });
    expect(result.profile.id).toBe("dense");
    expect(result.zoomX).toBe(1);
    expect(naturalGridWidth(result.profile, WEEKDAYS, WEEKENDS)).toBeGreaterThan(400);
  });

  it("uses the largest lane budget that fits a tall region", () => {
    const result = requiredFit(1600, 1500);
    expect(result.profile.id).toBe("comfortable");
    expect(result.lanes).toBe(3);
    expect(result.rowHeight).toBe(90);
  });

  it("shows two compact lanes when the available row height allows them", () => {
    // 1150 px selects compact; 863 px / 12 rows leaves 71.9 px per row,
    // so 16 + 2 x 24 = 64 fits.
    const result = requiredFit(1150, 900, { rowCount: 12 });
    expect(result.profile.id).toBe("compact");
    expect(result.lanes).toBe(2);
    expect(result.rowHeight).toBe(64);
  });

  it("clamps user zoom to the 24 px column floor", () => {
    const result = requiredFit(1280, 800, { userZoom: 0.75 });
    const floor = 24 / profile("comfortable").weekend;
    expect(result.zoomX).toBeGreaterThanOrEqual(floor);
    expect(result.zoomX).toBeCloseTo(Math.max(result.fitScale * 0.75, floor), 6);
  });

  it("lets user zoom grow the columns and scroll instead of shrinking them", () => {
    const result = requiredFit(1280, 800, { userZoom: 1.5 });
    expect(result.zoomX).toBeCloseTo(result.fitScale * 1.5, 6);
    expect(result.zoomX).toBeGreaterThan(result.fitScale);
  });

  it("returns undefined for a zero-size or empty region", () => {
    expect(
      computeFit({
        availableWidth: 0,
        availableHeight: 800,
        rowCount: 14,
        headerHeight: 36,
        footerHeight: 0,
        weekdayCount: WEEKDAYS,
        weekendCount: WEEKENDS,
        userZoom: 1,
      }),
    ).toBeUndefined();
    expect(
      computeFit({
        availableWidth: 1280,
        availableHeight: 0,
        rowCount: 14,
        headerHeight: 36,
        footerHeight: 0,
        weekdayCount: WEEKDAYS,
        weekendCount: WEEKENDS,
        userZoom: 1,
      }),
    ).toBeUndefined();
    expect(
      computeFit({
        availableWidth: 1280,
        availableHeight: 800,
        rowCount: 0,
        headerHeight: 36,
        footerHeight: 0,
        weekdayCount: 0,
        weekendCount: 0,
        userZoom: 1,
      }),
    ).toBeUndefined();
  });

  it("returns undefined when no profile is configured", () => {
    expect(
      computeFit({
        availableWidth: 1280,
        availableHeight: 800,
        rowCount: 14,
        headerHeight: 36,
        footerHeight: 0,
        weekdayCount: WEEKDAYS,
        weekendCount: WEEKENDS,
        userZoom: 1,
        profiles: [],
      }),
    ).toBeUndefined();
  });

  it("reports the natural height from the actual row heights", () => {
    const heights = Array.from({ length: 14 }, () => 54.5);
    expect(naturalGridHeight(heights, 36, 0)).toBeCloseTo(36 + 14 * 54.5 + 1, 6);
  });

  it("keeps every profile at the 24 px lane height", () => {
    for (const entry of FIT_PROFILES) {
      expect(entry.laneTop + 24).toBeLessThanOrEqual(entry.rowHeight);
    }
  });
});

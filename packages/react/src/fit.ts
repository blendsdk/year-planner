/**
 * Two-dimensional fit math for the classic year planner.
 *
 * The fit is deliberately not one uniform scale. Columns scale horizontally
 * until a day column reaches the 24 px interaction floor, while vertical space
 * chooses a 24 px lane budget and a row height. Keeping the two axes separate
 * is what lets a 1280 × 800 region show every month without shrinking item
 * proxies below the accessibility floor.
 *
 * The functions here are pure: they take measured sizes and layout facts and
 * return the geometry the renderer should use. DOM measurement lives in
 * `useHostFit.ts`.
 */

/**
 * The interaction floor for a day column and an item proxy, in CSS pixels.
 */
export const FIT_MIN_TARGET = 24;

/**
 * One geometry profile used while fitting.
 *
 * `rowHeight` is a maximum: the vertical budget may reduce it, but never below
 * `laneTop + visibleLanes × laneHeight`.
 */
export interface FitProfile {
  /** Profile name used in diagnostics and tests. */
  id: "comfortable" | "compact" | "dense";
  /** Width of one month-label band in design pixels. */
  monthBand: number;
  /** Width of one weekend day column in design pixels. */
  weekend: number;
  /** Width of one weekday column in design pixels. */
  weekday: number;
  /** Preferred row height in CSS pixels. */
  rowHeight: number;
  /** Vertical offset above the first ribbon lane in CSS pixels. */
  laneTop: number;
}

/**
 * Profiles from the widest to the narrowest.
 *
 * Lane height is 24 px in every profile: the item proxy is the interaction
 * target, so it never shrinks with the grid.
 */
export const FIT_PROFILES: readonly FitProfile[] = Object.freeze([
  Object.freeze({
    id: "comfortable",
    monthBand: 70,
    weekend: 40,
    weekday: 55,
    rowHeight: 90,
    laneTop: 18,
  }),
  Object.freeze({
    id: "compact",
    monthBand: 48,
    weekend: 28,
    weekday: 34,
    rowHeight: 64,
    laneTop: 16,
  }),
  Object.freeze({
    id: "dense",
    monthBand: 36,
    weekend: 24,
    weekday: 26,
    rowHeight: 51,
    laneTop: 14,
  }),
]);

/** Inputs for one fit calculation. */
export interface FitRequest {
  /** Measured host width in CSS pixels. */
  availableWidth: number;
  /** Measured host height in CSS pixels. */
  availableHeight: number;
  /** Number of month rows in the window. */
  rowCount: number;
  /** Grid header height in CSS pixels. */
  headerHeight: number;
  /** Grid footer height in CSS pixels. */
  footerHeight: number;
  /** Number of weekday columns in one row. */
  weekdayCount: number;
  /** Number of weekend columns in one row. */
  weekendCount: number;
  /** Host zoom multiplier applied after the fit. */
  userZoom: number;
  /** Lane height in CSS pixels; defaults to 24. */
  laneHeight?: number;
  /** Profiles to try, widest first; defaults to `FIT_PROFILES`. */
  profiles?: readonly FitProfile[];
}

/** The geometry the renderer should use for one fit request. */
export interface FitGeometry {
  /** Profile that fits the available width. */
  profile: FitProfile;
  /** Horizontal scale that makes the profile fit, before user zoom. */
  fitScale: number;
  /** Composed horizontal scale: `fitScale × userZoom`, floored at 24 px. */
  zoomX: number;
  /** Vertical scale. Fit geometry works in CSS pixels, so this is always 1. */
  zoomY: 1;
  /** Chosen row height in CSS pixels. */
  rowHeight: number;
  /** Visible lane budget, 1 to 3. */
  lanes: number;
}

/** Number of lanes a profile can show at its preferred row height. */
function preferredLanes(profile: FitProfile, laneHeight: number): number {
  return Math.max(1, Math.min(3, Math.floor((profile.rowHeight - profile.laneTop) / laneHeight)));
}

/**
 * Returns the scale floor that keeps both day column kinds at 24 px.
 */
function columnFloor(profile: FitProfile): number {
  return Math.max(FIT_MIN_TARGET / profile.weekday, FIT_MIN_TARGET / profile.weekend);
}

/**
 * Returns the natural grid width of a profile in design pixels.
 */
export function naturalGridWidth(
  profile: FitProfile,
  weekdayCount: number,
  weekendCount: number,
): number {
  return profile.monthBand * 2 + weekdayCount * profile.weekday + weekendCount * profile.weekend;
}

/**
 * Returns the natural grid height from the actual rendered row heights.
 *
 * Using the ribbon heights rather than `rows × rowHeight` keeps the check
 * honest when a row needs more lanes than the preferred height allows.
 *
 * @param rowHeights - Rendered heights of every month row in CSS pixels.
 * @param headerHeight - Grid header height in CSS pixels.
 * @param footerHeight - Grid footer height in CSS pixels.
 * @returns Header, footer, all rows and the 1 px grid border.
 */
export function naturalGridHeight(
  rowHeights: readonly number[],
  headerHeight: number,
  footerHeight: number,
): number {
  return headerHeight + footerHeight + rowHeights.reduce((total, height) => total + height, 0) + 1;
}

/**
 * Computes the fit geometry for one measured host region.
 *
 * Profiles are tried from comfortable to dense. A profile is accepted when its
 * natural width, scaled down no further than the 24 px column floor, fits the
 * available width. If none fits, the dense profile is used and the viewport
 * scrolls horizontally.
 *
 * Vertically the largest lane budget in `1..3` is chosen, then the row height
 * is `min(profile.rowHeight, availableRowHeight)`, never below the chosen lane
 * budget. When even one lane does not fit, one lane is kept and the viewport
 * scrolls vertically.
 *
 * @param request - Measured size, layout facts and the user zoom.
 * @returns Fit geometry, or `undefined` for a zero-size or empty request.
 */
export function computeFit(request: FitRequest): FitGeometry | undefined {
  const {
    availableWidth,
    availableHeight,
    rowCount,
    headerHeight,
    footerHeight,
    weekdayCount,
    weekendCount,
    userZoom,
  } = request;
  if (
    !(availableWidth > 0) ||
    !(availableHeight > 0) ||
    rowCount < 1 ||
    weekdayCount + weekendCount < 1
  ) {
    return undefined;
  }
  const laneHeight =
    request.laneHeight !== undefined && request.laneHeight > 0 ? request.laneHeight : 24;
  const profiles = request.profiles ?? FIT_PROFILES;
  const fallback = profiles[profiles.length - 1];
  if (!fallback) return undefined;

  let profile = fallback;
  let fitScale = columnFloor(fallback);
  for (const candidate of profiles) {
    const naturalWidth = naturalGridWidth(candidate, weekdayCount, weekendCount);
    const floor = columnFloor(candidate);
    const scale = Math.min(1, availableWidth / naturalWidth);
    if (scale >= floor) {
      profile = candidate;
      fitScale = scale;
      break;
    }
  }

  const gridHeight = Math.max(0, availableHeight - headerHeight - footerHeight - 1);
  const availableRowHeight = gridHeight / rowCount;
  const maxLanes = preferredLanes(profile, laneHeight);
  let lanes = 1;
  for (let candidate = maxLanes; candidate >= 1; candidate -= 1) {
    if (profile.laneTop + candidate * laneHeight <= availableRowHeight) {
      lanes = candidate;
      break;
    }
  }
  const minimumRowHeight = profile.laneTop + lanes * laneHeight;
  const rowHeight = Math.max(minimumRowHeight, Math.min(profile.rowHeight, availableRowHeight));

  return {
    profile,
    fitScale,
    zoomX: Math.max(fitScale * userZoom, columnFloor(profile)),
    zoomY: 1,
    rowHeight,
    lanes,
  };
}

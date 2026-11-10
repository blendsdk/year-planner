import {
  createRibbonHitIndex,
  type DateKey,
  hitTestRibbon,
  type MonthRowLayout,
  type RibbonFragment,
  type RibbonHitEntry,
  type RibbonLayout,
  type YearLayout,
} from "@blendsdk/year-planner-core";

/** Minimum and maximum supported zoom levels. */
export const MIN_ZOOM = 0.75;
export const MAX_ZOOM = 1.5;

/** The internal vertical offset above the first ribbon lane. */
export const LANE_TOP = 18;

/** A fragment with zoom-scaled CSS geometry. */
export interface ScaledFragment {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Viewport geometry used for pointer-to-design-unit mapping. */
export interface ViewGeometry {
  zoom: number;
  monthBandWidth: number;
  scrollLeft: number;
  scrollTop: number;
  /** Bounding rect of the scroll viewport. */
  viewportRect: { left: number; top: number; width: number; height: number };
  /** Height of the sticky header grid row in CSS px. */
  headerHeight: number;
}

/** Clamps a host zoom value to the supported range. */
export function clampZoom(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/** Scales one design-unit fragment. */
export function scaleFragment(fragment: RibbonFragment, zoom: number): ScaledFragment {
  return {
    x: fragment.x * zoom,
    y: fragment.y * zoom,
    width: fragment.width * zoom,
    height: fragment.height * zoom,
  };
}

/** Returns the CSS grid template for a row at a zoom level. */
export function rowTemplate(row: MonthRowLayout, zoom: number, bandWidth: number): string {
  const widths = row.columns.map((column) => `${column.width * zoom}px`);
  return `${bandWidth * zoom}px ${widths.join(" ")} ${bandWidth * zoom}px`;
}

/** Returns the scaled CSS height of a ribbon row. */
export function scaledRowHeight(height: number, zoom: number): number {
  return height * zoom;
}

/** Returns the absolute top of a month row in design units. */
export function rowTop(ribbons: RibbonLayout, rowIndex: number): number {
  return ribbons.rows[rowIndex]?.top ?? 0;
}

function designX(clientX: number, view: ViewGeometry): number {
  return (
    (clientX - view.viewportRect.left + view.scrollLeft - view.monthBandWidth * view.zoom) /
    view.zoom
  );
}

function designY(clientY: number, view: ViewGeometry): number {
  return (clientY - view.viewportRect.top + view.scrollTop - view.headerHeight) / view.zoom;
}

/**
 * Maps a client point to the topmost ribbon hit.
 *
 * The point is converted to day-plane design units using the viewport rect,
 * scroll offsets, month band and zoom before hit-testing.
 */
export function pointToFragment(
  ribbons: RibbonLayout,
  point: { clientX: number; clientY: number },
  view: ViewGeometry,
): RibbonHitEntry | undefined {
  const x = designX(point.clientX, view);
  const y = designY(point.clientY, view);
  if (x < 0 || y < 0) return undefined;
  return hitTestRibbon(createRibbonHitIndex(ribbons), x, y);
}

/** Maps a client point to day-plane design units. */
export function pointToDesign(
  point: { clientX: number; clientY: number },
  view: ViewGeometry,
): { x: number; y: number } {
  return { x: designX(point.clientX, view), y: designY(point.clientY, view) };
}

/**
 * Maps a client point to a date key, or `undefined` over a blank slot.
 *
 * When a ribbon layout is supplied, the vertical lookup uses the rendered row
 * heights (`top`/`height`), which can grow with expanded density or lane
 * overflow. Without it, the uniform layout row height is used for compatibility.
 */
export function pointToDate(
  layout: YearLayout,
  point: { clientX: number; clientY: number },
  view: ViewGeometry,
  ribbons?: RibbonLayout,
): DateKey | undefined {
  const x = designX(point.clientX, view);
  const y = designY(point.clientY, view);
  if (x < 0 || y < 0) return undefined;
  let row: (typeof layout.rows)[number] | undefined;
  if (ribbons && ribbons.rows.length > 0) {
    const ribbonRow = ribbons.rows.find((entry) => y >= entry.top && y < entry.top + entry.height);
    row = ribbonRow ? layout.rows[ribbonRow.rowIndex] : undefined;
  } else {
    row = layout.rows[Math.floor(y / layout.rowHeight)];
  }
  if (!row) return undefined;
  const column = row.columns.find((entry) => x >= entry.x && x < entry.x + entry.width);
  return column?.date;
}

import type { DateKey } from "../date.js";
import type { PlannerItem, RenderChannel } from "../model/types.js";
import type { PlannerPeriod } from "../period.js";

/**
 * One item fragment clipped to a month row.
 * @public
 */
export interface RibbonFragment {
  /** Stable identity within one ribbon layout. */
  fragmentId: string;
  /** Canonical item identity shared by every fragment. */
  itemId: string;
  /** Month row that contains the fragment. */
  rowId: string;
  /** Zero-based row index. */
  rowIndex: number;
  /** Original item period before clipping. */
  sourcePeriod: PlannerPeriod;
  /** First visible date of the fragment. */
  clippedStart: DateKey;
  /** First date after the fragment. */
  clippedEndExclusive: DateKey;
  /** Zero-based start day column. */
  startColumn: number;
  /** Zero-based end day column, exclusive. */
  endColumnExclusive: number;
  /** Day-plane x position in design units. */
  x: number;
  /** Fragment width in design units. */
  width: number;
  /** Zero-based lane; backdrop channels use lane 0. */
  lane: number;
  /** Row-local y position in design units. */
  y: number;
  /** Fragment height in design units. */
  height: number;
  /** True when the fragment starts after the source start. */
  isStartClipped: boolean;
  /** True when the fragment ends before the source end. */
  isEndClipped: boolean;
  /** Render channel of the owning layer. */
  channel: RenderChannel;
}

/**
 * One item represented in a compact overflow list.
 * @public
 */
export interface RibbonOverflowEntry {
  /** Canonical item identity. */
  itemId: string;
  /** Item title, when present. */
  title?: string;
  /** Original item period. */
  period: PlannerPeriod;
}

/**
 * One month row with its fragments and lane metrics.
 * @public
 */
export interface RibbonRow {
  /** Month row identity. */
  rowId: string;
  /** Zero-based row index. */
  rowIndex: number;
  /** Cumulative y position of the row in design units. */
  top: number;
  /** Row height after lane growth in design units. */
  height: number;
  /** Number of ribbon lanes used by the row. */
  laneCount: number;
  /** Lanes visible in the active density. */
  visibleLaneCount: number;
  /** Number of ribbon fragments hidden by compact density. */
  overflowCount: number;
  /** Accessible overflow entries, deduplicated by item. */
  overflow: RibbonOverflowEntry[];
  /** Every fragment in the row, including non-ribbon channels. */
  fragments: RibbonFragment[];
}

/**
 * Renderer-agnostic ribbon output for a whole year layout.
 * @public
 */
export interface RibbonLayout {
  /** Month rows in layout order. */
  rows: RibbonRow[];
  /** Every fragment across all rows. */
  fragments: RibbonFragment[];
  /** Active density. */
  density: "compact" | "expanded";
  /** Compact lane limit. */
  compactMaxLanes: number;
  /** Lane height in design units. */
  laneHeight: number;
  /** Vertical offset above the first lane in design units. */
  laneTop: number;
  /** Header height copied from the year layout. */
  headerHeight: number;
  /** Footer height copied from the year layout. */
  footerHeight: number;
  /** Width of one mirrored month band. */
  monthBandWidth: number;
  /** Width of the 37 day columns. */
  totalDayWidth: number;
  /** Total canvas width, including both month bands. */
  totalWidth: number;
  /** Total body height after row growth. */
  height: number;
  /** Deterministic signature of the inputs and fragment geometry. */
  signature: string;
}

/**
 * Options for building ribbons.
 * @public
 */
export interface RibbonOptions {
  /** Compact or expanded lane visibility; defaults to compact. */
  density?: "compact" | "expanded";
  /** Maximum visible lanes in compact mode; defaults to 3. */
  compactMaxLanes?: number;
  /** Lane height in design units; defaults to 18. */
  laneHeight?: number;
  /** Vertical offset above the first lane; defaults to 18. */
  laneTop?: number;
  /** IANA zone used to project timed periods; defaults to UTC. */
  displayTimeZone?: string;
}

/**
 * Internal candidate used by the lane allocator.
 * @public
 */
export interface LaneCandidate {
  /** Fragment being placed. */
  fragment: RibbonFragment;
  /** Canonical item for lane metadata. */
  item: PlannerItem;
  /** Layer sort order. */
  sortOrder: number;
  /** Layer display priority. */
  displayPriority: number;
  /** Projected source duration in days. */
  sourceDays: number;
}

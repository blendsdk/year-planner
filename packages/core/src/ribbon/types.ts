import type { DateKey } from "../date.js";
import type { PlannerItem, RenderChannel } from "../model/types.js";
import type { PlannerPeriod } from "../period.js";

/** One item fragment clipped to a month row. */
export interface RibbonFragment {
  fragmentId: string;
  itemId: string;
  rowId: string;
  rowIndex: number;
  sourcePeriod: PlannerPeriod;
  clippedStart: DateKey;
  clippedEndExclusive: DateKey;
  startColumn: number;
  endColumnExclusive: number;
  x: number;
  width: number;
  lane: number;
  y: number;
  height: number;
  isStartClipped: boolean;
  isEndClipped: boolean;
  channel: RenderChannel;
}

/** One item represented in a compact overflow list. */
export interface RibbonOverflowEntry {
  itemId: string;
  title?: string;
  period: PlannerPeriod;
}

/** One month row with its fragments and lane metrics. */
export interface RibbonRow {
  rowId: string;
  rowIndex: number;
  top: number;
  height: number;
  laneCount: number;
  visibleLaneCount: number;
  overflowCount: number;
  overflow: RibbonOverflowEntry[];
  fragments: RibbonFragment[];
}

/** Renderer-agnostic ribbon output for a whole year layout. */
export interface RibbonLayout {
  rows: RibbonRow[];
  fragments: RibbonFragment[];
  density: "compact" | "expanded";
  compactMaxLanes: number;
  laneHeight: number;
  laneTop: number;
  headerHeight: number;
  footerHeight: number;
  monthBandWidth: number;
  totalDayWidth: number;
  totalWidth: number;
  height: number;
  signature: string;
}

/** Options for building ribbons. */
export interface RibbonOptions {
  density?: "compact" | "expanded";
  compactMaxLanes?: number;
  laneHeight?: number;
  laneTop?: number;
  displayTimeZone?: string;
}

/** Internal candidate used by the lane allocator. */
export interface LaneCandidate {
  fragment: RibbonFragment;
  item: PlannerItem;
  sortOrder: number;
  displayPriority: number;
  sourceDays: number;
}

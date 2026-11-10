import {
  addDays,
  buildClassicYearLayout,
  isoWeekOf,
  type MonthRowLayout,
  type YearLayout,
} from "@blendsdk/year-planner-core";

/** Width of one mirrored month band in design pixels. */
export const BAND_WIDTH = 70;
/** Height of one month row in design pixels. */
export const ROW_HEIGHT = 90;
/** Height of the weekday header and footer. */
export const HEADER_HEIGHT = 36;
/** Fixed number of day columns in the classic view. */
export const DAY_COLUMNS = 37;

/** One logical ribbon rendered by the spike. */
export interface SpikeItem {
  id: string;
  title: string;
  color: string;
  textColor: string;
  startDate: string;
  endDateExclusive: string;
}

/** One item fragment clipped to a month row. */
export interface SpikeFragment {
  item: SpikeItem;
  row: MonthRowLayout;
  rowIndex: number;
  startColumn: number;
  endColumnExclusive: number;
  x: number;
  width: number;
  clippedStart: string;
  clippedEndExclusive: string;
  lane: number;
  topInRow: number;
  height: number;
  isStartClipped: boolean;
  isEndClipped: boolean;
}

/** Synthetic sample data used by every renderer variant. */
export const SPIKE_ITEMS: SpikeItem[] = [
  {
    id: "hl-cross-month",
    title: "Cross-month",
    color: "#8358c6",
    textColor: "#ffffff",
    startDate: "2027-01-28",
    endDateExclusive: "2027-02-07",
  },
  {
    id: "hl-cross-year",
    title: "Cross-year",
    color: "#2f7f6f",
    textColor: "#ffffff",
    startDate: "2026-12-28",
    endDateExclusive: "2027-01-04",
  },
  {
    id: "booking-a",
    title: "Booking A",
    color: "#a63d29",
    textColor: "#ffffff",
    startDate: "2027-02-01",
    endDateExclusive: "2027-02-04",
  },
  {
    id: "booking-b",
    title: "Booking B",
    color: "#a63d29",
    textColor: "#ffffff",
    startDate: "2027-02-02",
    endDateExclusive: "2027-02-05",
  },
  {
    id: "booking-c",
    title: "Booking C",
    color: "#a63d29",
    textColor: "#ffffff",
    startDate: "2027-02-03",
    endDateExclusive: "2027-02-06",
  },
  {
    id: "one-day",
    title: "One day",
    color: "#31572c",
    textColor: "#ffffff",
    startDate: "2027-03-15",
    endDateExclusive: "2027-03-16",
  },
  {
    id: "long-ribbon",
    title: "Long range",
    color: "#1d4e89",
    textColor: "#ffffff",
    startDate: "2027-04-01",
    endDateExclusive: "2027-06-15",
  },
  {
    id: "aug-span",
    title: "August span",
    color: "#9c6644",
    textColor: "#ffffff",
    startDate: "2027-08-10",
    endDateExclusive: "2027-09-05",
  },
];

/** Builds the classic 14-month layout used by all variants. */
export function buildSpikeLayout(): YearLayout {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) {
    throw new Error(`Layout failed: ${result.diagnostics[0]?.message ?? "unknown"}`);
  }
  return result.layout;
}

/** Returns the zero-based day column for a date inside a row. */
export function columnFor(row: MonthRowLayout, date: string): number {
  const day = Number(date.slice(8, 10));
  return row.firstColumn + day - 1;
}

/** Clips every item to every month row and assigns deterministic lanes. */
export function buildFragments(layout: YearLayout): SpikeFragment[] {
  const fragments: SpikeFragment[] = [];
  layout.rows.forEach((row, rowIndex) => {
    const rowFragments: SpikeFragment[] = [];
    for (const item of SPIKE_ITEMS) {
      const start = Math.max(item.startDate, row.firstDate);
      const end = Math.min(item.endDateExclusive, row.endDateExclusive);
      if (start >= end) continue;
      const startColumn = columnFor(row, start);
      const endColumnExclusive = columnFor(row, addDays(end, -1)) + 1;
      const x = row.prefixWidths[startColumn] as number;
      const width = (row.prefixWidths[endColumnExclusive] as number) - x;
      rowFragments.push({
        item,
        row,
        rowIndex,
        startColumn,
        endColumnExclusive,
        x,
        width,
        clippedStart: start,
        clippedEndExclusive: end,
        lane: 0,
        topInRow: 24,
        height: 16,
        isStartClipped: start !== item.startDate,
        isEndClipped: end !== item.endDateExclusive,
      });
    }
    rowFragments.sort((a, b) => {
      if (a.startColumn !== b.startColumn) return a.startColumn - b.startColumn;
      if (a.width !== b.width) return b.width - a.width;
      return a.item.id.localeCompare(b.item.id);
    });
    const laneEnds: number[] = [];
    for (const fragment of rowFragments) {
      let lane = laneEnds.findIndex((end) => end <= fragment.startColumn);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(fragment.endColumnExclusive);
      } else {
        laneEnds[lane] = fragment.endColumnExclusive;
      }
      fragment.lane = lane;
      fragment.topInRow = 22 + lane * 18;
    }
    fragments.push(...rowFragments);
  });
  return fragments;
}

/** Returns the visible date cells for a row. */
export function rowDates(row: MonthRowLayout): string[] {
  return row.columns.flatMap((column) => (column.date ? [column.date] : []));
}

/** Returns a human-readable month label for either band. */
export function monthLabel(row: MonthRowLayout): string {
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const name = names[row.monthIndex] ?? "";
  return row.kind === "current" ? `${name} '${String(row.year).slice(-2)}` : `${name} ${row.year}`;
}

/** Returns the ISO week label for a date when it should be shown. */
export function weekLabel(date: string): string {
  return String(isoWeekOf(date).week);
}

/** Total design width of the grid, including both month bands. */
export function canvasWidth(layout: YearLayout): number {
  return BAND_WIDTH * 2 + layout.totalDayWidth;
}

/** Total design height of the grid, including header and footer. */
export function canvasHeight(layout: YearLayout): number {
  return HEADER_HEIGHT * 2 + layout.bodyHeight;
}

/** Returns a screen-reader label that contains the visible day number. */
export function accessibleDate(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${day} ${names[month - 1] ?? ""} ${year}, ISO week ${isoWeekOf(date).week}`;
}

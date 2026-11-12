import {
  addDays,
  contains,
  type DateKey,
  emptySelection,
  normalize,
  type PlannerItem,
  type PlannerSelection,
  type RibbonLayout,
  type SelectionDateRange,
  subtract,
} from "@blendsdk/year-planner-core";

/**
 * Keyboard or pointer modifiers relevant to selection.
 * @public
 */
export interface SelectionModifiers {
  /** Shift extends or replaces from the anchor. */
  shift: boolean;
  /** Ctrl on Windows/Linux, Cmd on macOS. */
  mod: boolean;
}

/**
 * A predicate that reports host-disabled dates.
 * @public
 */
export type DisabledDatePredicate = (date: DateKey) => boolean;

/**
 * Returns true when the event uses the platform's primary modifier.
 *
 * Ctrl and Cmd are treated identically so the same policy works on every
 * desktop platform without sniffing the user agent.
 * @public
 */
export function isMod(event: { ctrlKey?: boolean; metaKey?: boolean }): boolean {
  return event.ctrlKey === true || event.metaKey === true;
}

function oneDay(date: DateKey): SelectionDateRange {
  return { startDate: date, endDateExclusive: addDays(date, 1) };
}

function isReserved(modifiers: SelectionModifiers): boolean {
  return modifiers.shift && modifiers.mod;
}

/**
 * Sorts, drops empty ranges and merges overlapping or adjacent ranges.
 * @public
 */
export function normalizeDateRanges(ranges: readonly SelectionDateRange[]): SelectionDateRange[] {
  const valid = ranges.filter((range) => range.startDate < range.endDateExclusive);
  return normalize(valid, true);
}

/**
 * True when a date lies in any selected range.
 * @public
 */
export function isDateSelected(ranges: readonly SelectionDateRange[], date: DateKey): boolean {
  return ranges.some((range) => contains(range, date));
}

/**
 * Splits one chronological range around host-disabled dates.
 *
 * A disabled date is never selected. Contiguous enabled segments become
 * separate ranges, which keeps the canonical selection free of holes.
 * @public
 */
export function rangeBetween(
  anchor: DateKey,
  focus: DateKey,
  isDisabled?: DisabledDatePredicate,
): SelectionDateRange[] {
  const startDate = anchor <= focus ? anchor : focus;
  const endDateExclusive = addDays(anchor >= focus ? anchor : focus, 1);
  if (!isDisabled) return [{ startDate, endDateExclusive }];
  const result: SelectionDateRange[] = [];
  let segmentStart: DateKey | undefined;
  let cursor = startDate;
  while (cursor < endDateExclusive) {
    if (isDisabled(cursor)) {
      if (segmentStart) result.push({ startDate: segmentStart, endDateExclusive: cursor });
      segmentStart = undefined;
    } else if (!segmentStart) {
      segmentStart = cursor;
    }
    cursor = addDays(cursor, 1);
  }
  if (segmentStart) result.push({ startDate: segmentStart, endDateExclusive });
  return result;
}

/**
 * Adds one date to a set of ranges, merging adjacent ranges.
 * @public
 */
export function addDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
  isDisabled?: DisabledDatePredicate,
): SelectionDateRange[] {
  if (isDisabled?.(date) === true) return normalizeDateRanges(ranges);
  return normalizeDateRanges([...ranges, oneDay(date)]);
}

/**
 * Removes one date from a set of ranges, splitting the containing range.
 * @public
 */
export function removeDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
): SelectionDateRange[] {
  return normalizeDateRanges(ranges.flatMap((range) => subtract(range, oneDay(date))));
}

/**
 * Toggles one date in a set of ranges.
 * @public
 */
export function toggleDate(
  ranges: readonly SelectionDateRange[],
  date: DateKey,
  isDisabled?: DisabledDatePredicate,
): SelectionDateRange[] {
  return isDateSelected(ranges, date)
    ? removeDate(ranges, date)
    : addDate(ranges, date, isDisabled);
}

/**
 * Plain/Shift/Ctrl date click policy.
 * @public
 */
export function applyDateClick(
  selection: PlannerSelection,
  date: DateKey,
  modifiers: SelectionModifiers,
  isDisabled?: DisabledDatePredicate,
): PlannerSelection {
  if (isReserved(modifiers)) return selection;
  if (isDisabled?.(date) === true) return selection;
  if (modifiers.mod) {
    const dates = toggleDate(selection.dates, date, isDisabled);
    const anchorDate = dates.length > 0 ? (selection.anchorDate ?? date) : undefined;
    return {
      dates,
      items: selection.items,
      focusDate: date,
      ...(anchorDate ? { anchorDate } : {}),
      ...(selection.anchorItemId ? { anchorItemId: selection.anchorItemId } : {}),
      ...(selection.focusItemId ? { focusItemId: selection.focusItemId } : {}),
    };
  }
  if (modifiers.shift) {
    const anchor = selection.anchorDate ?? selection.focusDate ?? date;
    return {
      dates: rangeBetween(anchor, date, isDisabled),
      items: [],
      anchorDate: anchor,
      focusDate: date,
    };
  }
  return {
    dates: [oneDay(date)],
    items: [],
    anchorDate: date,
    focusDate: date,
  };
}

/**
 * Plain/Shift/Ctrl date drag policy; focus is the current pointer date.
 *
 * `selection` must be the gesture-start snapshot. A mod drag unions the dragged
 * range into that snapshot; `anchor` is ignored when `selection.anchorDate`
 * already exists.
 * @public
 */
export function applyDateDrag(
  selection: PlannerSelection,
  anchor: DateKey,
  focus: DateKey,
  modifiers: SelectionModifiers,
  isDisabled?: DisabledDatePredicate,
): PlannerSelection {
  if (isReserved(modifiers)) return selection;
  const dragged = rangeBetween(anchor, focus, isDisabled);
  if (modifiers.mod) {
    const dates = normalizeDateRanges([...selection.dates, ...dragged]);
    const anchorDate = dates.length > 0 ? (selection.anchorDate ?? anchor) : undefined;
    return {
      dates,
      items: selection.items,
      focusDate: focus,
      ...(anchorDate ? { anchorDate } : {}),
      ...(selection.anchorItemId ? { anchorItemId: selection.anchorItemId } : {}),
      ...(selection.focusItemId ? { focusItemId: selection.focusItemId } : {}),
    };
  }
  if (modifiers.shift) {
    const effectiveAnchor = selection.anchorDate ?? anchor;
    return {
      dates: rangeBetween(effectiveAnchor, focus, isDisabled),
      items: [],
      anchorDate: effectiveAnchor,
      focusDate: focus,
    };
  }
  return {
    dates: dragged,
    items: [],
    anchorDate: anchor,
    focusDate: focus,
  };
}

function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * Plain/Shift/Ctrl item click policy.
 * @public
 */
export function applyItemClick(
  selection: PlannerSelection,
  itemId: string,
  modifiers: SelectionModifiers,
  visualOrder: readonly string[],
): PlannerSelection {
  if (isReserved(modifiers)) return selection;
  if (!visualOrder.includes(itemId)) return selection;
  if (modifiers.mod) {
    const items = toggleInList(selection.items, itemId);
    const anchorItemId = items.length > 0 ? (selection.anchorItemId ?? itemId) : undefined;
    return {
      dates: selection.dates,
      items,
      focusItemId: itemId,
      ...(anchorItemId ? { anchorItemId } : {}),
      ...(selection.anchorDate ? { anchorDate: selection.anchorDate } : {}),
      ...(selection.focusDate ? { focusDate: selection.focusDate } : {}),
    };
  }
  if (modifiers.shift) {
    const anchor = selection.anchorItemId ?? itemId;
    const start = visualOrder.indexOf(anchor);
    const end = visualOrder.indexOf(itemId);
    if (start === -1 || end === -1) {
      return {
        dates: [],
        items: [itemId],
        anchorItemId: itemId,
        focusItemId: itemId,
      };
    }
    const [from, to] = start <= end ? [start, end] : [end, start];
    return {
      dates: [],
      items: visualOrder.slice(from, to + 1),
      anchorItemId: anchor,
      focusItemId: itemId,
    };
  }
  return {
    dates: [],
    items: [itemId],
    anchorItemId: itemId,
    focusItemId: itemId,
  };
}

function visibleIntersection(
  intersecting: readonly string[],
  visualOrder: readonly string[],
): string[] {
  const selected = new Set(intersecting);
  return visualOrder.filter((itemId) => selected.has(itemId));
}

/**
 * Plain/Shift/Ctrl marquee item policy.
 * @public
 */
export function applyItemMarquee(
  selection: PlannerSelection,
  intersecting: readonly string[],
  modifiers: SelectionModifiers,
  visualOrder: readonly string[],
): PlannerSelection {
  if (isReserved(modifiers)) return selection;
  const ordered = visibleIntersection(intersecting, visualOrder);
  const focusItemId = ordered.at(-1);
  if (modifiers.mod) {
    let items = [...selection.items];
    for (const itemId of ordered) items = toggleInList(items, itemId);
    return {
      dates: selection.dates,
      items: visualOrder.filter((itemId) => items.includes(itemId)),
      ...(focusItemId ? { focusItemId } : {}),
      ...(selection.anchorDate ? { anchorDate: selection.anchorDate } : {}),
      ...(selection.focusDate ? { focusDate: selection.focusDate } : {}),
    };
  }
  const items = modifiers.shift
    ? visualOrder.filter((itemId) => selection.items.includes(itemId) || ordered.includes(itemId))
    : ordered;
  return {
    dates: [],
    items,
    ...(focusItemId ? { focusItemId } : {}),
  };
}

/**
 * Selects every visible item in visual order and clears dates.
 * @public
 */
export function selectAllVisible(
  _selection: PlannerSelection,
  visualOrder: readonly string[],
): PlannerSelection {
  const focusItemId = visualOrder.at(-1);
  return {
    dates: [],
    items: [...visualOrder],
    ...(focusItemId ? { focusItemId } : {}),
  };
}

/**
 * Clears dates, items, anchors and focus.
 * @public
 */
export function clearSelection(): PlannerSelection {
  return emptySelection();
}

/**
 * Sorts visible item IDs by start date, first row, first lane and ID.
 *
 * Items without a visible fragment are excluded because they cannot be
 * selected or hit by the pointer.
 * @public
 */
export function visualItemOrder(
  items: readonly PlannerItem[],
  ribbons: RibbonLayout,
  visible: ReadonlySet<string>,
): string[] {
  const firstFragment = new Map<string, { rowIndex: number; lane: number }>();
  for (const fragment of ribbons.fragments) {
    if (!visible.has(fragment.itemId)) continue;
    const current = firstFragment.get(fragment.itemId);
    if (
      !current ||
      fragment.rowIndex < current.rowIndex ||
      (fragment.rowIndex === current.rowIndex && fragment.lane < current.lane)
    ) {
      firstFragment.set(fragment.itemId, {
        rowIndex: fragment.rowIndex,
        lane: fragment.lane,
      });
    }
  }
  const startOf = (item: PlannerItem): string =>
    item.period.kind === "all-day" ? item.period.startDate : item.period.start;
  return items
    .flatMap((item) => {
      const position = firstFragment.get(item.id);
      return visible.has(item.id) && position
        ? [{ id: item.id, start: startOf(item), ...position }]
        : [];
    })
    .sort((left, right) => {
      const start = left.start.localeCompare(right.start);
      if (start !== 0) return start;
      if (left.rowIndex !== right.rowIndex) return left.rowIndex - right.rowIndex;
      if (left.lane !== right.lane) return left.lane - right.lane;
      return left.id.localeCompare(right.id);
    })
    .map((entry) => entry.id);
}

import {
  addDays,
  type DateKey,
  diffDays,
  type InteractionMode,
  isAllDayPeriod,
  type PlannerItem,
  type PlannerPeriod,
  type RibbonLayout,
  type SelectionDateRange,
} from "@blendsdk/year-planner-core";
import type { ViewGeometry } from "../geometry.js";
import { rangeBetween, type SelectionModifiers } from "./selection.js";

/** A pointer position in client coordinates. */
export interface GesturePoint {
  clientX: number;
  clientY: number;
}

/** A point in day-plane design units. */
export interface DesignPoint {
  x: number;
  y: number;
}

/** A rectangle in day-plane design units. */
export interface DesignRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Classified pointer-down target. */
export type GestureTarget =
  | { kind: "cell"; date: DateKey }
  | {
      kind: "item";
      itemId: string;
      fragmentId: string;
      date: DateKey;
      annotation: boolean;
    }
  | {
      kind: "resize";
      itemId: string;
      fragmentId: string;
      edge: "start" | "end";
      date: DateKey;
    }
  | { kind: "host-control" }
  | { kind: "none" };

/** Pure context supplied by the view. */
export interface GestureContext {
  /** Active interaction mode. */
  mode: InteractionMode;
  /** Default empty-cell drag interpretation. */
  marquee: "items" | "dates";
  /** Distance in CSS pixels that turns a press into a drag. */
  threshold: number;
  /** Visible and hidden items by ID. */
  items: ReadonlyMap<string, PlannerItem>;
  /** True only for a known date whose host metadata says disabled. */
  isDisabled: (date: DateKey) => boolean;
  /** Precomputed editability for move/resize. */
  isEditable: (itemId: string, action: "move" | "resize") => boolean;
}

/** Active gesture kinds. */
export type ActiveGesture =
  | { kind: "select-dates"; anchorDate: DateKey; focusDate: DateKey }
  | { kind: "marquee"; anchor: DesignPoint; current: DesignPoint }
  | {
      kind: "move";
      itemId: string;
      grabOffsetDays: number;
      pointerDate: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "resize";
      itemId: string;
      edge: "start" | "end";
      pointerDate: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "paint";
      operation: "union" | "subtract";
      anchorDate: DateKey;
      focusDate: DateKey;
    }
  | { kind: "create"; anchorDate: DateKey; focusDate: DateKey }
  | {
      kind: "blocked";
      code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED";
      message: string;
      fallbackDate: DateKey;
    };

/** Finite-state machine state. */
export type GestureState =
  | { phase: "idle" }
  | {
      phase: "pending";
      target: GestureTarget;
      start: GesturePoint;
      startDesign: DesignPoint;
      pointerId: number;
      modifiers: SelectionModifiers;
      anchorDate: DateKey;
      lastDate: DateKey;
    }
  | {
      phase: "active";
      gesture: ActiveGesture;
      start: GesturePoint;
      startDesign: DesignPoint;
      pointerId: number;
      modifiers: SelectionModifiers;
      lastDate: DateKey;
    };

/** The committed result of a completed gesture. */
export type GestureCompletion =
  | { kind: "none" }
  | { kind: "click"; target: GestureTarget; modifiers: SelectionModifiers }
  | {
      kind: "select";
      anchor: DateKey;
      focus: DateKey;
      modifiers: SelectionModifiers;
    }
  | { kind: "marquee"; rect: DesignRect; modifiers: SelectionModifiers }
  | {
      kind: "move";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      fallbackDate: DateKey;
    }
  | {
      kind: "resize";
      itemId: string;
      proposedPeriod: PlannerPeriod;
      fallbackDate: DateKey;
    }
  | {
      kind: "paint";
      operation: "union" | "subtract";
      startDate: DateKey;
      endDateExclusive: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "create";
      startDate: DateKey;
      endDateExclusive: DateKey;
      fallbackDate: DateKey;
    }
  | {
      kind: "invalid";
      code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED";
      message: string;
      fallbackDate: DateKey;
      detail?: {
        itemId?: string;
        variant?: "move" | "resize" | "paint" | "erase" | "create";
        proposedPeriod?: PlannerPeriod;
        proposedRange?: SelectionDateRange;
      };
    };

/** Returns true when a pointer moved at least the threshold distance. */
export function exceedsThreshold(
  start: GesturePoint,
  current: GesturePoint,
  threshold: number,
): boolean {
  const dx = current.clientX - start.clientX;
  const dy = current.clientY - start.clientY;
  return Math.hypot(dx, dy) >= threshold;
}

/** Builds a normalized rectangle from two design points. */
export function designRectBetween(start: DesignPoint, end: DesignPoint): DesignRect {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/** Converts a design rectangle to fixed screen coordinates. */
export function designRectToScreen(
  rect: DesignRect,
  view: ViewGeometry,
): { left: number; top: number; width: number; height: number } {
  return {
    left: view.viewportRect.left - view.scrollLeft + (rect.left + view.monthBandWidth) * view.zoom,
    top: view.viewportRect.top - view.scrollTop + view.headerHeight + rect.top * view.zoom,
    width: rect.width * view.zoom,
    height: rect.height * view.zoom,
  };
}

function axisDelta(
  position: number,
  min: number,
  max: number,
  edge: number,
  maxStep: number,
): number {
  if (position < min + edge) {
    return -maxStep * (1 - (position - min) / edge);
  }
  if (position > max - edge) {
    return maxStep * (1 - (max - position) / edge);
  }
  return 0;
}

/**
 * Returns the scroll delta for a pointer near a viewport edge.
 *
 * The result is proportional to how deep the pointer is in the 32 px edge
 * zone and never exceeds 12 px per axis per frame.
 */
export function autoScrollDelta(input: {
  point: GesturePoint;
  viewportRect: { left: number; top: number; width: number; height: number };
  edge?: number;
  maxStep?: number;
}): { x: number; y: number } {
  const edge = input.edge ?? 32;
  const maxStep = input.maxStep ?? 12;
  const { left, top, width, height } = input.viewportRect;
  const clamp = (value: number) => Math.max(-maxStep, Math.min(maxStep, value));
  return {
    x: clamp(axisDelta(input.point.clientX, left, left + width, edge, maxStep)),
    y: clamp(axisDelta(input.point.clientY, top, top + height, edge, maxStep)),
  };
}

function rangeHasDisabled(
  startDate: DateKey,
  endDateExclusive: DateKey,
  isDisabled: (date: DateKey) => boolean,
): boolean {
  if (startDate >= endDateExclusive) return false;
  const ranges = rangeBetween(startDate, addDays(endDateExclusive, -1), isDisabled);
  return (
    ranges.length !== 1 ||
    ranges[0]?.startDate !== startDate ||
    ranges[0]?.endDateExclusive !== endDateExclusive
  );
}

function invalid(
  code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED",
  message: string,
  fallbackDate: DateKey,
  detail?: Extract<GestureCompletion, { kind: "invalid" }>["detail"],
): GestureCompletion {
  return { kind: "invalid", code, message, fallbackDate, ...(detail ? { detail } : {}) };
}

function blocked(
  code: "INVALID_COMMAND" | "TIMED_EDITING_UNSUPPORTED",
  message: string,
  fallbackDate: DateKey,
): ActiveGesture {
  return { kind: "blocked", code, message, fallbackDate };
}

function activate(
  state: Extract<GestureState, { phase: "pending" }>,
  context: GestureContext,
): ActiveGesture | undefined {
  const target = state.target;
  const mode = context.mode;
  if (target.kind === "none" || target.kind === "host-control") return undefined;

  // Mode × target matrix: paint/erase/create always act as range gestures,
  // auto/move move a body, auto/resize resize a handle, select/inspect click.
  const rangeGesture = (): ActiveGesture => {
    if (mode === "paint") {
      return {
        kind: "paint",
        operation: "union",
        anchorDate: target.date,
        focusDate: target.date,
      };
    }
    if (mode === "erase") {
      return {
        kind: "paint",
        operation: "subtract",
        anchorDate: target.date,
        focusDate: target.date,
      };
    }
    if (mode === "create") {
      return { kind: "create", anchorDate: target.date, focusDate: target.date };
    }
    return {
      kind: "select-dates",
      anchorDate: target.date,
      focusDate: target.date,
    };
  };

  if (target.kind === "resize") {
    if (mode === "paint" || mode === "erase" || mode === "create") {
      return rangeGesture();
    }
    if ((mode === "auto" || mode === "resize") && context.isEditable(target.itemId, "resize")) {
      const source = context.items.get(target.itemId);
      return {
        kind: "resize",
        itemId: target.itemId,
        edge: target.edge,
        pointerDate: target.date,
        fallbackDate:
          source && isAllDayPeriod(source.period) ? source.period.startDate : target.date,
      };
    }
    return undefined;
  }

  if (target.kind === "cell") {
    if (mode === "auto" && context.marquee === "items") {
      return { kind: "marquee", anchor: state.startDesign, current: state.startDesign };
    }
    return rangeGesture();
  }

  if (target.annotation) return undefined;
  if (mode === "paint" || mode === "erase" || mode === "create") {
    return rangeGesture();
  }
  if (mode === "select" || mode === "inspect") {
    return rangeGesture();
  }
  if (mode !== "auto" && mode !== "move") return undefined;
  if (!context.isEditable(target.itemId, "move")) return undefined;
  const source = context.items.get(target.itemId);
  if (!source) return undefined;
  if (!isAllDayPeriod(source.period)) {
    return blocked(
      "TIMED_EDITING_UNSUPPORTED",
      "Timed editing is not supported",
      source.period.start.slice(0, 10),
    );
  }
  return {
    kind: "move",
    itemId: target.itemId,
    grabOffsetDays: diffDays(source.period.startDate, target.date),
    pointerDate: target.date,
    fallbackDate: source.period.startDate,
  };
}

/** Starts a pending gesture, or returns idle for an ignored target. */
export function beginGesture(input: {
  target: GestureTarget;
  point: GesturePoint;
  design: DesignPoint;
  pointerId: number;
  modifiers: SelectionModifiers;
  date: DateKey;
  context: GestureContext;
}): GestureState {
  if (input.target.kind === "none" || input.target.kind === "host-control") {
    return { phase: "idle" };
  }
  return {
    phase: "pending",
    target: input.target,
    start: input.point,
    startDesign: input.design,
    pointerId: input.pointerId,
    modifiers: input.modifiers,
    anchorDate: input.date,
    lastDate: input.date,
  };
}

/** Advances a pending gesture into active after the threshold, or updates it. */
export function moveGesture(input: {
  state: GestureState;
  point: GesturePoint;
  design: DesignPoint;
  date: DateKey | undefined;
  context: GestureContext;
}): GestureState {
  const { state } = input;
  if (state.phase === "idle") return state;
  const lastDate = input.date ?? state.lastDate;
  if (state.phase === "pending") {
    if (!exceedsThreshold(state.start, input.point, input.context.threshold)) {
      return { ...state, lastDate };
    }
    const gesture = activate({ ...state, lastDate }, input.context);
    if (!gesture) return { phase: "idle" };
    return {
      phase: "active",
      gesture: updateActiveGesture(gesture, input.date, input.design, lastDate),
      start: state.start,
      startDesign: state.startDesign,
      pointerId: state.pointerId,
      modifiers: state.modifiers,
      lastDate,
    };
  }
  return {
    ...state,
    lastDate,
    gesture: updateActiveGesture(state.gesture, input.date, input.design, lastDate),
  };
}

function updateActiveGesture(
  gesture: ActiveGesture,
  date: DateKey | undefined,
  design: DesignPoint,
  lastDate: DateKey,
): ActiveGesture {
  switch (gesture.kind) {
    case "select-dates":
      return { ...gesture, focusDate: date ?? lastDate };
    case "marquee":
      return { ...gesture, current: design };
    case "move":
      return { ...gesture, pointerDate: date ?? lastDate };
    case "resize":
      return { ...gesture, pointerDate: date ?? lastDate };
    case "paint":
    case "create":
      return { ...gesture, focusDate: date ?? lastDate };
    default:
      return gesture;
  }
}

function buildRange(
  kind: "paint" | "create",
  operation: "union" | "subtract" | undefined,
  anchor: DateKey,
  focus: DateKey,
  context: GestureContext,
): GestureCompletion {
  const startDate = anchor <= focus ? anchor : focus;
  const endDateExclusive = addDays(anchor >= focus ? anchor : focus, 1);
  const fallbackDate = anchor;
  if (rangeHasDisabled(startDate, endDateExclusive, context.isDisabled)) {
    return invalid("INVALID_COMMAND", "The range contains a disabled date", fallbackDate, {
      variant: kind === "paint" ? (operation === "subtract" ? "erase" : "paint") : "create",
      proposedRange: { startDate, endDateExclusive },
    });
  }
  if (kind === "paint") {
    return {
      kind: "paint",
      operation: operation ?? "union",
      startDate,
      endDateExclusive,
      fallbackDate,
    };
  }
  return { kind: "create", startDate, endDateExclusive, fallbackDate };
}

function finishMove(
  gesture: Extract<ActiveGesture, { kind: "move" }>,
  context: GestureContext,
): GestureCompletion {
  const source = context.items.get(gesture.itemId);
  if (!source) return invalid("INVALID_COMMAND", "The item no longer exists", gesture.pointerDate);
  if (!isAllDayPeriod(source.period)) {
    return invalid(
      "TIMED_EDITING_UNSUPPORTED",
      "Timed editing is not supported",
      source.period.start.slice(0, 10),
    );
  }
  const duration = diffDays(source.period.startDate, source.period.endDateExclusive);
  const startDate = addDays(gesture.pointerDate, -gesture.grabOffsetDays);
  const endDateExclusive = addDays(startDate, duration);
  if (rangeHasDisabled(startDate, endDateExclusive, context.isDisabled)) {
    return invalid(
      "INVALID_COMMAND",
      "The range contains a disabled date",
      source.period.startDate,
      {
        itemId: gesture.itemId,
        variant: "move",
        proposedPeriod: { kind: "all-day", startDate, endDateExclusive },
      },
    );
  }
  return {
    kind: "move",
    itemId: gesture.itemId,
    proposedPeriod: { kind: "all-day", startDate, endDateExclusive },
    fallbackDate: source.period.startDate,
  };
}

function finishResize(
  gesture: Extract<ActiveGesture, { kind: "resize" }>,
  context: GestureContext,
): GestureCompletion {
  const source = context.items.get(gesture.itemId);
  if (!source) return invalid("INVALID_COMMAND", "The item no longer exists", gesture.pointerDate);
  if (!isAllDayPeriod(source.period)) {
    return invalid(
      "TIMED_EDITING_UNSUPPORTED",
      "Timed editing is not supported",
      source.period.start.slice(0, 10),
    );
  }
  const startDate = gesture.edge === "start" ? gesture.pointerDate : source.period.startDate;
  const endDateExclusive =
    gesture.edge === "end" ? addDays(gesture.pointerDate, 1) : source.period.endDateExclusive;
  if (startDate >= endDateExclusive) {
    return invalid(
      "INVALID_COMMAND",
      "A resize must contain at least one day",
      source.period.startDate,
    );
  }
  if (rangeHasDisabled(startDate, endDateExclusive, context.isDisabled)) {
    return invalid(
      "INVALID_COMMAND",
      "The range contains a disabled date",
      source.period.startDate,
      {
        itemId: gesture.itemId,
        variant: "resize",
        proposedPeriod: { kind: "all-day", startDate, endDateExclusive },
      },
    );
  }
  return {
    kind: "resize",
    itemId: gesture.itemId,
    proposedPeriod: { kind: "all-day", startDate, endDateExclusive },
    fallbackDate: source.period.startDate,
  };
}

/** Produces the commit intent; never mutates canonical items. */
export function endGesture(input: {
  state: GestureState;
  design: DesignPoint;
  date: DateKey | undefined;
  context: GestureContext;
}): GestureCompletion {
  const { state } = input;
  if (state.phase === "idle") return { kind: "none" };
  if (state.phase === "pending") {
    if (state.target.kind === "none" || state.target.kind === "host-control") {
      return { kind: "none" };
    }
    const target: GestureTarget =
      state.target.kind === "resize"
        ? {
            kind: "item",
            itemId: state.target.itemId,
            fragmentId: state.target.fragmentId,
            date: state.target.date,
            annotation: false,
          }
        : state.target;
    return { kind: "click", target, modifiers: state.modifiers };
  }
  const gesture = state.gesture;
  switch (gesture.kind) {
    case "select-dates":
      return {
        kind: "select",
        anchor: gesture.anchorDate,
        focus: gesture.focusDate,
        modifiers: state.modifiers,
      };
    case "marquee":
      return {
        kind: "marquee",
        rect: designRectBetween(gesture.anchor, input.design),
        modifiers: state.modifiers,
      };
    case "move":
      return finishMove(gesture, input.context);
    case "resize":
      return finishResize(gesture, input.context);
    case "paint":
      return buildRange(
        "paint",
        gesture.operation,
        gesture.anchorDate,
        gesture.focusDate,
        input.context,
      );
    case "create":
      return buildRange("create", undefined, gesture.anchorDate, gesture.focusDate, input.context);
    case "blocked":
      return invalid(gesture.code, gesture.message, gesture.fallbackDate);
    default:
      return { kind: "none" };
  }
}

/** Cancels any gesture and reports the focus to restore. */
export function cancelGesture(state: GestureState): {
  state: GestureState;
  restore?: { itemId?: string; date?: DateKey };
} {
  if (state.phase === "idle") return { state: { phase: "idle" } };
  if (state.phase === "pending") {
    if (state.target.kind === "item" || state.target.kind === "resize") {
      return {
        state: { phase: "idle" },
        restore: { itemId: state.target.itemId, date: state.anchorDate },
      };
    }
    return { state: { phase: "idle" }, restore: { date: state.anchorDate } };
  }
  if (state.gesture.kind === "move" || state.gesture.kind === "resize") {
    return {
      state: { phase: "idle" },
      restore: { itemId: state.gesture.itemId, date: state.gesture.fallbackDate },
    };
  }
  return { state: { phase: "idle" }, restore: { date: state.lastDate } };
}

/** Returns true when the gesture context changed enough to cancel. */
export function gestureContextChanged(
  previous: { signature: string; mode: InteractionMode },
  next: { signature: string; mode: InteractionMode },
): boolean {
  return previous.signature !== next.signature || previous.mode !== next.mode;
}

/** Returns visible item IDs whose fragments intersect the design rectangle. */
export function intersectMarquee(
  ribbons: RibbonLayout,
  rect: DesignRect,
  options: {
    visible: ReadonlySet<string>;
    showAnnotations: boolean;
    visibleLaneCount: (rowId: string) => number;
  },
): string[] {
  const hits = new Set<string>();
  for (const fragment of ribbons.fragments) {
    if (!options.visible.has(fragment.itemId)) continue;
    if (fragment.channel === "background" || fragment.channel === "highlight") continue;
    if (fragment.channel === "annotation" && !options.showAnnotations) continue;
    if (
      fragment.channel === "ribbon" &&
      fragment.lane >= options.visibleLaneCount(fragment.rowId)
    ) {
      continue;
    }
    const rowTop = ribbons.rows.find((row) => row.rowId === fragment.rowId)?.top ?? 0;
    const absoluteY = rowTop + fragment.y;
    const intersects =
      fragment.x < rect.left + rect.width &&
      rect.left < fragment.x + fragment.width &&
      absoluteY < rect.top + rect.height &&
      rect.top < absoluteY + fragment.height;
    if (intersects) hits.add(fragment.itemId);
  }
  return [...hits];
}

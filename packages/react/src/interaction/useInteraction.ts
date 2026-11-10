import type { RibbonLayout, YearLayout } from "@blendsdk/year-planner-core";
import {
  addDays,
  type DateKey,
  diagnostic,
  getEffectiveVisibility,
  getItemEditability,
  type PlannerSelection,
} from "@blendsdk/year-planner-core";
import type { KeyboardEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CommandPipeline, createPlannerId } from "../commands.js";
import { pointToDate, pointToDesign, type ViewGeometry } from "../geometry.js";
import type { PlannerState } from "../state.js";
import type { DateMeta, DateMetaContext, InteractionConfig } from "../types.js";
import { buildCreateItem, buildPaintCommand, defaultPaintDefaults } from "./builders.js";
import {
  autoScrollDelta,
  beginGesture,
  cancelGesture,
  type DesignPoint,
  endGesture,
  type GestureCompletion,
  type GestureContext,
  type GesturePoint,
  type GestureState,
  gestureContextChanged,
  intersectMarquee,
  moveGesture,
} from "./gesture.js";
import { classifyTarget, isHostInteractive } from "./pointer.js";
import { type GesturePreview, previewFromCompletion } from "./preview.js";
import {
  applyDateClick,
  applyDateDrag,
  applyItemClick,
  applyItemMarquee,
  clearSelection,
  isMod,
  selectAllVisible,
  visualItemOrder,
} from "./selection.js";

/** Inputs consumed by the interaction controller. */
export interface UseInteractionInput {
  state: PlannerState;
  layout: YearLayout;
  ribbons: RibbonLayout;
  pipeline: CommandPipeline;
  viewportRef: { current: HTMLDivElement | null };
  zoom: number;
  readOnly: boolean;
  activeLayerId?: string | undefined;
  interaction?: InteractionConfig | undefined;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  showAnnotations: boolean;
  onFocusItem: (itemId: string) => void;
  onFocusDate: (date: DateKey) => void;
  openInspector: () => void;
  onDiagnostic?: ((entry: ReturnType<typeof diagnostic>) => void) | undefined;
}

/** DOM and state handlers exposed by the interaction controller. */
export interface InteractionController {
  preview: GesturePreview | undefined;
  touchAction: "none" | "pan-x pan-y";
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onGridKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onCellKeyDown: (date: DateKey, event: KeyboardEvent<HTMLElement>) => void;
  onItemKeyDown: (itemId: string, event: KeyboardEvent<HTMLElement>) => void;
  selectDate: (
    date: DateKey,
    event: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: EventTarget | null;
    },
  ) => void;
  selectItem: (
    itemId: string,
    event: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: EventTarget | null;
    },
  ) => void;
  doubleClickItem: (itemId: string) => void;
  shouldIgnoreClick: (event: { target?: EventTarget | null }) => boolean;
}

function knownDates(layout: UseInteractionInput["layout"]): Set<DateKey> {
  const dates = new Set<DateKey>();
  for (const row of layout.rows) {
    for (const column of row.columns) {
      if (column.date) dates.add(column.date);
    }
  }
  return dates;
}

/**
 * Owns pointer, keyboard and touch interaction for the year grid.
 *
 * The pure selection and gesture modules do the policy work; this hook supplies
 * DOM geometry, one-shot click suppression, command emission and focus.
 */
export function useInteraction(input: UseInteractionInput): InteractionController {
  const [gesture, setGesture] = useState<GestureState>({ phase: "idle" });
  const gestureRef = useRef<GestureState>({ phase: "idle" });
  const selectionAtStart = useRef<PlannerSelection>(input.state.selection);
  const lastPoint = useRef<GesturePoint>({ clientX: 0, clientY: 0 });
  const lastDesign = useRef<DesignPoint>({ x: 0, y: 0 });
  const suppressClick = useRef(false);
  const frame = useRef<number | undefined>(undefined);
  const dates = useMemo(() => knownDates(input.layout), [input.layout]);

  const updateGesture = useCallback((next: GestureState) => {
    gestureRef.current = next;
    setGesture(next);
  }, []);

  const readView = useCallback((): ViewGeometry | undefined => {
    const viewport = input.viewportRef.current;
    if (!viewport) return undefined;
    const rect = viewport.getBoundingClientRect();
    return {
      zoom: input.zoom,
      monthBandWidth: input.layout.monthBandWidth,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      viewportRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      headerHeight: input.layout.headerHeight,
    };
  }, [input.layout, input.viewportRef, input.zoom]);

  const isDisabled = useCallback(
    (date: DateKey): boolean => {
      if (!dates.has(date)) return false;
      const row = input.layout.rows.find(
        (entry) => date >= entry.firstDate && date < entry.endDateExclusive,
      );
      const column = row?.columns.find((entry) => entry.date === date);
      if (!row || !column) return false;
      const meta = input.getDateMeta?.(date, {
        isWeekend: column.isWeekend,
        isContextMonth: column.isContextMonth,
        itemIds: input.itemsByDate.get(date) ?? [],
      });
      return meta?.disabled === true;
    },
    [dates, input.getDateMeta, input.itemsByDate, input.layout],
  );

  const isEditable = useCallback(
    (itemId: string, action: "move" | "resize"): boolean =>
      getItemEditability(itemId, action, {
        model: input.state.model,
        visibility: input.state.visibility,
        filter: input.state.filter,
        mode: input.state.interactionMode,
        ...(input.readOnly ? { readOnly: true } : {}),
        ...(input.activeLayerId ? { activeLayerId: input.activeLayerId } : {}),
      }).editable,
    [
      input.activeLayerId,
      input.readOnly,
      input.state.filter,
      input.state.interactionMode,
      input.state.model,
      input.state.visibility,
    ],
  );

  const visibleItemIds = useMemo(() => {
    const context = {
      model: input.state.model,
      visibility: input.state.visibility,
      filter: input.state.filter,
    };
    return new Set(
      input.state.items
        .filter((entry) => getEffectiveVisibility(entry.id, context).visible)
        .map((entry) => entry.id),
    );
  }, [input.state.filter, input.state.items, input.state.model, input.state.visibility]);

  const visualOrder = useMemo(
    () => visualItemOrder(input.state.items, input.ribbons, visibleItemIds),
    [input.ribbons, input.state.items, visibleItemIds],
  );

  const gestureContext: GestureContext = useMemo(
    () => ({
      mode: input.state.interactionMode,
      marquee: input.interaction?.marquee ?? "items",
      threshold: 4,
      items: new Map(input.state.items.map((entry) => [entry.id, entry])),
      isDisabled,
      isEditable,
    }),
    [
      input.interaction?.marquee,
      input.state.interactionMode,
      input.state.items,
      isDisabled,
      isEditable,
    ],
  );

  const contextKey = useMemo(
    () => ({ signature: input.ribbons.signature, mode: input.state.interactionMode }),
    [input.ribbons.signature, input.state.interactionMode],
  );

  const previousContext = useRef(contextKey);
  useEffect(() => {
    if (gestureRef.current.phase === "idle") {
      previousContext.current = contextKey;
      return;
    }
    if (gestureContextChanged(previousContext.current, contextKey)) {
      const cancelled = cancelGesture(gestureRef.current);
      updateGesture(cancelled.state);
      if (cancelled.restore?.itemId) input.onFocusItem(cancelled.restore.itemId);
      else if (cancelled.restore?.date) input.onFocusDate(cancelled.restore.date);
    }
    previousContext.current = contextKey;
  }, [contextKey, input, updateGesture]);

  useEffect(
    () => () => {
      if (frame.current !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  const emitSelection = useCallback(
    (next: PlannerSelection, focusItem?: string, focusDate?: DateKey) => {
      input.state.setSelection(next);
      if (focusItem) input.onFocusItem(focusItem);
      else if (focusDate) input.onFocusDate(focusDate);
    },
    [input],
  );

  const handleCompletion = useCallback(
    (completion: GestureCompletion) => {
      switch (completion.kind) {
        case "click": {
          const target = completion.target;
          if (target.kind === "cell") {
            const next = applyDateClick(
              selectionAtStart.current,
              target.date,
              completion.modifiers,
              isDisabled,
            );
            emitSelection(next, undefined, target.date);
          } else if (target.kind === "item") {
            const next = applyItemClick(
              selectionAtStart.current,
              target.itemId,
              completion.modifiers,
              visualOrder,
            );
            emitSelection(next, target.itemId);
          }
          return;
        }
        case "select": {
          const next = applyDateDrag(
            selectionAtStart.current,
            completion.anchor,
            completion.focus,
            completion.modifiers,
            isDisabled,
          );
          emitSelection(next, undefined, completion.focus);
          return;
        }
        case "marquee": {
          const hit = intersectMarquee(input.ribbons, completion.rect, {
            visible: visibleItemIds,
            showAnnotations: input.showAnnotations,
            visibleLaneCount: (rowId) =>
              input.ribbons.rows.find((row) => row.rowId === rowId)?.visibleLaneCount ?? 0,
          });
          const next = applyItemMarquee(
            selectionAtStart.current,
            hit,
            { shift: false, mod: false },
            visualOrder,
          );
          emitSelection(next, next.focusItemId);
          return;
        }
        case "move":
        case "resize": {
          const command =
            completion.kind === "move"
              ? {
                  type: "move" as const,
                  itemId: completion.itemId,
                  proposedPeriod: completion.proposedPeriod,
                  expectedVersion:
                    input.state.items.find((entry) => entry.id === completion.itemId)?.version ?? 1,
                }
              : {
                  type: "resize" as const,
                  itemId: completion.itemId,
                  proposedPeriod: completion.proposedPeriod,
                  expectedVersion:
                    input.state.items.find((entry) => entry.id === completion.itemId)?.version ?? 1,
                };
          void input.pipeline.requestCommand(command).then((accepted) => {
            if (accepted) input.onFocusItem(completion.itemId);
            else input.onFocusDate(completion.fallbackDate);
          });
          return;
        }
        case "paint": {
          const layer = input.state.model.layers.find((entry) => entry.id === input.activeLayerId);
          if (!layer) {
            input.onDiagnostic?.(
              diagnostic("INVALID_PAINT_TARGET", "Paint requires an active highlight layer"),
            );
            input.onFocusDate(completion.fallbackDate);
            return;
          }
          const command = buildPaintCommand({
            model: input.state.model,
            visibility: input.state.visibility,
            filter: input.state.filter,
            layerId: input.activeLayerId as string,
            startDate: completion.startDate,
            endDateExclusive: completion.endDateExclusive,
            operation: completion.operation,
            defaults: defaultPaintDefaults(input.interaction),
          });
          if (!command) {
            input.onDiagnostic?.(
              diagnostic("INVALID_PAINT_TARGET", "Paint requires an active highlight layer"),
            );
            input.onFocusDate(completion.fallbackDate);
            return;
          }
          void input.pipeline.requestCommand(command).then((accepted) => {
            if (!accepted) input.onFocusDate(completion.fallbackDate);
          });
          return;
        }
        case "create": {
          const created = buildCreateItem({
            interaction: input.interaction,
            activeLayerId: input.activeLayerId,
            startDate: completion.startDate,
            endDateExclusive: completion.endDateExclusive,
            createId: () => createPlannerId(input.interaction),
          });
          if (!created) {
            input.onDiagnostic?.(diagnostic("INVALID_COMMAND", "Create requires a layer"));
            input.onFocusDate(completion.fallbackDate);
            return;
          }
          void input.pipeline.requestCommand({ type: "create", item: created });
          return;
        }
        case "invalid": {
          input.onDiagnostic?.(diagnostic(completion.code, completion.message));
          input.onFocusDate(completion.fallbackDate);
          return;
        }
        default:
          return;
      }
    },
    [emitSelection, input, isDisabled, visibleItemIds, visualOrder],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 && event.pointerType !== "touch") return;
      const touch = event.pointerType === "touch";
      if (touch && input.interaction?.touchEditing !== "on") return;
      const view = readView();
      if (!view) return;
      const point = { clientX: event.clientX, clientY: event.clientY };
      const design = pointToDesign(point, view);
      const date = pointToDate(input.layout, point, view, input.ribbons);
      const target = classifyTarget(event.target, date);
      if (target.kind === "none" || target.kind === "host-control") return;
      const anchorDate = date ?? (target.kind === "cell" ? target.date : undefined);
      if (!anchorDate) return;
      selectionAtStart.current = input.state.selection;
      lastPoint.current = point;
      lastDesign.current = design;
      suppressClick.current = false;
      const next = beginGesture({
        target,
        point,
        design,
        pointerId: event.pointerId ?? 0,
        modifiers: { shift: event.shiftKey, mod: isMod(event) },
        date: anchorDate,
        context: gestureContext,
      });
      if (next.phase === "idle") return;
      updateGesture(next);
      const current = event.currentTarget as Element & {
        setPointerCapture?: (pointerId: number) => void;
      };
      current.setPointerCapture?.(event.pointerId);
      if (touch) event.preventDefault();
    },
    [gestureContext, input, readView, updateGesture],
  );

  const runMove = useCallback(() => {
    frame.current = undefined;
    const current = gestureRef.current;
    if (current.phase === "idle") return;
    const view = readView();
    if (!view) return;
    const design = pointToDesign(lastPoint.current, view);
    const date = pointToDate(input.layout, lastPoint.current, view, input.ribbons);
    const next = moveGesture({
      state: current,
      point: lastPoint.current,
      design,
      date,
      context: gestureContext,
    });
    lastDesign.current = design;
    updateGesture(next);
    const delta = autoScrollDelta({
      point: lastPoint.current,
      viewportRect: view.viewportRect,
    });
    const viewport = input.viewportRef.current;
    if (viewport && (delta.x !== 0 || delta.y !== 0)) {
      viewport.scrollLeft += delta.x;
      viewport.scrollTop += delta.y;
      if (typeof requestAnimationFrame === "function") {
        frame.current = requestAnimationFrame(runMove);
      }
    }
  }, [gestureContext, input.layout, input.ribbons, input.viewportRef, readView, updateGesture]);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (gestureRef.current.phase === "idle") return;
      lastPoint.current = { clientX: event.clientX, clientY: event.clientY };
      if (typeof requestAnimationFrame !== "function") {
        runMove();
        return;
      }
      if (frame.current === undefined) frame.current = requestAnimationFrame(runMove);
    },
    [runMove],
  );

  const finishPointer = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (frame.current !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame.current);
        frame.current = undefined;
      }
      const current = gestureRef.current;
      if (current.phase === "idle") return;
      const view = readView();
      const point = { clientX: event.clientX, clientY: event.clientY };
      const design = view ? pointToDesign(point, view) : lastDesign.current;
      const date = view ? pointToDate(input.layout, point, view, input.ribbons) : undefined;
      const moved = moveGesture({
        state: current,
        point,
        design,
        date,
        context: gestureContext,
      });
      const completion = endGesture({
        state: moved,
        design,
        date,
        context: gestureContext,
      });
      updateGesture({ phase: "idle" });
      suppressClick.current = true;
      handleCompletion(completion);
    },
    [gestureContext, handleCompletion, input.layout, input.ribbons, readView, updateGesture],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const current = event.currentTarget as Element & {
        releasePointerCapture?: (pointerId: number) => void;
      };
      current.releasePointerCapture?.(event.pointerId);
      finishPointer(event);
    },
    [finishPointer],
  );

  const cancelActive = useCallback(
    (event?: PointerEvent<HTMLElement>) => {
      if (frame.current !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame.current);
        frame.current = undefined;
      }
      const cancelled = cancelGesture(gestureRef.current);
      updateGesture(cancelled.state);
      suppressClick.current = true;
      if (cancelled.restore?.itemId) input.onFocusItem(cancelled.restore.itemId);
      else if (cancelled.restore?.date) input.onFocusDate(cancelled.restore.date);
      if (event) {
        const current = event.currentTarget as Element & {
          releasePointerCapture?: (pointerId: number) => void;
        };
        current.releasePointerCapture?.(event.pointerId);
      }
    },
    [input, updateGesture],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => cancelActive(event),
    [cancelActive],
  );
  const onLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => cancelActive(event),
    [cancelActive],
  );

  const shouldIgnoreClick = useCallback((event: { target?: EventTarget | null }): boolean => {
    if (event.target && isHostInteractive(event.target)) return true;
    if (suppressClick.current) {
      suppressClick.current = false;
      return true;
    }
    return false;
  }, []);

  const selectDate = useCallback(
    (
      date: DateKey,
      event: {
        shiftKey?: boolean;
        ctrlKey?: boolean;
        metaKey?: boolean;
        target?: EventTarget | null;
      },
    ) => {
      if (shouldIgnoreClick(event)) return;
      const next = applyDateClick(
        input.state.selection,
        date,
        { shift: event.shiftKey === true, mod: isMod(event) },
        isDisabled,
      );
      emitSelection(next, undefined, date);
    },
    [emitSelection, input.state.selection, isDisabled, shouldIgnoreClick],
  );

  const selectItem = useCallback(
    (
      itemId: string,
      event: {
        shiftKey?: boolean;
        ctrlKey?: boolean;
        metaKey?: boolean;
        target?: EventTarget | null;
      },
    ) => {
      if (shouldIgnoreClick(event)) return;
      const next = applyItemClick(
        input.state.selection,
        itemId,
        { shift: event.shiftKey === true, mod: isMod(event) },
        visualOrder,
      );
      emitSelection(next, itemId);
    },
    [emitSelection, input.state.selection, shouldIgnoreClick, visualOrder],
  );

  const doubleClickItem = useCallback(
    (itemId: string) => {
      if (input.interaction?.doubleClick === "none") return;
      selectItem(itemId, {});
      input.openInspector();
    },
    [input, selectItem],
  );

  const nextKnownDate = useCallback(
    (date: DateKey, delta: number): DateKey | undefined => {
      let cursor = date;
      for (let step = 0; step < 400; step += 1) {
        cursor = addDays(cursor, delta);
        if (!dates.has(cursor)) return undefined;
        if (!isDisabled(cursor)) return cursor;
      }
      return undefined;
    },
    [dates, isDisabled],
  );

  const onCellKeyDown = useCallback(
    (date: DateKey, event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || isHostInteractive(event.target)) return;
      if (event.shiftKey && isMod(event)) {
        event.preventDefault();
        return;
      }
      const deltas: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };
      const delta = deltas[event.key];
      if (delta !== undefined) {
        const next = nextKnownDate(date, delta);
        if (!next) return;
        event.preventDefault();
        if (event.shiftKey) {
          const nextSelection = applyDateDrag(
            input.state.selection,
            input.state.selection.anchorDate ?? date,
            next,
            { shift: true, mod: false },
            isDisabled,
          );
          emitSelection(nextSelection, undefined, next);
        } else {
          input.onFocusDate(next);
        }
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        const next = applyDateClick(
          input.state.selection,
          date,
          { shift: false, mod: true },
          isDisabled,
        );
        emitSelection(next, undefined, date);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const next = applyDateClick(
          input.state.selection,
          date,
          { shift: false, mod: false },
          isDisabled,
        );
        emitSelection(next, undefined, date);
        input.openInspector();
      }
    },
    [emitSelection, input, isDisabled, nextKnownDate],
  );

  const onItemKeyDown = useCallback(
    (itemId: string, event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || isHostInteractive(event.target)) return;
      if (event.shiftKey && isMod(event)) {
        event.preventDefault();
        return;
      }
      const item = input.state.items.find((entry) => entry.id === itemId);
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        const next = applyItemClick(
          input.state.selection,
          itemId,
          { shift: false, mod: event.key === " " },
          visualOrder,
        );
        emitSelection(next, itemId);
        if (event.key === "Enter") input.openInspector();
        return;
      }
      if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        if (item?.period.kind !== "all-day") return;
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        const nextDate = nextKnownDate(item.period.startDate, delta);
        if (!nextDate) return;
        event.preventDefault();
        const next = applyDateDrag(
          input.state.selection,
          input.state.selection.anchorDate ?? item.period.startDate,
          nextDate,
          { shift: true, mod: false },
          isDisabled,
        );
        emitSelection(next, undefined, nextDate);
      }
    },
    [emitSelection, input, isDisabled, nextKnownDate, visualOrder],
  );

  const onGridKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || isHostInteractive(event.target)) return;
      if (event.shiftKey && isMod(event)) {
        event.preventDefault();
        return;
      }
      if (isMod(event) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        const next = selectAllVisible(input.state.selection, visualOrder);
        emitSelection(next, next.focusItemId);
        return;
      }
      if (event.key === "Escape") {
        if (gestureRef.current.phase !== "idle") {
          event.preventDefault();
          cancelActive();
          return;
        }
        if (input.state.selection.dates.length > 0 || input.state.selection.items.length > 0) {
          event.preventDefault();
          input.state.setSelection(clearSelection());
        }
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        const itemId =
          input.state.selection.focusItemId ??
          (input.state.selection.items.length === 1 ? input.state.selection.items[0] : undefined);
        const item = itemId ? input.state.items.find((entry) => entry.id === itemId) : undefined;
        if (!item) {
          input.onDiagnostic?.(diagnostic("INVALID_COMMAND", "Select one item to delete"));
          return;
        }
        void input.pipeline.requestCommand({
          type: "delete",
          itemId: item.id,
          expectedVersion: item.version,
        });
      }
    },
    [cancelActive, emitSelection, input, visualOrder],
  );

  const preview = useMemo(() => {
    if (gesture.phase !== "active") return undefined;
    const design =
      gesture.gesture.kind === "marquee" ? gesture.gesture.current : gesture.startDesign;
    const completion = endGesture({
      state: gesture,
      design,
      date: gesture.lastDate,
      context: gestureContext,
    });
    const layerId =
      completion.kind === "move" || completion.kind === "resize"
        ? input.state.items.find((entry) => entry.id === completion.itemId)?.layerId
        : input.activeLayerId;
    return previewFromCompletion(completion, layerId, isDisabled);
  }, [gesture, gestureContext, input.activeLayerId, input.state.items, isDisabled]);

  return {
    preview,
    touchAction: input.interaction?.touchEditing === "on" ? "none" : "pan-x pan-y",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onGridKeyDown,
    onCellKeyDown,
    onItemKeyDown,
    selectDate,
    selectItem,
    doubleClickItem,
    shouldIgnoreClick,
  };
}

export type { GesturePreview };

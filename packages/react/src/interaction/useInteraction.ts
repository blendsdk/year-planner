import {
  addDays,
  type DateKey,
  diagnostic,
  getItemEditability,
  type PlannerSelection,
} from "@blendsdk/year-planner-core";
import type { KeyboardEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pointToDate, pointToDesign, type ViewGeometry } from "../geometry.js";
import { commitGesture } from "./commit.js";
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
  moveGesture,
} from "./gesture.js";
import { classifyTarget, isHostInteractive } from "./pointer.js";
import { type PreviewLayer, previewFromCompletion, previewKey } from "./preview.js";
import { rowEdgeDate } from "./row.js";
import {
  applyDateClick,
  applyDateDrag,
  applyItemClick,
  clearSelection,
  isMod,
  selectAllVisible,
  visualItemOrder,
} from "./selection.js";
import type { InteractionController, UseInteractionInput } from "./types.js";

type PendingGesturePreview = PreviewLayer;

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
  const [pendingPreviews, setPendingPreviews] = useState<PendingGesturePreview[]>([]);
  const gestureRef = useRef<GestureState>({ phase: "idle" });
  const selectionAtStart = useRef<PlannerSelection>(input.state.selection);
  const lastPoint = useRef<GesturePoint>({ clientX: 0, clientY: 0 });
  const lastDesign = useRef<DesignPoint>({ x: 0, y: 0 });
  const suppressClick = useRef(false);
  const pendingKey = useRef(0);
  const mounted = useRef(true);
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
      zoomY: input.zoomY ?? input.zoom,
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
  }, [input.layout, input.viewportRef, input.zoom, input.zoomY]);

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

  const visibleItemIds = useMemo(
    () =>
      new Set(
        input.state.items
          .filter((entry) => input.visibilityById.get(entry.id)?.visible === true)
          .map((entry) => entry.id),
      ),
    [input.state.items, input.visibilityById],
  );

  const inputRef = useRef(input);
  inputRef.current = input;
  const stateRef = useRef(input.state);
  stateRef.current = input.state;
  const visibleRef = useRef(visibleItemIds);
  visibleRef.current = visibleItemIds;
  const isItemVisibleNow = useCallback(
    (itemId: string): boolean =>
      visibleRef.current.has(itemId) && stateRef.current.items.some((entry) => entry.id === itemId),
    [],
  );

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

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
      inputRef.current.state.setSelection(next);
      if (focusItem) inputRef.current.onFocusItem(focusItem);
      else if (focusDate) inputRef.current.onFocusDate(focusDate);
    },
    [],
  );

  const handleCompletion = useCallback(
    (completion: GestureCompletion) => {
      const commit = commitGesture(completion, {
        selection: selectionAtStart.current,
        state: input.state,
        pipeline: input.pipeline,
        interaction: input.interaction,
        activeLayerId: input.activeLayerId,
        isDisabled,
        visibleItemIds,
        isItemVisible: isItemVisibleNow,
        visualOrder,
        ribbons: input.ribbons,
        showAnnotations: input.showAnnotations,
        emitSelection,
        onFocusItem: input.onFocusItem,
        onFocusDate: input.onFocusDate,
        onDiagnostic: input.onDiagnostic,
      });
      const preview = commit.preview;
      const promise = commit.promise;
      if (!preview || !promise) return;
      pendingKey.current += 1;
      const key = `pending-${pendingKey.current}`;
      setPendingPreviews((previous) => [...previous, { key, preview }]);
      void promise
        .finally(() => {
          if (mounted.current) {
            setPendingPreviews((previous) => previous.filter((entry) => entry.key !== key));
          }
        })
        .catch(() => undefined);
    },
    [
      emitSelection,
      input.activeLayerId,
      input.interaction,
      input.onDiagnostic,
      input.onFocusDate,
      input.onFocusItem,
      input.pipeline,
      isItemVisibleNow,
      input.ribbons,
      input.showAnnotations,
      input.state,
      isDisabled,
      visibleItemIds,
      visualOrder,
    ],
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
      event.currentTarget.setPointerCapture?.(event.pointerId);
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
      const current = gestureRef.current;
      if (current.phase === "idle" || current.pointerId !== event.pointerId) return;
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
      if (current.phase === "idle" || current.pointerId !== event.pointerId) return;
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
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      finishPointer(event);
    },
    [finishPointer],
  );

  const cancelActive = useCallback(
    (event?: PointerEvent<HTMLElement>, release = true) => {
      const current = gestureRef.current;
      if (current.phase === "idle") return;
      if (event && current.pointerId !== event.pointerId) return;
      if (frame.current !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame.current);
        frame.current = undefined;
      }
      const cancelled = cancelGesture(current);
      updateGesture(cancelled.state);
      suppressClick.current = true;
      if (cancelled.restore?.itemId) input.onFocusItem(cancelled.restore.itemId);
      else if (cancelled.restore?.date) input.onFocusDate(cancelled.restore.date);
      if (event && release) {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }
    },
    [input, updateGesture],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => cancelActive(event),
    [cancelActive],
  );
  const onLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => cancelActive(event, false),
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
        stateRef.current.selection,
        date,
        { shift: event.shiftKey === true, mod: isMod(event) },
        isDisabled,
      );
      emitSelection(next, undefined, date);
    },
    [emitSelection, isDisabled, shouldIgnoreClick],
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
        stateRef.current.selection,
        itemId,
        { shift: event.shiftKey === true, mod: isMod(event) },
        visualOrder,
      );
      emitSelection(next, itemId);
    },
    [emitSelection, shouldIgnoreClick, visualOrder],
  );

  const doubleClickItem = useCallback(
    (itemId: string) => {
      if (input.interaction?.doubleClick === "none") return;
      const alreadySelected =
        input.state.selection.items.length === 1 && input.state.selection.items[0] === itemId;
      if (!alreadySelected) selectItem(itemId, {});
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
      if (event.key === "Home" || event.key === "End") {
        const next = rowEdgeDate(
          input.layout,
          date,
          event.key === "Home" ? "start" : "end",
          isDisabled,
        );
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
          input.focusedItemId ??
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

  const activePreview = useMemo(() => {
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

  const previews = useMemo(() => {
    if (!activePreview) return pendingPreviews;
    return [...pendingPreviews, { key: previewKey(activePreview), preview: activePreview }];
  }, [activePreview, pendingPreviews]);

  return {
    previews,
    touchAction: input.interaction?.touchEditing === "on" ? "none" : "auto",
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

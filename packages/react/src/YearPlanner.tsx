"use client";

import {
  addDays,
  buildClassicYearLayout,
  buildRibbonLayout,
  diffDays,
  type InteractionMode,
  type PlannerFilter,
  type PlannerItem,
  type PlannerSelection,
  planRibbonPrint,
  getEffectiveVisibility as resolveEffectiveVisibility,
} from "@blendsdk/year-planner-core";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommandPipeline } from "./commands.js";
import { createFormatters } from "./locale.js";
import { resolveDisplayOptions } from "./options.js";
import { useYearPlannerTheme } from "./provider.js";
import { Inspector } from "./render/Inspector.js";
import { PrintPages } from "./render/PrintPages.js";
import { YearGrid } from "./render/YearGrid.js";
import { usePlannerState } from "./state.js";
import { resolveTheme, themeToCssVars } from "./theme.js";
import type { YearPlannerHandle, YearPlannerProps } from "./types.js";

function isKnownDate(layout: { rows: { columns: { date?: string }[] }[] }, date: string): boolean {
  return layout.rows.some((row) => row.columns.some((column) => column.date === date));
}

/** Applies a command to a local item array using the RD-08 outcome contract. */
function applyOutcome(
  items: PlannerItem[],
  updated: PlannerItem[] | undefined,
  removed: string[] | undefined,
): PlannerItem[] {
  if (!updated && !removed) return items;
  const remove = new Set([...(removed ?? []), ...(updated ?? []).map((item) => item.id)]);
  const next = items.filter((item) => !remove.has(item.id));
  for (const item of updated ?? []) next.push(item);
  return next;
}

/**
 * Renders a classic year planner with items, annotations, themes, inspector
 * hooks and print output.
 *
 * Controlled props win over defaults. Pointer gestures and the full command
 * lifecycle belong to later slices; the inspector and imperative handle use the
 * shared request pipeline.
 */
export const YearPlanner = forwardRef<YearPlannerHandle, YearPlannerProps>(
  function YearPlanner(props, ref) {
    const display = props.display;
    const providerTheme = useYearPlannerTheme();
    const resolvedTheme = resolveTheme(display?.theme, providerTheme);
    const resolvedDisplay = useMemo(
      () => resolveDisplayOptions(display, resolvedTheme.theme),
      [display, resolvedTheme.theme],
    );
    const theme = resolvedTheme.theme;
    const cssVars = useMemo(
      () => ({ ...themeToCssVars(theme), ...(props.cssVars ?? {}) }),
      [theme, props.cssVars],
    );
    const units = useMemo(
      () => ({
        monthBand: Number(theme.monthBandWidth),
        weekend: Number(theme.weekendWidth),
        weekday: Number(theme.weekdayWidth),
        rowHeight: Number(theme.rowHeight),
        ...(props.units ?? {}),
      }),
      [theme, props.units],
    );
    const layoutResult = useMemo(
      () =>
        buildClassicYearLayout({
          ...(props.year === undefined ? {} : { year: props.year }),
          ...(props.contextMonths === undefined ? {} : { contextMonths: props.contextMonths }),
          ...(props.range === undefined ? {} : { range: props.range }),
          ...(props.highlightYear === undefined ? {} : { highlightYear: props.highlightYear }),
          units,
        }),
      [props.year, props.contextMonths, props.range, props.highlightYear, units],
    );
    const layout = layoutResult.ok ? layoutResult.layout : undefined;

    const state = usePlannerState({
      ...props,
      displayTimeZone: resolvedDisplay.options.displayTimeZone,
    });
    const pipeline = useCommandPipeline({
      state,
      ...(props.readOnly ? { readOnly: true } : {}),
      ...(props.activeLayerId ? { activeLayerId: props.activeLayerId } : {}),
      ...(props.interaction?.createId ? { createId: props.interaction.createId } : {}),
      ...(props.interaction?.requestId ? { requestId: props.interaction.requestId } : {}),
      ...(props.interaction?.commandTimeoutMs
        ? { commandTimeoutMs: props.interaction.commandTimeoutMs }
        : {}),
      ...(props.interaction?.confirmChange
        ? { confirmChange: props.interaction.confirmChange }
        : {}),
      ...(props.validateChange ? { validateChange: props.validateChange } : {}),
      ...(props.onChangeRequest ? { onChangeRequest: props.onChangeRequest } : {}),
      ...(props.onChangeCommitted ? { onChangeCommitted: props.onChangeCommitted } : {}),
      ...(props.onChangeRejected ? { onChangeRejected: props.onChangeRejected } : {}),
      ...(props.onDiagnostic ? { onDiagnostic: props.onDiagnostic } : {}),
    });

    const ribbons = useMemo(() => {
      if (!layout) return undefined;
      try {
        return buildRibbonLayout(
          layout,
          { model: state.model, visibility: state.visibility, filter: state.filter },
          {
            density: resolvedDisplay.options.density,
            compactMaxLanes: resolvedDisplay.options.compactMaxLanes,
            laneHeight: resolvedDisplay.options.laneHeight,
            displayTimeZone: resolvedDisplay.options.displayTimeZone,
          },
        );
      } catch {
        return undefined;
      }
    }, [layout, state.model, state.visibility, state.filter, resolvedDisplay.options]);

    const printResult = useMemo(() => {
      if (!ribbons) return undefined;
      const requested = props.print ?? {};
      const planOptions = {
        ...(requested.page ? { page: requested.page } : {}),
        ...(requested.mode ? { mode: requested.mode } : {}),
        ...(requested.rowsPerPage === undefined ? {} : { rowsPerPage: requested.rowsPerPage }),
      };
      const requestedPlan = planRibbonPrint(ribbons, planOptions);
      if (requestedPlan.ok) {
        return {
          pages: requestedPlan.plan.pages,
          diagnostics: requestedPlan.plan.diagnostics,
        };
      }
      const fallback = planRibbonPrint(ribbons);
      return {
        pages: fallback.ok ? fallback.plan.pages : [],
        diagnostics: [
          ...requestedPlan.diagnostics,
          ...(fallback.ok ? fallback.plan.diagnostics : []),
        ],
      };
    }, [ribbons, props.print]);

    const formatters = useMemo(
      () => createFormatters(resolvedDisplay.options.locale),
      [resolvedDisplay.options.locale],
    );
    const layers = useMemo(
      () => new Map(state.model.layers.map((layer) => [layer.id, layer])),
      [state.model.layers],
    );
    const items = useMemo(
      () => new Map(state.model.items.map((item) => [item.id, item])),
      [state.model.items],
    );
    const itemsByDate = useMemo(() => {
      const map = new Map<string, string[]>();
      if (!ribbons) return map;
      for (const fragment of ribbons.fragments) {
        const days = diffDays(fragment.clippedStart, fragment.clippedEndExclusive);
        for (let offset = 0; offset < days; offset += 1) {
          const date = addDays(fragment.clippedStart, offset);
          const list = map.get(date) ?? [];
          if (!list.includes(fragment.itemId)) list.push(fragment.itemId);
          map.set(date, list);
        }
      }
      return map;
    }, [ribbons]);
    const selectedItemIds = useMemo(() => new Set(state.selection.items), [state.selection.items]);

    const layoutDiagnostics = layoutResult.ok ? [] : layoutResult.diagnostics;
    const printDiagnostics = printResult?.diagnostics ?? [];
    const diagnostics = useMemo(
      () => [
        ...layoutDiagnostics,
        ...state.validation.diagnostics,
        ...resolvedDisplay.diagnostics,
        ...printDiagnostics,
      ],
      [
        layoutDiagnostics,
        state.validation.diagnostics,
        resolvedDisplay.diagnostics,
        printDiagnostics,
      ],
    );
    const seenDiagnostics = useRef(new Set<string>());
    useEffect(() => {
      if (!props.onDiagnostic) return;
      for (const entry of diagnostics) {
        const key = `${entry.code}:${entry.message}`;
        if (seenDiagnostics.current.has(key)) continue;
        seenDiagnostics.current.add(key);
        props.onDiagnostic(entry);
      }
    }, [diagnostics, props.onDiagnostic]);

    const firstDate = layout?.rows
      .flatMap((row) => row.columns)
      .find((column) => column.date)?.date;
    const [activeDate, setActiveDate] = useState<string | undefined>(undefined);
    const [activeItemId, setActiveItemId] = useState<string | undefined>(undefined);
    const [geometryVersion, setGeometryVersion] = useState(0);
    const [inspectorOpen, setInspectorOpen] = useState(props.showInspector !== false);
    const inspectorRef = useRef<HTMLElement>(null);
    const [focusInspector, setFocusInspector] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const warnedInteractiveSlot = useRef(false);
    const [pendingFocus, setPendingFocus] = useState<
      { type: "date" | "item"; id: string } | undefined
    >(undefined);

    const effectiveActiveDate =
      activeDate && layout && isKnownDate(layout, activeDate) ? activeDate : firstDate;

    useEffect(() => {
      if (!pendingFocus) return;
      const selector =
        pendingFocus.type === "date"
          ? `[data-date="${pendingFocus.id}"]`
          : `[data-yp-part="item-proxy"][data-item-id="${pendingFocus.id}"]`;
      const element = viewportRef.current?.querySelector<HTMLElement>(selector);
      element?.focus();
      setPendingFocus(undefined);
    }, [pendingFocus]);

    useEffect(() => {
      if (props.showInspector === false) return;
      if (state.selection.items.length > 0 || state.selection.dates.length > 0) {
        setInspectorOpen(true);
      }
    }, [state.selection, props.showInspector]);

    useEffect(() => {
      if (!focusInspector) return;
      inspectorRef.current?.focus();
      setFocusInspector(false);
    }, [focusInspector]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-scan when ribbons or slot renderers change
    useEffect(() => {
      if (warnedInteractiveSlot.current) return;
      const proxies = viewportRef.current?.querySelectorAll('[data-yp-part="item-proxy"]');
      if (!proxies) return;
      for (const proxy of proxies) {
        if (proxy.querySelector("button, a, input, select, textarea, [tabindex]")) {
          warnedInteractiveSlot.current = true;
          console.warn(
            "YearPlanner: renderItem/ItemFragment content must not contain interactive controls inside the item proxy.",
          );
          return;
        }
      }
    }, [ribbons, props.renderItem, props.components?.ItemFragment]);

    useEffect(() => {
      const element = viewportRef.current;
      if (!element) return;
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => setGeometryVersion((value) => value + 1));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const focusDate = useCallback((date: string) => {
      setActiveDate(date);
      setActiveItemId(undefined);
      setPendingFocus({ type: "date", id: date });
    }, []);

    const focusItem = useCallback((itemId: string) => {
      setActiveItemId(itemId);
      setPendingFocus({ type: "item", id: itemId });
    }, []);

    const scrollToDate = useCallback((date: string) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const cell = viewport.querySelector<HTMLElement>(`[data-date="${date}"]`);
      if (!cell) return;
      viewport.scrollLeft = cell.offsetLeft - viewport.clientWidth / 2 + cell.clientWidth / 2;
    }, []);

    const isDisabledDate = useCallback(
      (date: string): boolean => {
        if (!layout || !props.getDateMeta) return false;
        const row = layout.rows.find(
          (entry) => date >= entry.firstDate && date < entry.endDateExclusive,
        );
        const column = row?.columns.find((entry) => entry.date === date);
        if (!row || !column) return true;
        const meta = props.getDateMeta(date, {
          isWeekend: column.isWeekend,
          isContextMonth: column.isContextMonth,
          itemIds: itemsByDate.get(date) ?? [],
        });
        return meta?.disabled === true;
      },
      [layout, props.getDateMeta, itemsByDate],
    );

    const moveFocusFrom = useCallback(
      (date: string, delta: number) => {
        const target = addDays(date, delta);
        if (!layout || !isKnownDate(layout, target)) return;
        focusDate(target);
      },
      [layout, focusDate],
    );

    const selectItem = useCallback(
      (itemId: string) => {
        const next: PlannerSelection = { dates: [], items: [itemId], anchorItemId: itemId };
        state.setSelection(next);
        setActiveItemId(itemId);
      },
      [state],
    );

    const selectDate = useCallback(
      (date: string) => {
        const next: PlannerSelection = {
          dates: [{ startDate: date, endDateExclusive: addDays(date, 1) }],
          items: [],
          anchorDate: date,
          focusDate: date,
        };
        state.setSelection(next);
        setActiveItemId(undefined);
      },
      [state],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: the handle closes over current state and pipeline
    useImperativeHandle(
      ref,
      () => ({
        showGroup: (id) => state.dispatchVisibility({ type: "showGroup", groupId: id }),
        hideGroup: (id) => state.dispatchVisibility({ type: "hideGroup", groupId: id }),
        toggleGroup: (id) => state.dispatchVisibility({ type: "toggleGroup", groupId: id }),
        showLayer: (id) => state.dispatchVisibility({ type: "showLayer", layerId: id }),
        hideLayer: (id) => state.dispatchVisibility({ type: "hideLayer", layerId: id }),
        showItem: (id) => state.dispatchVisibility({ type: "showItem", itemId: id }),
        hideItem: (id) => state.dispatchVisibility({ type: "hideItem", itemId: id }),
        showAll: state.showAll,
        setFilter: (filter: PlannerFilter) => state.setFilter(filter),
        selectRange: (interval) => {
          const days = diffDays(interval.startDate, interval.endDateExclusive);
          if (days <= 0) return;
          for (let offset = 0; offset < days; offset += 1) {
            if (isDisabledDate(addDays(interval.startDate, offset))) return;
          }
          state.setSelection({ dates: [interval], items: [] });
        },
        clearSelection: () => state.setSelection({ dates: [], items: [] }),
        focusItem,
        focusDate,
        scrollToDate,
        setInteractionMode: (mode: InteractionMode) => state.setInteractionMode(mode),
        requestCommand: (command) => {
          void pipeline.requestCommand(command);
        },
        requestUndo: pipeline.requestUndo,
        requestRedo: pipeline.requestRedo,
        openInspector: () => {
          if (props.showInspector === false) return;
          setInspectorOpen(true);
          setFocusInspector(true);
        },
        getEffectiveVisibility: (id) => {
          const result = resolveEffectiveVisibility(id, {
            model: state.model,
            visibility: state.visibility,
            filter: state.filter,
          });
          return { visible: result.visible, reason: result.reason };
        },
      }),
      [state, focusItem, focusDate, scrollToDate, isDisabledDate, pipeline],
    );

    const className = [
      "yp-root",
      getPresetClass(resolvedTheme.themeName),
      props.unstyled ? "yp-unstyled" : "",
      props.className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    const layoutErrorMessage = layoutResult.ok ? undefined : layoutResult.diagnostics[0]?.message;
    if (!layoutResult.ok || !layout || !ribbons) {
      return (
        <div
          className={className}
          data-yp-part="root"
          data-yp-theme={resolvedTheme.themeName}
          dir="ltr"
          style={{ ...cssVars, ...props.style }}
        >
          <div className="yp-empty" role="status" data-yp-part="empty">
            {props.renderEmpty?.() ?? layoutErrorMessage ?? "Unable to render the year planner."}
          </div>
        </div>
      );
    }

    const inspectorFocusDate = state.selection.focusDate ?? effectiveActiveDate;
    const activeRowId = inspectorFocusDate?.slice(0, 7);
    const overflowRow = activeRowId
      ? ribbons.rows.find((row) => row.rowId === activeRowId)
      : ribbons.rows[0];
    const closeInspector = (): void => {
      setInspectorOpen(false);
      if (activeItemId ?? state.selection.items[0]) {
        setPendingFocus({ type: "item", id: (activeItemId ?? state.selection.items[0]) as string });
      } else if (effectiveActiveDate) {
        setPendingFocus({ type: "date", id: effectiveActiveDate });
      }
    };

    const content = (
      <>
        <div
          className="yp-viewport"
          data-yp-part="viewport"
          data-yp-geometry-version={geometryVersion}
          ref={viewportRef}
          style={{ overflow: "auto" }}
        >
          <YearGrid
            layout={layout}
            ribbons={ribbons}
            formatters={formatters}
            zoom={resolvedDisplay.options.zoom}
            bandWidth={Number(theme.monthBandWidth)}
            layers={layers}
            items={items}
            itemsByDate={itemsByDate}
            activeDate={effectiveActiveDate}
            activeItemId={activeItemId ?? state.selection.items[0]}
            selectedItemIds={selectedItemIds}
            pendingItemIds={pipeline.pendingItemIds}
            showISOWeekNumbers={resolvedDisplay.options.showISOWeekNumbers}
            showAnnotations={resolvedDisplay.options.showAnnotations}
            getDateMeta={props.getDateMeta}
            renderCell={props.renderCell}
            renderItem={props.renderItem}
            renderAnnotation={props.renderAnnotation}
            renderOverflow={props.renderOverflow}
            renderTooltip={props.renderTooltip}
            components={props.components ?? {}}
            displayTimeZone={resolvedDisplay.options.displayTimeZone}
            ariaLabel={props.ariaLabel ?? `Year planner ${layout.highlightYear}`}
            ariaDescribedBy={props.ariaDescribedBy}
            onFocusDate={setActiveDate}
            onMoveFocus={moveFocusFrom}
            onSelectDate={selectDate}
            onSelectItem={selectItem}
            onFocusItem={focusItem}
          />
        </div>
        <Inspector
          model={state.model}
          visibility={state.visibility}
          filter={state.filter}
          selection={state.selection}
          open={props.showInspector !== false && inspectorOpen}
          readOnly={props.readOnly === true}
          interactionMode={state.interactionMode}
          activeLayerId={props.activeLayerId}
          activeDate={effectiveActiveDate}
          formatters={formatters}
          displayTimeZone={resolvedDisplay.options.displayTimeZone}
          overflowRow={overflowRow}
          pipeline={pipeline}
          interaction={props.interaction}
          components={props.components ?? {}}
          renderInspector={props.renderInspector}
          onClose={closeInspector}
          onSelectItem={selectItem}
          onFocusItem={focusItem}
          asideRef={inspectorRef}
        />
        {printResult && (
          <PrintPages
            layout={layout}
            ribbons={ribbons}
            pages={printResult.pages}
            formatters={formatters}
            layers={layers}
            items={items}
            bandWidth={Number(theme.monthBandWidth)}
            showISOWeekNumbers={resolvedDisplay.options.showISOWeekNumbers}
            showAnnotations={resolvedDisplay.options.showAnnotations}
            weekdayNames={formatters.weekdayNames()}
          />
        )}
      </>
    );
    const Root = props.components?.Root;
    return (
      <div
        className={className}
        data-yp-part="root"
        data-yp-theme={resolvedTheme.themeName}
        data-yp-density={resolvedDisplay.options.density}
        dir="ltr"
        style={{ ...cssVars, ...props.style }}
      >
        {Root ? <Root className="yp-root-slot">{content}</Root> : content}
      </div>
    );
  },
);

function getPresetClass(themeName: string): string {
  return /^[a-z0-9-]+$/.test(themeName) ? `yp-theme-${themeName}` : "";
}

/** Applies a host command outcome to an item array. */
export function applyCommandOutcome(
  items: PlannerItem[],
  outcome: { updatedItems?: PlannerItem[]; removedItemIds?: string[] },
): PlannerItem[] {
  return applyOutcome(items, outcome.updatedItems, outcome.removedItemIds);
}

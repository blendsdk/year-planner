"use client";

import {
  addDays,
  buildClassicYearLayout,
  buildRibbonLayout,
  diffDays,
  type InteractionMode,
  type PlannerCommand,
  type PlannerFilter,
  type PlannerSelection,
  planRibbonPrint,
  type RibbonLayout,
  getEffectiveVisibility as resolveEffectiveVisibility,
  type YearLayout,
} from "@blendsdk/year-planner-core";
import {
  forwardRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { readableTextColor, selectedDateSet } from "./a11y.js";
import { useCommandPipeline } from "./commands.js";
import { useInteraction } from "./interaction/useInteraction.js";
import { createFormatters } from "./locale.js";
import { resolveDisplayOptions } from "./options.js";
import { useYearPlannerTheme } from "./provider.js";
import { Inspector } from "./render/Inspector.js";
import { PrintPages } from "./render/PrintPages.js";
import { StatusBar } from "./render/StatusBar.js";
import { YearGrid } from "./render/YearGrid.js";
import { usePlannerState } from "./state.js";
import { resolveTheme, themeToCssVars } from "./theme.js";
import type { YearPlannerHandle, YearPlannerProps } from "./types.js";
import { useAnnouncements } from "./useAnnouncements.js";

const EMPTY_LAYOUT: YearLayout = {
  rows: [],
  totalDayWidth: 0,
  bodyHeight: 0,
  headerHeight: 0,
  footerHeight: 0,
  monthBandWidth: 0,
  rowHeight: 0,
  highlightYear: 0,
  signature: "",
};

const EMPTY_RIBBONS: RibbonLayout = {
  rows: [],
  fragments: [],
  density: "compact",
  compactMaxLanes: 3,
  laneHeight: 24,
  laneTop: 18,
  headerHeight: 0,
  footerHeight: 0,
  monthBandWidth: 0,
  totalDayWidth: 0,
  totalWidth: 0,
  height: 0,
  signature: "",
};

function escapeSelector(value: string): string {
  const cssObject = globalThis.CSS;
  if (cssObject && typeof cssObject.escape === "function") return cssObject.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function isKnownDate(layout: { rows: { columns: { date?: string }[] }[] }, date: string): boolean {
  return layout.rows.some((row) => row.columns.some((column) => column.date === date));
}

/**
 * Renders a classic year planner with items, annotations, themes, inspector
 * hooks and print output.
 *
 * Controlled props win over defaults. Pointer, keyboard and touch gestures,
 * the inspector and the imperative handle all use the shared request pipeline;
 * rollback and stale-response handling belong to the command lifecycle slice.
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
      () => ({
        ...themeToCssVars(theme),
        "--yp-ribbon-text": readableTextColor(String(theme.ribbon), [
          String(theme.textPrimary),
          String(theme.textInverse),
        ]),
        ...(props.cssVars ?? {}),
      }),
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
    const contextKey = useMemo(
      () =>
        JSON.stringify({
          layout: layout?.signature ?? "",
          mode: state.interactionMode,
          visibility: {
            groups: [...state.visibility.hiddenGroupIds].sort(),
            layers: [...state.visibility.hiddenLayerIds].sort(),
            items: [...state.visibility.hiddenItemIds].sort(),
            channels: [...(state.visibility.hiddenChannels ?? [])].sort(),
          },
          filter: {
            layers: [...(state.filter.layerIds ?? [])].sort(),
            resources: [...(state.filter.resourceIds ?? [])].sort(),
            statuses: [...(state.filter.statuses ?? [])].sort(),
            search: state.filter.search ?? "",
          },
        }),
      [layout?.signature, state.filter, state.interactionMode, state.visibility],
    );
    const pipeline = useCommandPipeline({
      state,
      contextKey,
      ...(props.readOnly ? { readOnly: true } : {}),
      ...(props.baseRevision !== undefined ? { baseRevision: props.baseRevision } : {}),
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
    const proxyFragments = useMemo(
      () =>
        (ribbons?.fragments ?? []).filter((fragment) => {
          if (fragment.channel === "background" || fragment.channel === "highlight") return false;
          if (fragment.channel === "annotation" && !resolvedDisplay.options.showAnnotations) {
            return false;
          }
          if (fragment.channel === "ribbon") {
            const row = ribbons?.rows[fragment.rowIndex];
            if (!row || fragment.lane >= row.visibleLaneCount) return false;
          }
          return true;
        }),
      [resolvedDisplay.options.showAnnotations, ribbons],
    );
    const proxyItemIds = useMemo(
      () => new Set(proxyFragments.map((fragment) => fragment.itemId)),
      [proxyFragments],
    );
    const selectedItemIds = useMemo(() => new Set(state.selection.items), [state.selection.items]);
    const renderedItemIds = useMemo(
      () => new Set((ribbons?.fragments ?? []).map((fragment) => fragment.itemId)),
      [ribbons],
    );
    const selectedDates = useMemo(
      () => selectedDateSet(state.selection.dates),
      [state.selection.dates],
    );
    const visibleItemCount = useMemo(
      () =>
        state.items.filter(
          (item) =>
            resolveEffectiveVisibility(item.id, {
              model: state.model,
              visibility: state.visibility,
              filter: state.filter,
            }).visible,
        ).length,
      [state.filter, state.items, state.model, state.visibility],
    );
    const announcements = useAnnouncements({
      pending: pipeline.pendingItemIds.size > 0,
      settled: pipeline.lastSettled,
      feedbackVisible: pipeline.feedback !== undefined,
      selection: state.selection,
      visibility: state.visibility,
      visibleItemCount,
    });
    const helpId = useId();
    const inspectorId = useId();
    const feedbackId = useId();
    const itemListId = `${inspectorId}-items`;
    const errorItemId = pipeline.feedback ? commandItemId(pipeline.feedback.command) : undefined;
    const itemListRef = useRef<HTMLElement>(null);
    const regionLabel = (
      props.ariaLabel ?? `Year planner ${layout?.highlightYear ?? props.year ?? ""}`
    ).trim();
    const gridLabel = `${regionLabel} grid`;
    const gridDescribedBy = [props.ariaDescribedBy, helpId].filter(Boolean).join(" ") || undefined;

    const isDisabledDate = useCallback(
      (date: string): boolean => {
        if (!layout) return true;
        if (!props.getDateMeta) return false;
        const row = layout.rows.find(
          (entry) => date >= entry.firstDate && date < entry.endDateExclusive,
        );
        const column = row?.columns.find((entry) => entry.date === date);
        if (!row || !column) return true;
        return (
          props.getDateMeta(date, {
            isWeekend: column.isWeekend,
            isContextMonth: column.isContextMonth,
            itemIds: itemsByDate.get(date) ?? [],
          })?.disabled === true
        );
      },
      [layout, props.getDateMeta, itemsByDate],
    );

    const nearestEnabledDate = useCallback(
      (candidate: string | undefined): string | undefined => {
        if (!layout) return undefined;
        const dates = layout.rows
          .flatMap((row) => row.columns)
          .map((column) => column.date)
          .filter((date): date is string => date !== undefined);
        if (dates.length === 0) return undefined;
        const index = candidate === undefined ? 0 : dates.findIndex((date) => date >= candidate);
        const nextIndex = index === -1 ? dates.length : index;
        let next: string | undefined;
        for (let cursor = nextIndex; cursor < dates.length; cursor += 1) {
          const date = dates[cursor];
          if (date && !isDisabledDate(date)) {
            next = date;
            break;
          }
        }
        let previous: string | undefined;
        for (let cursor = nextIndex - 1; cursor >= 0; cursor -= 1) {
          const date = dates[cursor];
          if (date && !isDisabledDate(date)) {
            previous = date;
            break;
          }
        }
        if (candidate === undefined || !next) return previous ?? next;
        if (!previous) return next;
        const previousDistance = Math.abs(diffDays(previous, candidate));
        const nextDistance = Math.abs(diffDays(candidate, next));
        return previousDistance <= nextDistance ? previous : next;
      },
      [isDisabledDate, layout],
    );

    const announceFocus = useCallback((date: string) => {
      setFocusAnnouncement(undefined);
      const message = `Focus moved to ${date}`;
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => setFocusAnnouncement(message));
      } else {
        setFocusAnnouncement(message);
      }
    }, []);

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
    const [focusItemList, setFocusItemList] = useState(false);
    const [focusAnnouncement, setFocusAnnouncement] = useState<string | undefined>(undefined);
    const viewportRef = useRef<HTMLDivElement>(null);
    const warnedInteractiveSlot = useRef(false);
    const [pendingFocus, setPendingFocus] = useState<
      { type: "date" | "item"; id: string } | undefined
    >(undefined);

    const activeCandidate =
      activeDate && layout && isKnownDate(layout, activeDate) ? activeDate : firstDate;
    const effectiveActiveDate =
      activeCandidate && !isDisabledDate(activeCandidate)
        ? activeCandidate
        : nearestEnabledDate(activeCandidate);
    const rovingRowId = effectiveActiveDate?.slice(0, 7) ?? layout?.rows[0]?.rowId;

    useEffect(() => {
      if (!pendingFocus) return;
      const viewport = viewportRef.current;
      if (!viewport) {
        setPendingFocus(undefined);
        return;
      }
      const selector =
        pendingFocus.type === "date"
          ? `[data-date="${escapeSelector(pendingFocus.id)}"]`
          : `[data-yp-part="item-proxy"][data-item-id="${escapeSelector(pendingFocus.id)}"]`;
      const element = viewport.querySelector<HTMLElement>(selector);
      const targetDisabled = pendingFocus.type === "date" && isDisabledDate(pendingFocus.id);
      if (element && !targetDisabled) {
        element.focus();
        setPendingFocus(undefined);
        return;
      }
      const fallbackItem =
        pendingFocus.type === "item"
          ? state.items.find((entry) => entry.id === pendingFocus.id)
          : undefined;
      const candidate =
        state.selection.focusDate ??
        (fallbackItem?.period.kind === "all-day"
          ? fallbackItem.period.startDate
          : fallbackItem?.period.kind === "timed"
            ? fallbackItem.period.start.slice(0, 10)
            : undefined);
      const fallback = nearestEnabledDate(candidate);
      const cell = fallback
        ? viewport.querySelector<HTMLElement>(`[data-date="${escapeSelector(fallback)}"]`)
        : null;
      if (cell && fallback) {
        cell.focus();
        announceFocus(fallback);
      }
      setPendingFocus(undefined);
    }, [
      announceFocus,
      isDisabledDate,
      nearestEnabledDate,
      pendingFocus,
      state.items,
      state.selection.focusDate,
    ]);

    const previousShowInspector = useRef(props.showInspector);
    useEffect(() => {
      if (props.showInspector === false) {
        previousShowInspector.current = false;
        return;
      }
      if (
        previousShowInspector.current === false ||
        state.selection.items.length > 0 ||
        state.selection.dates.length > 0
      ) {
        setInspectorOpen(true);
      }
      previousShowInspector.current = props.showInspector;
    }, [state.selection, props.showInspector]);

    useEffect(() => {
      if (!focusInspector) return;
      inspectorRef.current?.focus();
      setFocusInspector(false);
    }, [focusInspector]);

    useEffect(() => {
      if (!focusItemList) return;
      if (!inspectorOpen) {
        setInspectorOpen(true);
        return;
      }
      itemListRef.current?.focus();
      setFocusItemList(false);
    }, [focusItemList, inspectorOpen]);

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

    useEffect(() => {
      if (!activeDate || !layout) return;
      const row = layout.rows.find(
        (entry) => activeDate >= entry.firstDate && activeDate < entry.endDateExclusive,
      );
      if (!row || !isDisabledDate(activeDate)) return;
      const fallback = nearestEnabledDate(activeDate);
      if (fallback) {
        focusDate(fallback);
        announceFocus(fallback);
      }
    }, [activeDate, announceFocus, focusDate, isDisabledDate, layout, nearestEnabledDate]);

    const focusItem = useCallback((itemId: string) => {
      setActiveItemId(itemId);
      setPendingFocus({ type: "item", id: itemId });
    }, []);

    const handleCellFocus = useCallback((date: string) => {
      setActiveDate(date);
      setActiveItemId(undefined);
    }, []);

    const scrollToDate = useCallback((date: string) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const cell = viewport.querySelector<HTMLElement>(`[data-date="${escapeSelector(date)}"]`);
      if (!cell) return;
      viewport.scrollLeft = cell.offsetLeft - viewport.clientWidth / 2 + cell.clientWidth / 2;
    }, []);

    const openInspector = useCallback(() => {
      if (props.showInspector === false) return;
      setInspectorOpen(true);
      setFocusInspector(true);
    }, [props.showInspector]);

    const skipToItemList = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setInspectorOpen(true);
      setFocusItemList(true);
    }, []);

    const interaction = useInteraction({
      state,
      layout: layout ?? EMPTY_LAYOUT,
      ribbons: ribbons ?? EMPTY_RIBBONS,
      pipeline,
      viewportRef,
      zoom: resolvedDisplay.options.zoom,
      readOnly: props.readOnly === true,
      activeLayerId: props.activeLayerId,
      interaction: props.interaction,
      getDateMeta: props.getDateMeta,
      itemsByDate,
      showAnnotations: resolvedDisplay.options.showAnnotations,
      focusedItemId: activeItemId,
      onFocusItem: focusItem,
      onFocusDate: focusDate,
      openInspector,
      onDiagnostic: props.onDiagnostic,
    });

    useEffect(() => {
      const visible = new Set(
        state.items
          .filter(
            (entry) =>
              resolveEffectiveVisibility(entry.id, {
                model: state.model,
                visibility: state.visibility,
                filter: state.filter,
              }).visible,
          )
          .map((entry) => entry.id),
      );
      const items = state.selection.items.filter((id) => visible.has(id));
      if (items.length === state.selection.items.length) return;
      const focusHidden =
        state.selection.focusItemId !== undefined && !visible.has(state.selection.focusItemId);
      const next: PlannerSelection = { ...state.selection, items };
      if (focusHidden) {
        delete next.focusItemId;
        delete next.anchorItemId;
      }
      state.setSelection(next);
      if (focusHidden) {
        const fallback = nearestEnabledDate(state.selection.focusDate);
        if (fallback) {
          focusDate(fallback);
          announceFocus(fallback);
        }
      }
    }, [
      announceFocus,
      focusDate,
      nearestEnabledDate,
      state.filter,
      state.items,
      state.model,
      state.selection,
      state.setSelection,
      state.visibility,
    ]);

    useEffect(() => {
      if (!activeItemId) return;
      const item = state.items.find((entry) => entry.id === activeItemId);
      const visible = item
        ? proxyItemIds.has(item.id) &&
          resolveEffectiveVisibility(item.id, {
            model: state.model,
            visibility: state.visibility,
            filter: state.filter,
          }).visible
        : false;
      if (item && visible) return;
      const start =
        item?.period.kind === "all-day"
          ? item.period.startDate
          : item?.period.kind === "timed"
            ? item.period.start.slice(0, 10)
            : undefined;
      const fallback = nearestEnabledDate(state.selection.focusDate ?? start);
      setActiveItemId(undefined);
      if (fallback) {
        focusDate(fallback);
        announceFocus(fallback);
      }
    }, [
      activeItemId,
      announceFocus,
      focusDate,
      nearestEnabledDate,
      proxyItemIds,
      state.filter,
      state.items,
      state.model,
      state.selection.focusDate,
      state.visibility,
    ]);

    useEffect(() => {
      if (state.selection.focusItemId) setActiveItemId(state.selection.focusItemId);
      else if (state.selection.focusDate) setActiveDate(state.selection.focusDate);
    }, [state.selection.focusDate, state.selection.focusItemId]);

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
        openInspector,
        getEffectiveVisibility: (id) => {
          const result = resolveEffectiveVisibility(id, {
            model: state.model,
            visibility: state.visibility,
            filter: state.filter,
          });
          return { visible: result.visible, reason: result.reason };
        },
      }),
      [state, focusItem, focusDate, scrollToDate, isDisabledDate, pipeline, openInspector],
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
          role="region"
          aria-label={regionLabel}
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
      const focusTarget = activeItemId ?? state.selection.items[0];
      if (focusTarget) {
        setPendingFocus({ type: "item", id: focusTarget });
      } else if (effectiveActiveDate) {
        setPendingFocus({ type: "date", id: effectiveActiveDate });
      }
    };

    const selectedVisibleItem = state.selection.items.find((id) => proxyItemIds.has(id));
    const activeVisibleItem =
      activeItemId && proxyItemIds.has(activeItemId) ? activeItemId : undefined;
    const rovingItemId = activeVisibleItem ?? selectedVisibleItem ?? proxyFragments[0]?.itemId;
    const activeFragmentId = proxyFragments.find(
      (fragment) => fragment.itemId === rovingItemId,
    )?.fragmentId;

    const content = (
      <>
        {props.showInspector !== false && (
          <a className="yp-skip-link" href={`#${itemListId}`} onClick={skipToItemList}>
            Skip to item list
          </a>
        )}
        <p id={helpId} className="yp-sr-only">
          Use arrow keys to move between dates. Hold Shift with an arrow key to extend the
          selection. Press Space to toggle a date or item, Enter to inspect, Escape to cancel or
          clear, and Delete to delete the focused item after confirmation.
        </p>
        <p className="yp-sr-only" role="status" aria-live="polite" data-yp-part="focus-status">
          {focusAnnouncement}
        </p>
        <p
          className="yp-sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-yp-part="command-announcer"
        >
          {announcements.polite}
        </p>
        <p className="yp-sr-only" role="alert" aria-atomic="true" data-yp-part="error-announcer">
          {announcements.assertive}
        </p>
        <p
          className="yp-sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-yp-part="selection-announcer"
        >
          {announcements.selection}
        </p>
        <p
          className="yp-sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-yp-part="visibility-announcer"
        >
          {announcements.visibility}
        </p>
        <StatusBar status={announcements.status} />
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
            bandWidth={layout.monthBandWidth}
            layers={layers}
            items={items}
            itemsByDate={itemsByDate}
            activeDate={effectiveActiveDate}
            activeRowId={rovingRowId}
            selectedDates={selectedDates}
            errorDescriptionId={
              pipeline.feedback && props.showInspector !== false && inspectorOpen
                ? feedbackId
                : undefined
            }
            errorItemId={errorItemId}
            activeFragmentId={activeFragmentId}
            selectedItemIds={selectedItemIds}
            pendingItemIds={pipeline.pendingItemIds}
            selection={state.selection}
            previews={interaction.previews}
            touchAction={interaction.touchAction}
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
            textPrimary={String(theme.textPrimary)}
            textInverse={String(theme.textInverse)}
            globalReadOnly={props.readOnly === true}
            ariaLabel={gridLabel}
            ariaDescribedBy={gridDescribedBy}
            onFocusDate={handleCellFocus}
            onCellKeyDown={interaction.onCellKeyDown}
            onSelectDate={interaction.selectDate}
            onSelectItem={interaction.selectItem}
            onItemKeyDown={interaction.onItemKeyDown}
            onDoubleClickItem={interaction.doubleClickItem}
            onGridKeyDown={interaction.onGridKeyDown}
            onPointerDown={interaction.onPointerDown}
            onPointerMove={interaction.onPointerMove}
            onPointerUp={interaction.onPointerUp}
            onPointerCancel={interaction.onPointerCancel}
            onLostPointerCapture={interaction.onLostPointerCapture}
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
          onSelectItem={(itemId) => interaction.selectItem(itemId, {})}
          onFocusItem={focusItem}
          asideId={inspectorId}
          asideRef={inspectorRef}
          itemListId={itemListId}
          itemListRef={itemListRef}
          renderedItemIds={renderedItemIds}
          feedbackId={feedbackId}
        />
        {printResult && (
          <PrintPages
            layout={layout}
            ribbons={ribbons}
            pages={printResult.pages}
            formatters={formatters}
            layers={layers}
            items={items}
            bandWidth={layout.monthBandWidth}
            showISOWeekNumbers={resolvedDisplay.options.showISOWeekNumbers}
            showAnnotations={resolvedDisplay.options.showAnnotations}
            weekdayNames={formatters.weekdayNames()}
            textPrimary={String(theme.textPrimary)}
            textInverse={String(theme.textInverse)}
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
        data-yp-command-state={
          pipeline.pendingItemIds.size > 0 ? "pending" : (pipeline.lastSettled?.result ?? "idle")
        }
        role="region"
        aria-label={regionLabel}
        dir="ltr"
        style={{ ...cssVars, ...props.style }}
      >
        {Root ? <Root className="yp-root-slot">{content}</Root> : content}
      </div>
    );
  },
);

function commandItemId(command: PlannerCommand): string | undefined {
  if ("itemId" in command) return command.itemId;
  if (command.type === "create") return command.item.id;
  return undefined;
}

function getPresetClass(themeName: string): string {
  return /^[a-z0-9-]+$/.test(themeName) ? `yp-theme-${themeName}` : "";
}

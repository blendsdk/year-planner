# View Shell: M3 React View

> **Document**: 03-02-view-shell.md
> **Parent**: [Index](00-index.md)

## Overview

Owns the public props/handle, root composition, scroll/zoom geometry, grid
labels, localization, pointer-coordinate helpers and SSR behavior. Items and
inspector are separate documents.

## Public surface

```ts
export interface InteractionConfig {
  mode?: InteractionMode;                 // default "auto"
  touchEditing?: "auto" | "on" | "off";   // accepted; RD-07 owns behavior
  marquee?: "items" | "dates";            // accepted; RD-07 owns behavior
  createDefaults?: { kind: ItemKind; layerId: string };
  paintDefaults?: PaintDefaults;
  createId?: () => string;              // default crypto.randomUUID / monotonic fallback
  confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>;
  commandTimeoutMs?: number;              // default 15000
  requestId?: () => string;
}

export interface DisplayConfig {
  density?: "compact" | "expanded";       // default "compact"
  theme?: YearPlannerThemeName | string;  // default "classic-blue"
  showISOWeekNumbers?: boolean;           // default true
  showAnnotations?: boolean;              // default true
  compactMaxLanes?: number;               // default 3
  connectorMode?: "none" | "edge-path";   // R1 accepts only "none"
  zoom?: number;                          // default 1; clamped 0.75-1.5
  locale?: string;                        // default "en-US"
  displayTimeZone?: string;               // default "UTC"
}

export interface PrintConfig {
  page?: "A3";                            // default "A3"
  mode?: "paginate" | "fit";              // default "paginate"
  rowsPerPage?: number;                   // default 14
}

export type YearPlannerDisplay = DisplayConfig;
export type YearPlannerPrint = PrintConfig;

export interface YearPlannerProps {
  year?: number;
  contextMonths?: { before: number; after: number };
  range?: { start: { year: number; month: number }; monthCount: number };
  highlightYear?: number;
  units?: Partial<ClassicYearUnits>;       // additive compatibility
  items?: PlannerItem[];
  defaultItems?: PlannerItem[];
  onItemsChange?: (items: PlannerItem[]) => void;
  groups?: LayerGroup[];
  layers?: PlannerLayer[];
  resources?: Resource[];
  annotations?: PlannerItem[];
  visibility?: VisibilityState;
  defaultVisibility?: VisibilityState;
  onVisibilityChange?: (next: VisibilityState) => void;
  selection?: PlannerSelection;
  defaultSelection?: PlannerSelection;
  onSelectionChange?: (next: PlannerSelection) => void;
  filter?: PlannerFilter;
  defaultFilter?: PlannerFilter;
  onFilterChange?: (next: PlannerFilter) => void;
  readOnly?: boolean;
  activeLayerId?: string;
  interaction?: InteractionConfig;
  display?: DisplayConfig;
  print?: PrintConfig;
  validateChange?: (command: PlannerCommand, context: CommandContext) => ValidationResult | Promise<ValidationResult>;
  onChangeRequest?: (command: PlannerCommand, context: CommandContext) => CommandOutcome | Promise<CommandOutcome>;
  onChangeCommitted?: (outcome: CommandOutcome) => void;
  onChangeRejected?: (outcome: CommandOutcome) => void;
  onDiagnostic?: (diagnostic: Diagnostic) => void;
  getDateMeta?: (date: DateKey, context: DateMetaContext) => DateMeta | undefined;
  renderCell?: (context: CellRenderContext) => ReactNode;
  renderItem?: (context: ItemRenderContext) => ReactNode;
  renderAnnotation?: (context: AnnotationRenderContext) => ReactNode;
  renderOverflow?: (context: OverflowRenderContext) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderInspector?: (context: InspectorRenderContext) => ReactNode;
  renderTooltip?: (context: TooltipRenderContext) => ReactNode;
  components?: Partial<YearPlannerComponents>;
  cssVars?: Record<`--yp-${string}`, string>;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  unstyled?: boolean;
  showInspector?: boolean;
}

export interface YearPlannerHandle {
  showGroup(id: string): void;
  hideGroup(id: string): void;
  toggleGroup(id: string): void;
  showLayer(id: string): void;
  hideLayer(id: string): void;
  showItem(id: string): void;
  hideItem(id: string): void;
  showAll(): void;
  setFilter(filter: PlannerFilter): void;
  selectRange(interval: DateInterval): void;
  clearSelection(): void;
  focusItem(id: string): void;
  focusDate(date: DateKey): void;
  scrollToDate(date: DateKey): void;
  setInteractionMode(mode: InteractionMode): void;
  requestCommand(command: PlannerCommand): void;
  requestUndo(): void;
  requestRedo(): void;
  openInspector(): void;
  getEffectiveVisibility(id: string): {
    visible: boolean;
    reason: "visible" | "group" | "layer" | "item" | "filter" | "channel" | "unknown-entity";
  };
}

export const YearPlanner: ForwardRefExoticComponent<
  YearPlannerProps & RefAttributes<YearPlannerHandle>
>;
```

`unknown-entity` is an additive handle reason for an ID absent from the model;
the six RD-04 reasons remain the valid-data contract. `showAll` clears hidden
groups, layers and items but keeps hidden channels. `showItem`/`showLayer` use
the RD-04 reducer, so a hidden ancestor still wins.

`display.theme` accepts a known preset name (applies that preset) or an
unknown string (sets `data-yp-theme` only and relies on host CSS).

`touchEditing` and `marquee` are accepted and validated but are no-ops in
RD-06; RD-07 owns their behavior. `connectorMode: "edge-path"` emits
`INVALID_RENDERER_OPTION` and renders no connectors until the SVG plane exists.

## Root composition

```text
<div data-yp-part="root" data-yp-theme data-yp-density class="yp-root" dir="ltr" style={vars + style}>
  <div data-yp-part="viewport" ref={viewportRef} class="yp-viewport">
    <div class="yp-grid" role="grid" aria-rowcount aria-colcount="37">
      <Header row>  band + 37 weekday headers + band  </Header>
      <MonthRow> x N
      <Footer row> band + 37 weekday headers + band </Footer>
    </div>
    <TooltipOverlay />
  </div>
  <Inspector />
  <PrintPages aria-hidden />
</div>
```

`Header`/`Footer` use `position: sticky` inside the viewport. The viewport has
`overflow: auto`; its height is host-controlled (`style` or CSS), default
`max-height: none`. No scrollbar is created when the host does not constrain it.
The two mirrored month bands are presentational grid tracks; `aria-colcount=37`
counts only the 37 day columns.

### Grid geometry

- Columns: `monthBandWidth` + 37 day widths + `monthBandWidth`; all multiplied
  by the effective zoom. Theme geometry tokens or the additive `units` prop set
  the base widths (`units` wins; tested).
- Row height: `max(layout.rowHeight, visibleLaneCount * laneHeight + 18)` × zoom,
  where 18 is the internal lane top. `laneTop` is not a public option.
- Each row uses `grid-template-columns` with explicit pixel widths so weekend
  and weekday widths differ.
- The item layer is absolutely positioned over the day-plane area
  (`left: monthBandWidth * zoom`, width `totalDayWidth * zoom`) with
  `pointer-events: none`; proxies re-enable pointer events.
- Blank slots render as `aria-hidden` cells without dates.
- Minimum column width is the base weekend width × 0.75 (30 px at defaults);
  lower zoom is clamped, so columns never fall below it.

### Zoom, scroll and pointer mapping

- Effective zoom = clamp(`display.zoom ?? 1`, 0.75, 1.5); invalid values emit
  one `INVALID_RANGE` diagnostic.
- All design-unit coordinates (bands, cells, row heights, fragment x/y/width/
  height) are multiplied by zoom in one `geometry.ts` helper.
- `scrollToDate` finds the date cell and sets `viewport.scrollLeft` so the cell
  is centered; no `scrollIntoView` dependency.
- `ResizeObserver` on the viewport increments a geometry version. It is created
  in `useEffect` and guarded for SSR/jsdom.
- Pointer-coordinate helpers (used by tests and RD-07):

```ts
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

export function pointToFragment(
  ribbons: RibbonLayout,
  point: { clientX: number; clientY: number },
  view: ViewGeometry,
): RibbonHitEntry | undefined;

export function pointToDate(
  layout: YearLayout,
  point: { clientX: number; clientY: number },
  view: ViewGeometry,
): DateKey | undefined;
```

Both helpers subtract the viewport rect and scroll offsets, then subtract the
month-band x offset (`monthBandWidth * zoom`) and the row-top y offset
(cumulative row tops plus `headerHeight`), and finally divide by zoom before
hit-testing. A literal implementation missing either offset would shift hits by
70 px (band) or one row height. Both are tested at 0.75/1.0/1.5 with a non-zero
scroll and header.

### Option validation

Before core calls, the view validates and falls back:

| Option | Invalid behavior |
|---|---|
| `zoom` | clamp 0.75–1.5; `INVALID_RANGE` |
| `density` | fall back to `compact`; `INVALID_COMMAND` |
| `compactMaxLanes` | fall back to 3; `INVALID_COMMAND` |
| `laneHeight` | fall back to 18; `INVALID_COMMAND` |
| `displayTimeZone` | fall back to `UTC`; `INVALID_TIMEZONE` |
| `locale` | fall back to `en-US`; `INVALID_LOCALE` |
| `print` options | fall back to default plan; `INVALID_PRINT_OPTIONS` |

No invalid host option may throw during render or SSR.

### Labels

- `Intl.DateTimeFormat(locale, { month: "short", calendar: "gregory", timeZone: "UTC" })`
  for month names.
- Weekday labels: `{ weekday: "short" }` in UTC, derived from a known
  Saturday-first week.
- Date numbers: `Intl.NumberFormat(locale).format(day)`.
- ISO week numbers use `isoWeekOf` and render in screen and print views when
  `showISOWeekNumbers` is true.
- Default locale `en-US`; default zone `UTC`.
- A locale that produces an invalid formatter falls back to `en-US` and emits
  one `INVALID_LOCALE` diagnostic.
- `dir="ltr"` is explicit in R1.

### SSR and hydration

- No `window`, `document`, `ResizeObserver` or `matchMedia` access during render.
- All defaults are explicit (`en-US`, `UTC`, `classic-blue`).
- `useId` supplies stable IDs for the tooltip/overflow popover.
- `useEffect` attaches observers only after mount.
- `src/index.ts` starts with `"use client";` so hook-using components can be
  imported from a client boundary in RSC bundlers. Consumers may still wrap it.
- A node-environment `renderToString` test and a jsdom hydration test with a
  `console.error` spy prove no mismatch.

## Error state

- Missing year/range or invalid layout: render `data-yp-part="empty"` with
  `role="status"`, the first diagnostic message, and `renderEmpty()` content
  when supplied. No guessed year.
- Diagnostic forwarding: layout, validation, zoom and command diagnostics call
  `onDiagnostic` exactly once per unique code+message per render. React state
  updates never occur during render.

## Testing Requirements

- 14/36-month rows, 37 cells, mirrored bands, `aria-colcount=37`, ISO weeks.
- Missing range empty state.
- Zoom 0.75/1.0/1.5 geometry and clamp; minimum column width.
- Locale month/weekday/date formatting; invalid locale fallback.
- `displayTimeZone` timed projection and invalid-zone fallback.
- SSR `renderToString`, hydration without console errors.
- `scrollToDate`/`focusDate` browser test; point-to-date/fragment at each zoom.
- `ResizeObserver` invalidation does not throw when unavailable.
- Two instances isolate themes and IDs; `dir="ltr"`.
- `connectorMode: "edge-path"` diagnostic and no connectors.

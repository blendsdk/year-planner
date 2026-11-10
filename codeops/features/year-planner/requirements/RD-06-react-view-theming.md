# RD-06: React View, Theming and Style Integration

> **Document**: RD-06-react-view-theming.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-03, RD-04, RD-05
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Owns the React rendering surface: the calendar grid, labels, headers, shape
plane, item proxies, annotation layer, inspector, theming tokens, custom render
slots and integration with host design systems such as Fluent UI v9 and MUI.

The visual plane is replaceable, but the interaction and accessibility shells
are owned by the component. Custom renderers decorate content; they do not
replace hit-testing, focus or geometry.

---

## Functional Requirements

### Must Have

- [ ] Export `<YearPlanner />` with the exact public props in Technical
  Requirements, including controlled and uncontrolled items/visibility/selection.
- [ ] Default HTML/CSS Grid renderer: 39 columns including two month bands,
  transparent cell layer, background layer, date/week labels, item proxies and
  overlays.
- [ ] The optional SVG shape/connector renderer is selected only after the M0
  evidence gate in RD-05; the public API must not expose an unstable renderer
  switch.
- [ ] A scroll container with sticky headers, horizontal scrolling, zoom
  **0.75–1.5**, minimum column widths and a `scrollToDate` handle. Pointer
  coordinates map through scroll/zoom/`getBoundingClientRect`; a
  `ResizeObserver` invalidates geometry.
- [ ] Theming through CSS custom properties with a `--yp-` prefix and
  `@layer year-planner.base, theme, components, overrides`.
- [ ] `createTheme(tokens)` returns a typed theme; `YearPlannerProvider` is
  optional; CSS variables work without React context.
- [ ] Presets: `classic-blue`, `classic-yellow`, `modern`, `high-contrast`,
  `print`.
- [ ] Consumers can override via `className`, `style`, `cssVars`, stable
  `data-yp-part` attributes and slot components.
- [ ] `unstyled` keeps structural CSS but removes decorative defaults.
- [ ] `getDateMeta(date)` returns optional `{ holiday, label, background, color,
  className, style, disabled, ariaLabel, content }`; custom cell
  backgrounds/text and official holidays are host data.
- [ ] Render slots: `renderCell`, `renderItem`, `renderAnnotation`,
  `renderOverflow`, `renderEmpty`, `renderInspector`, `renderTooltip` and
  `components` for structural parts. `renderLoading`/`renderError` are not in R1.
- [ ] A component-owned inspector/item list:
  - opens when an item is selected or `showInspector` is true;
  - lists selected item details, effective visibility, editability and actions;
  - lists overflow items for the active row;
  - is keyboard reachable without traversing the grid;
  - can be hidden with `showInspector={false}` and replaced via
    `renderInspector`.
- [ ] Item fragment DOM uses a wrapper with a focusable proxy. The proxy is a
  `role="button"` element **without nested interactive controls**; resize handles
  are siblings inside the wrapper; Fluent/MUI actions live in the inspector.
  Use `aria-pressed` for selection, not `aria-selected` on a button.
- [ ] A tooltip contract: default tooltip shows title and date span for visible
  items; `renderTooltip` can replace content; hidden items never appear.
- [ ] Fluent UI v9 adapter maps Fluent theme tokens to planner CSS variables;
  MUI adapter is optional; neither is a hard dependency. Adapter packages are
  declared as optional peers.
- [ ] Labels use `Intl.DateTimeFormat` with explicit `locale` (default
  `en-US`) and **`calendar: 'gregory'`**; month names, weekday names and date
  numbers are localized. The grid remains Saturday-first in R1.
- [ ] `displayTimeZone` (default `UTC`) controls projection of timed periods and
  date labels; SSR uses the same explicit values.
- [ ] Multiple planner instances isolate CSS and SVG/defs IDs.
- [ ] No global resets, no `!important`, no runtime CSS-in-JS dependency.
- [ ] The component is SSR-safe: no `window`/`document` during render; the React
  entry declares a client-component boundary where the bundler requires it.
- [ ] CSP policy is documented: CSS variables and `style`/`cssVars` use inline
  style attributes, so hosts need a `style-src-attr` allowance (or nonce
  strategy). Untrusted metadata must not supply `style`, URLs or CSS.
- [ ] Layer identity is conveyed by label/pattern/legend, not color alone. Host
  colors are host responsibility for contrast.

### Should Have

- [ ] A `data-yp-theme` attribute and CSS variables for per-instance themes.
- [ ] Fluent/MUI example stories and a documented token mapping table.
- [ ] `dir="ltr"` explicit in R1; RTL deferred.

### Won't Have (Out of Scope)

- A mandatory Fluent/MUI peer dependency.
- Full headless primitive composition in R1.
- Loading/error provider states, RTL, configurable week start, aggregated
  density.
- Shadow DOM isolation — CSS layers and prefixing are the contract.
- Raw HTML injection or `dangerouslySetInnerHTML`.

---

## Technical Requirements

### Public props (exact shape)

```ts
interface YearPlannerProps {
  /** Required unless `range` is supplied. `range` wins if both are supplied. */
  year?: number;
  contextMonths?: { before: number; after: number }; // default { before: 1, after: 1 }
  range?: { start: { year: number; month: number }; monthCount: number };
  highlightYear?: number;
  items?: PlannerItem[];
  defaultItems?: PlannerItem[];
  onItemsChange?: (items: PlannerItem[]) => void;
  groups?: LayerGroup[];
  layers?: PlannerLayer[];
  resources?: Resource[];
  annotations?: PlannerItem[]; // kind: 'annotation'
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
  interaction?: {
    mode?: InteractionMode;
    touchEditing?: 'auto' | 'on' | 'off';
    marquee?: 'items' | 'dates';
    createDefaults?: { kind: ItemKind; layerId: string };
    paintDefaults?: PaintDefaults;
    createId?: () => string;
    confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>; // default: window.confirm; if unavailable, reject with CONFIRMATION_UNAVAILABLE
    commandTimeoutMs?: number; // default 15000
    requestId?: () => string;
  };
  display?: {
    density?: 'compact' | 'expanded';
    theme?: string;
    showISOWeekNumbers?: boolean;
    showAnnotations?: boolean;
    compactMaxLanes?: number;
    connectorMode?: 'none' | 'edge-path';
    zoom?: number;
    locale?: string;
    displayTimeZone?: string;
  };
  print?: { page: 'A3'; mode: 'paginate' | 'fit'; rowsPerPage?: number };
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
  showInspector?: boolean; // default true
}

function createTheme(theme: Partial<YearPlannerTheme>): YearPlannerTheme;

const YearPlannerProvider: FC<{
  theme?: YearPlannerTheme;
  children: ReactNode;
}>;
```

`YearPlanner` is exported with `forwardRef<YearPlannerHandle, YearPlannerProps>`;
React 18.2 consumers receive the same handle type. A missing `year`/`range`
renders an empty diagnostic state (`MISSING_RANGE`), not a guessed year.
Controlled props win over defaults; supplying both `items` and `defaultItems`
logs a development warning and ignores `defaultItems`.

### Defaults

| Prop | Default |
|---|---|
| `contextMonths` | `{ before: 1, after: 1 }` (14 months) |
| `interaction.mode` | `auto` |
| `interaction.touchEditing` | `auto` |
| `interaction.marquee` | `items` |
| `display.density` | `compact` |
| `display.theme` | `classic-blue` |
| `display.zoom` | `1` |
| `display.locale` | `en-US` |
| `display.displayTimeZone` | `UTC` |
| `display.showISOWeekNumbers` | `true` |
| `display.showAnnotations` | `true` |
| `showInspector` | `true` |
| `readOnly` | `false` |

Paint uses `activeLayerId` as the command `layerId`; `paintDefaults` never
contains a layer ID. If `activeLayerId` is missing, not a highlight layer, or
does not match the target, `INVALID_PAINT_TARGET` is emitted.

### Handle

```ts
interface YearPlannerHandle {
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
  getEffectiveVisibility(id: string): { visible: boolean; reason: 'visible' | 'group' | 'layer' | 'item' | 'filter' | 'channel' };
}
```

### Slot and theme types

```ts
interface YearPlannerSlotProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type YearPlannerSlot = ComponentType<YearPlannerSlotProps>;

interface YearPlannerComponents {
  Root?: YearPlannerSlot;
  Header?: YearPlannerSlot;
  Footer?: YearPlannerSlot;
  MonthLabel?: YearPlannerSlot;
  WeekdayHeader?: YearPlannerSlot;
  DayCell?: YearPlannerSlot;
  ItemFragment?: YearPlannerSlot;
  Inspector?: YearPlannerSlot;
  Tooltip?: YearPlannerSlot;
}

interface DateMetaContext {
  isWeekend: boolean;
  isContextMonth: boolean;
  itemIds: readonly string[]; // effectively visible items only
}

interface DateMeta {
  holiday?: boolean;
  label?: string;
  background?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  ariaLabel?: string;
  content?: ReactNode;
}

interface CellRenderContext {
  date: DateKey;
  year: number;
  monthIndex: number;
  columnIndex: number;
  isWeekend: boolean;
  isContextMonth: boolean;
  itemIds: readonly string[];
}

interface ItemRenderContext {
  item: PlannerItem;
  fragment: RibbonFragment;
  fragmentIndex: number;
  fragmentCount: number;
  selected: boolean;
  readOnly: boolean;
}

interface AnnotationRenderContext {
  item: PlannerItem;
  fragment: RibbonFragment;
}

interface OverflowRenderContext {
  row: MonthRowLayout;
  hiddenCount: number;
  items: readonly PlannerItem[];
}

interface InspectorActions {
  close(): void;
  focusItem(id: string): void;
  requestCommand(command: PlannerCommand): void; // same validation/read-only pipeline as pointer edits
  retry?(): void;   // retry last rejected/timed-out command where safe
  dismiss?(): void; // dismiss the feedback message
}

interface InspectorRenderContext {
  selection: PlannerSelection;
  items: readonly PlannerItem[];
  actions: InspectorActions;
}

interface TooltipRenderContext {
  item: PlannerItem;
  fragment?: RibbonFragment;
}

type YearPlannerTokenName =
  | 'surface' | 'surfaceMuted' | 'weekend' | 'context' | 'border'
  | 'textPrimary' | 'textMuted' | 'textInverse'
  | 'focusRing' | 'selectionFill' | 'selectionOutline'
  | 'highlight' | 'ribbon' | 'annotation' | 'foreground'
  | 'rowHeight' | 'laneHeight' | 'monthBandWidth' | 'weekendWidth' | 'weekdayWidth'
  | 'fontFamily' | 'fontSize' | 'fontWeight' | 'printScale';

interface YearPlannerTheme {
  [K in YearPlannerTokenName]: string | number;
}
```

### Layer stack (default HTML renderer)

```text
z0 background grid: weekend/context tints, grid lines
z1 optional SVG shape plane: highlights, ribbons, annotations, connectors
z2 cell layer: transparent cells, date numbers, ISO weeks, ARIA/focus
z3 item fragment wrappers: focusable proxy + sibling handles + content
z4 overlay: marquee, tooltip, diagnostics
```

### Fragment DOM contract

```html
<div data-yp-part="item-fragment" data-item-id="..." data-fragment-index="0">
  <!-- Only the active proxy in the roving group has tabindex="0"; others use -1. -->
  <div role="button" tabindex="0" aria-pressed="false" aria-label="...">...</div>
  <button data-yp-part="resize-start" tabindex="-1" aria-label="Resize start"></button>
  <button data-yp-part="resize-end" tabindex="-1" aria-label="Resize end"></button>
</div>
```

No interactive element may be nested inside the focusable proxy. Tab enters the
proxy group once; arrow keys move within it. Resize handles are not tab stops;
keyboard resize is provided by the inspector's requestCommand action.

### Theme tokens

| Group | Examples |
|---|---|
| Surface | background, surface, weekend, context, border |
| Text | primary, muted, inverse, date number |
| Selection | fill, outline, focus ring |
| Channels | highlight, ribbon, annotation, foreground |
| Geometry | row height, lane height, month band, weekend/weekday width |
| Typography | family, size, weight |
| Print | page size, scale, color adjustment |

### CSS contract

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;

:where(.yp-root) {
  --yp-surface: #fff;
  --yp-weekend: #e3f7fc;
  --yp-ribbon: #8358c6;
}
```

### Framework adapters

- `@blendsdk/react-year-planner/adapters/fluent`: accepts a Fluent v9 theme or
  tokens and returns planner CSS variables; no `@fluentui/react-components`
  import in the core entry.
- `@blendsdk/react-year-planner/adapters/mui`: accepts an MUI palette and
  returns planner CSS variables.
- Adapters are tree-shakable subpaths and declare optional peers in
  `peerDependenciesMeta`.

### Complexity

Grid/labels/cells: **M**. Theming/tokens: **M**. Slots/customization: **L**.
Framework adapters: **S**. Inspector/tooltip: **M**.

---

## Integration Points

- Shared `PlannerSelection`, `PlannerFilter`, `PlannerCommand`,
  `CommandContext`, `CommandOutcome`, `Diagnostic` and `ValidationResult` types
  are defined in RD-04; this RD imports them as types. The implementation order
  remains RD-04 → RD-06 → RD-07 → RD-08, so this is not a circular runtime
  dependency.
- RD-03 supplies rows, dates, labels and geometry.
- RD-04 supplies visibility, annotations and item metadata.
- RD-05 supplies fragment descriptors and print rules.
- RD-07 supplies selection and preview state.
- RD-09 owns semantic roles, focus and announcements.
- RD-11 owns Storybook stories and theming documentation.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Styling | CSS-in-JS, CSS modules, CSS variables | CSS variables + CSS modules | No runtime dependency; host override friendly | AR #15 |
| Design system | Fluent/MUI mandatory, optional adapters | Optional adapters | Preserve host choice; Fluent first | AR #33 |
| Custom cells | Replace hit surface, decorate | Decorate | Protects interaction and accessibility | AR #16 |
| Inspector | Host-only, component-owned | Component-owned + slot | Accessibility and command ACs need it | AR #49 |
| Loading/error | Slots, defer | Defer | Provider states not in R1 | AR #49 |
| Proxy pattern | Nested button, wrapper + proxy | Wrapper + proxy | Avoids nested interactive controls | AR #50 |
| Locale | Host default, explicit prop | `en-US` + Gregorian | SSR determinism | AR #51 |
| CSP | Claim safe, document allowance | Document `style-src-attr` | Honest policy | AR #52 |
| Renderer | HTML/SVG fixed, evidence | Spike decides | Avoid irreversible coupling | AR #11, #57 |

---

## Security Considerations

- **Data sensitivity**: Render slots may receive business-sensitive item data;
  the component does not log it. Hidden items are never passed to slots.
- **Input validation**: Host metadata and styles are treated as untrusted; no
  raw HTML injection. `style`/`cssVars` are trusted host input; untrusted
  metadata cannot supply them.
- **Authentication & authorization**: Host-owned; hidden items are not rendered.
- **Injection risks**: React escaping for text; no `dangerouslySetInnerHTML`; no
  `eval`; no remote URLs in untrusted style values. CSP policy documented.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] Switching `classic-blue` to `classic-yellow` changes only theme tokens;
   layout geometry and dates are identical.
2. [ ] A consumer override of `--yp-ribbon` changes ribbon color without
   editing package CSS.
3. [ ] A Fluent UI v9 Button renders in a cell and in the inspector; an MUI
   Button renders in a cell; no button is nested inside an item proxy.
4. [ ] A host-supplied holiday annotation or `getDateMeta` renders custom
   background, text and label; no holiday is invented when no data is supplied.
   When both are present, `getDateMeta` supplies the base cell background/text
   and the annotation overlays its label/fill; annotation priority orders
   annotations only. A `disabled` date is not selectable and exposes
   `aria-disabled`.
5. [ ] `unstyled` removes decorative colors/borders but keeps structure,
   keyboard focus and print geometry.
6. [ ] No global reset or unscoped element selector is emitted; all component
   selectors are scoped.
7. [ ] Two planner instances with different themes render independently and
   have unique SVG/defs IDs if SVG is enabled.
8. [ ] `renderCell` can add content but cannot remove the date cell's hit
   surface or ARIA label.
9. [ ] `renderItem` can add content but cannot remove the proxy's focus/hit
   surface; resize handles remain siblings.
10. [ ] SSR renders the grid and labels without touching `window`/`document`;
    server/client locale differences do not cause a hydration mismatch.
11. [ ] A strict-CSP host with the documented `style-src-attr` allowance renders
    themes; no remote style URL is executed from untrusted metadata.
12. [ ] Print theme preserves month labels, weekends, ribbons and ISO weeks.
13. [ ] Scroll/zoom at 0.75, 1.0 and 1.5 keeps hit-testing aligned; resizing the
    container invalidates geometry; `scrollToDate` works.
14. [ ] Uncontrolled `defaultItems` renders and `onItemsChange` fires on local
    edits; controlled `items` never mutate without a host update.
15. [ ] The inspector lists selected item details and overflow items, is
    keyboard reachable and closes/opens with `showInspector`.
16. [ ] The inspector exposes retry for a rejected/timed-out command where safe
    and dismiss for the feedback message; both are keyboard reachable.
17. [ ] Inspector move/resize/paint/create/delete actions and external
    `requestCommand` calls use the same validation/read-only pipeline as pointer
    edits; a read-only item is rejected with `READ_ONLY`.
18. [ ] Security requirements verified: no raw HTML, no CSS injection from
    untrusted metadata, hidden items absent from render slots.

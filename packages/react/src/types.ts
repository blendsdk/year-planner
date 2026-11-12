import type {
  ClassicYearUnits,
  CommandContext,
  CommandOutcome,
  DateKey,
  Diagnostic,
  InteractionMode,
  ItemKind,
  LayerGroup,
  MonthRowLayout,
  PaintDefaults,
  PlannerCommand,
  PlannerFilter,
  PlannerItem,
  PlannerLayer,
  PlannerPeriod,
  PlannerSelection,
  Resource,
  RibbonFragment,
  ValidationResult,
  VisibilityState,
} from "@blendsdk/year-planner-core";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { YearPlannerTheme, YearPlannerThemeName } from "./theme.js";

/**
 * Configuration for interaction features. Gesture behavior is supplied by the interaction layer.
 * @public
 */
export interface InteractionConfig {
  /** Active interaction mode; defaults to `auto`. */
  mode?: InteractionMode;
  /** Touch editing policy; `"auto"` stays scroll-first until the host sets `"on"`. */
  touchEditing?: "auto" | "on" | "off";
  /** Marquee interpretation; defaults to item intersection. */
  marquee?: "items" | "dates";
  /** Defaults for inspector-created items. */
  createDefaults?: {
    /** Item kind for a newly created item. */
    kind: ItemKind;
    /** Layer that receives a newly created item. */
    layerId: string;
  };
  /** Defaults for painted highlights. */
  paintDefaults?: PaintDefaults;
  /** Double-click action; defaults to `inspect`. */
  doubleClick?: "inspect" | "none";
  /** Factory for new item IDs; defaults to UUID/monotonic. */
  createId?: () => string;
  /** Confirmation hook for destructive commands. */
  confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>;
  /** Command timeout in milliseconds; defaults to 15000. */
  commandTimeoutMs?: number;
  /** Factory for request IDs. */
  requestId?: () => string;
}

/**
 * Display configuration for the calendar.
 * @public
 */
export interface DisplayConfig {
  /** Lane density; defaults to `compact`. */
  density?: "compact" | "expanded";
  /** Preset name or host theme hook; defaults to `classic-blue`. */
  theme?: YearPlannerThemeName | string;
  /** Render ISO week numbers; defaults to true. */
  showISOWeekNumbers?: boolean;
  /** Render annotation fragments; defaults to true. */
  showAnnotations?: boolean;
  /** Compact visible-lane limit; defaults to 3. */
  compactMaxLanes?: number;
  /** Connector mode; R1 accepts only `none`. */
  connectorMode?: "none" | "edge-path";
  /** Zoom from 0.75 to 1.5; defaults to 1. */
  zoom?: number;
  /** Locale for labels; defaults to `en-US`. */
  locale?: string;
  /** IANA zone for timed projection; defaults to `UTC`. */
  displayTimeZone?: string;
}

/**
 * Print configuration.
 * @public
 */
export interface PrintConfig {
  /** Page size; A3 is the only R1 baseline. */
  page?: "A3";
  /** Paginate by rows or fit all rows on one page. */
  mode?: "paginate" | "fit";
  /** Maximum rows per page, 1-14. */
  rowsPerPage?: number;
}

/**
 * Backwards-compatible display alias.
 * @public
 */
export type YearPlannerDisplay = DisplayConfig;

/**
 * Backwards-compatible print alias.
 * @public
 */
export type YearPlannerPrint = PrintConfig;

/**
 * Property bag for a structural slot.
 * @public
 */
export interface YearPlannerSlotProps {
  /** Extra class names. */
  className?: string;
  /** Extra inline styles. */
  style?: CSSProperties;
  /** Slot content. */
  children?: ReactNode;
}

/**
 * A structural slot component.
 * @public
 */
export type YearPlannerSlot = ComponentType<YearPlannerSlotProps>;

/**
 * Replaceable structural wrappers. They wrap inner content, not semantics.
 * @public
 */
export interface YearPlannerComponents {
  /** Outer planner wrapper. */
  Root?: YearPlannerSlot;
  /** Header above the grid. */
  Header?: YearPlannerSlot;
  /** Footer below the grid. */
  Footer?: YearPlannerSlot;
  /** Month-label cell. */
  MonthLabel?: YearPlannerSlot;
  /** Weekday header cell. */
  WeekdayHeader?: YearPlannerSlot;
  /** Day cell wrapper. */
  DayCell?: YearPlannerSlot;
  /** Item proxy wrapper. */
  ItemFragment?: YearPlannerSlot;
  /** Inspector aside wrapper. */
  Inspector?: YearPlannerSlot;
  /** Tooltip wrapper. */
  Tooltip?: YearPlannerSlot;
}

/**
 * Context passed to `getDateMeta`.
 * @public
 */
export interface DateMetaContext {
  /** Whether the date is a weekend slot. */
  isWeekend: boolean;
  /** Whether the date belongs to a context month. */
  isContextMonth: boolean;
  /** Effectively visible item IDs touching the date. */
  itemIds: readonly string[];
}

/**
 * Host-provided presentation for one date cell.
 * @public
 */
export interface DateMeta {
  /** Marks a holiday without inventing a label or color. */
  holiday?: boolean;
  /** Small visible cell label. */
  label?: string;
  /** Base cell background. */
  background?: string;
  /** Base cell text color. */
  color?: string;
  /** Extra cell class. */
  className?: string;
  /** Extra cell style (trusted host input). */
  style?: CSSProperties;
  /** Removes the date from focus and selection. */
  disabled?: boolean;
  /** Replaces the cell accessible name. */
  ariaLabel?: string;
  /** Additive cell content. */
  content?: ReactNode;
}

/**
 * Context passed to `renderCell`.
 * @public
 */
export interface CellRenderContext extends DateMetaContext {
  /** Calendar date of the cell. */
  date: DateKey;
  /** Calendar year of the cell. */
  year: number;
  /** Zero-based month index of the cell. */
  monthIndex: number;
  /** Zero-based column index in the 37-column row. */
  columnIndex: number;
}

/**
 * Context passed to `renderItem`.
 * @public
 */
export interface ItemRenderContext {
  /** Item being rendered or described. */
  item: PlannerItem;
  /** Ribbon fragment clipped to the current month row. */
  fragment: RibbonFragment;
  /** Zero-based index of this fragment. */
  fragmentIndex: number;
  /** Number of fragments for the item in this month row. */
  fragmentCount: number;
  /** Whether the item is selected. */
  selected: boolean;
  /** Whether editing is blocked for the item. */
  readOnly: boolean;
}

/**
 * Context passed to `renderAnnotation`.
 * @public
 */
export interface AnnotationRenderContext {
  /** Item being rendered or described. */
  item: PlannerItem;
  /** Ribbon fragment clipped to the current month row. */
  fragment: RibbonFragment;
}

/**
 * Context passed to `renderOverflow`.
 * @public
 */
export interface OverflowRenderContext {
  /** Month row that owns the context. */
  row: MonthRowLayout;
  /** Number of items hidden by compact density. */
  hiddenCount: number;
  /** Items hidden by the compact lane limit in this row. */
  items: readonly PlannerItem[];
}

/**
 * Actions exposed to a custom inspector.
 * @public
 */
export interface InspectorActions {
  /** Closes the inspector. */
  close(): void;
  /** Moves focus to an item proxy. */
  focusItem(id: string): void;
  /** Routes a command through the command pipeline. */
  requestCommand(command: PlannerCommand): void;
  /** Retries the last failed request, when available. */
  retry?(): void;
  /** Dismisses the current notice, when available. */
  dismiss?(): void;
}

/**
 * Context passed to `renderInspector`.
 * @public
 */
export interface InspectorRenderContext {
  /** Current selection. */
  selection: PlannerSelection;
  /** Selected items that are currently visible. */
  items: readonly PlannerItem[];
  /** Actions available to the custom body. */
  actions: InspectorActions;
}

/**
 * Context passed to `renderTooltip`.
 * @public
 */
export interface TooltipRenderContext {
  /** Item being rendered or described. */
  item: PlannerItem;
  /** Ribbon fragment clipped to the current month row. */
  fragment?: RibbonFragment;
}

/**
 * Imperative handle exposed by `YearPlanner`.
 * @public
 */
export interface YearPlannerHandle {
  /** Shows a group. */
  showGroup(id: string): void;
  /** Hides a group and its descendants. */
  hideGroup(id: string): void;
  /** Toggles a group. */
  toggleGroup(id: string): void;
  /** Shows a layer. */
  showLayer(id: string): void;
  /** Hides a layer. */
  hideLayer(id: string): void;
  /** Shows an item. */
  showItem(id: string): void;
  /** Hides an item. */
  hideItem(id: string): void;
  /** Shows every group, layer and item; hidden render channels stay hidden. */
  showAll(): void;
  /** Replaces the filter. */
  setFilter(filter: PlannerFilter): void;
  /** Selects a date range. */
  selectRange(interval: { startDate: DateKey; endDateExclusive: DateKey }): void;
  /** Clears the selection. */
  clearSelection(): void;
  /** Moves focus to an item proxy. */
  focusItem(id: string): void;
  /** Moves focus to a date cell. */
  focusDate(date: DateKey): void;
  /** Scrolls a date into view. */
  scrollToDate(date: DateKey): void;
  /** Changes the interaction mode. */
  setInteractionMode(mode: InteractionMode): void;
  /** Routes a command through the command pipeline. */
  requestCommand(command: PlannerCommand): void;
  /** Reverts the last local change; controlled item lists delegate undo to the host. */
  requestUndo(): void;
  /** Reapplies the last undone local change; controlled item lists delegate redo to the host. */
  requestRedo(): void;
  /** Opens the inspector. */
  openInspector(): void;
  /** Resolves the effective visibility of an item. */
  getEffectiveVisibility(id: string): {
    /** Whether the item is effectively visible. */
    visible: boolean;
    /** Rule that decided the visibility. */
    reason: "visible" | "group" | "layer" | "item" | "filter" | "channel" | "unknown-entity";
  };
}

/**
 * Public props for `YearPlanner`.
 * @public
 */
export interface YearPlannerProps {
  /** Display year; required unless `range` is supplied. */
  year?: number;
  /** Context months before/after; defaults to 1/1. */
  contextMonths?: {
    /** Context months before the year; defaults to 1. */
    before: number;
    /** Context months after the year; defaults to 1. */
    after: number;
  };
  /** Explicit range; wins over `year`. */
  range?: {
    /** First month of the explicit window. */
    start: {
      /** Calendar year of the first month. */
      year: number;
      /** Zero-based month index (0 = January). */
      month: number;
    };
    /** Number of months in the window; 12-36. */
    monthCount: number;
  };
  /** Year highlighted as current. */
  highlightYear?: number;
  /** Additive layout units; wins over theme geometry. */
  units?: Partial<ClassicYearUnits>;
  /** Controlled items. */
  items?: PlannerItem[];
  /** Uncontrolled initial items. */
  defaultItems?: PlannerItem[];
  /** Called after a local item change. */
  onItemsChange?: (items: PlannerItem[]) => void;
  /** Layer groups. */
  groups?: LayerGroup[];
  /** Layers. */
  layers?: PlannerLayer[];
  /** Resources. */
  resources?: Resource[];
  /** Annotation items merged into the item namespace. */
  annotations?: PlannerItem[];
  /** Controlled visibility. */
  visibility?: VisibilityState;
  /** Uncontrolled initial visibility. */
  defaultVisibility?: VisibilityState;
  /** Called when visibility would change. */
  onVisibilityChange?: (next: VisibilityState) => void;
  /** Controlled selection. */
  selection?: PlannerSelection;
  /** Uncontrolled initial selection. */
  defaultSelection?: PlannerSelection;
  /** Called when selection would change. */
  onSelectionChange?: (next: PlannerSelection) => void;
  /** Controlled filter. */
  filter?: PlannerFilter;
  /** Uncontrolled initial filter. */
  defaultFilter?: PlannerFilter;
  /** Called when the filter would change. */
  onFilterChange?: (next: PlannerFilter) => void;
  /** Global read-only guardrail. */
  readOnly?: boolean;
  /** Optional host-wide revision token passed through with every command. */
  baseRevision?: string;
  /** Layer that accepts paint/create commands. */
  activeLayerId?: string;
  /** Interaction configuration. */
  interaction?: InteractionConfig;
  /** Display configuration. */
  display?: DisplayConfig;
  /** Print configuration. */
  print?: PrintConfig;
  /** Host validation for a proposed command. */
  validateChange?: (
    command: PlannerCommand,
    context: CommandContext,
    signal?: AbortSignal,
  ) => ValidationResult | Promise<ValidationResult>;
  /** Host command request. */
  onChangeRequest?: (
    command: PlannerCommand,
    context: CommandContext,
    signal?: AbortSignal,
  ) => CommandOutcome | Promise<CommandOutcome>;
  /** Called with an accepted outcome. */
  onChangeCommitted?: (outcome: CommandOutcome) => void;
  /** Called with a rejected outcome. */
  onChangeRejected?: (outcome: CommandOutcome) => void;
  /** Receives layout, validation and command diagnostics. */
  onDiagnostic?: (diagnostic: Diagnostic) => void;
  /** Host date presentation. */
  getDateMeta?: (date: DateKey, context: DateMetaContext) => DateMeta | undefined;
  /** Additive cell content. */
  renderCell?: ((context: CellRenderContext) => ReactNode) | undefined;
  /** Additive item content. */
  renderItem?: ((context: ItemRenderContext) => ReactNode) | undefined;
  /** Annotation content. */
  renderAnnotation?: ((context: AnnotationRenderContext) => ReactNode) | undefined;
  /** Overflow content. */
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  /** Empty state content. */
  renderEmpty?: (() => ReactNode) | undefined;
  /** Inspector content. */
  renderInspector?: ((context: InspectorRenderContext) => ReactNode) | undefined;
  /** Tooltip content. */
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
  /** Structural slot overrides. */
  components?: Partial<YearPlannerComponents>;
  /** CSS variable overrides. */
  cssVars?: Record<`--yp-${string}`, string>;
  /** Extra root class. */
  className?: string;
  /** Extra root style. */
  style?: CSSProperties;
  /** Grid accessible name. */
  ariaLabel?: string;
  /** ID of an external description. */
  ariaDescribedBy?: string;
  /** Removes decorative defaults. */
  unstyled?: boolean;
  /** Inspector visibility; defaults to true. */
  showInspector?: boolean;
}

/**
 * Resolved theme plus the theme hook name.
 * @public
 */
export interface ResolvedTheme {
  /** Resolved theme tokens. */
  theme: YearPlannerTheme;
  /** Preset or host theme name. */
  themeName: string;
  /** CSS variables produced by the theme. */
  cssVars: Record<`--yp-${string}`, string>;
}

/** A period used by command builders. */
export type { PlannerPeriod };

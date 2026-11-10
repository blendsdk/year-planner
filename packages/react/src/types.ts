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

/** Configuration for interaction features. RD-07 owns gesture behavior. */
export interface InteractionConfig {
  /** Active interaction mode; defaults to `auto`. */
  mode?: InteractionMode;
  /** Touch editing policy; accepted but inert in RD-06. */
  touchEditing?: "auto" | "on" | "off";
  /** Marquee interpretation; accepted but inert in RD-06. */
  marquee?: "items" | "dates";
  /** Defaults for inspector-created items. */
  createDefaults?: { kind: ItemKind; layerId: string };
  /** Defaults for painted highlights. */
  paintDefaults?: PaintDefaults;
  /** Factory for new item IDs; defaults to UUID/monotonic. */
  createId?: () => string;
  /** Confirmation hook for destructive commands. */
  confirmChange?: (command: PlannerCommand) => boolean | Promise<boolean>;
  /** Command timeout in milliseconds; defaults to 15000. */
  commandTimeoutMs?: number;
  /** Factory for request IDs. */
  requestId?: () => string;
}

/** Display configuration for the calendar. */
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

/** Print configuration. */
export interface PrintConfig {
  /** Page size; A3 is the only R1 baseline. */
  page?: "A3";
  /** Paginate by rows or fit all rows on one page. */
  mode?: "paginate" | "fit";
  /** Maximum rows per page, 1-14. */
  rowsPerPage?: number;
}

/** Backwards-compatible display alias. */
export type YearPlannerDisplay = DisplayConfig;

/** Backwards-compatible print alias. */
export type YearPlannerPrint = PrintConfig;

/** Property bag for a structural slot. */
export interface YearPlannerSlotProps {
  /** Extra class names. */
  className?: string;
  /** Extra inline styles. */
  style?: CSSProperties;
  /** Slot content. */
  children?: ReactNode;
}

/** A structural slot component. */
export type YearPlannerSlot = ComponentType<YearPlannerSlotProps>;

/** Replaceable structural wrappers. They wrap inner content, not semantics. */
export interface YearPlannerComponents {
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

/** Context passed to `getDateMeta`. */
export interface DateMetaContext {
  /** Whether the date is a weekend slot. */
  isWeekend: boolean;
  /** Whether the date belongs to a context month. */
  isContextMonth: boolean;
  /** Effectively visible item IDs touching the date. */
  itemIds: readonly string[];
}

/** Host-provided presentation for one date cell. */
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

/** Context passed to `renderCell`. */
export interface CellRenderContext extends DateMetaContext {
  date: DateKey;
  year: number;
  monthIndex: number;
  columnIndex: number;
}

/** Context passed to `renderItem`. */
export interface ItemRenderContext {
  item: PlannerItem;
  fragment: RibbonFragment;
  fragmentIndex: number;
  fragmentCount: number;
  selected: boolean;
  readOnly: boolean;
}

/** Context passed to `renderAnnotation`. */
export interface AnnotationRenderContext {
  item: PlannerItem;
  fragment: RibbonFragment;
}

/** Context passed to `renderOverflow`. */
export interface OverflowRenderContext {
  row: MonthRowLayout;
  hiddenCount: number;
  items: readonly PlannerItem[];
}

/** Actions exposed to a custom inspector. */
export interface InspectorActions {
  close(): void;
  focusItem(id: string): void;
  requestCommand(command: PlannerCommand): void;
  retry?(): void;
  dismiss?(): void;
}

/** Context passed to `renderInspector`. */
export interface InspectorRenderContext {
  selection: PlannerSelection;
  items: readonly PlannerItem[];
  actions: InspectorActions;
}

/** Context passed to `renderTooltip`. */
export interface TooltipRenderContext {
  item: PlannerItem;
  fragment?: RibbonFragment;
}

/** Imperative handle exposed by `YearPlanner`. */
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
  selectRange(interval: { startDate: DateKey; endDateExclusive: DateKey }): void;
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

/** Public props for `YearPlanner`. */
export interface YearPlannerProps {
  /** Display year; required unless `range` is supplied. */
  year?: number;
  /** Context months before/after; defaults to 1/1. */
  contextMonths?: { before: number; after: number };
  /** Explicit range; wins over `year`. */
  range?: { start: { year: number; month: number }; monthCount: number };
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
  ) => ValidationResult | Promise<ValidationResult>;
  /** Host command request. */
  onChangeRequest?: (
    command: PlannerCommand,
    context: CommandContext,
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
  renderCell?: (context: CellRenderContext) => ReactNode;
  /** Additive item content. */
  renderItem?: (context: ItemRenderContext) => ReactNode;
  /** Annotation content. */
  renderAnnotation?: (context: AnnotationRenderContext) => ReactNode;
  /** Overflow content. */
  renderOverflow?: (context: OverflowRenderContext) => ReactNode;
  /** Empty state content. */
  renderEmpty?: () => ReactNode;
  /** Inspector content. */
  renderInspector?: (context: InspectorRenderContext) => ReactNode;
  /** Tooltip content. */
  renderTooltip?: (context: TooltipRenderContext) => ReactNode;
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

/** Resolved theme plus the theme hook name. */
export interface ResolvedTheme {
  theme: YearPlannerTheme;
  themeName: string;
  cssVars: Record<`--yp-${string}`, string>;
}

/** A period used by command builders. */
export type { PlannerPeriod };

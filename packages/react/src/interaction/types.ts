import type {
  DateKey,
  DateMeta,
  DateMetaContext,
  Diagnostic,
  KeyboardEvent,
  PlannerState,
  PointerEvent,
  RibbonLayout,
  YearLayout,
} from "./type-imports.js";

export type {
  DateKey,
  DateMeta,
  DateMetaContext,
  Diagnostic,
  KeyboardEvent,
  PlannerState,
  PointerEvent,
  RibbonLayout,
  YearLayout,
};

/**
 * Event fields shared by planner selection clicks.
 * @public
 */
export interface SelectionClickEvent {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: EventTarget | null;
}

/**
 * The subset of planner state the interaction controller reads.
 * @public
 */
export type InteractionState = Pick<
  PlannerState,
  "model" | "visibility" | "filter" | "items" | "selection" | "setSelection" | "interactionMode"
>;

/**
 * Inputs consumed by the interaction controller.
 * @public
 */
export interface UseInteractionInput {
  state: InteractionState;
  layout: YearLayout;
  ribbons: RibbonLayout;
  pipeline: import("../commands.js").CommandPipeline;
  viewportRef: { current: HTMLDivElement | null };
  zoom: number;
  readOnly: boolean;
  activeLayerId?: string | undefined;
  interaction?: import("../types.js").InteractionConfig | undefined;
  getDateMeta?: ((date: DateKey, context: DateMetaContext) => DateMeta | undefined) | undefined;
  itemsByDate: ReadonlyMap<DateKey, readonly string[]>;
  showAnnotations: boolean;
  focusedItemId?: string | undefined;
  onFocusItem: (itemId: string) => void;
  onFocusDate: (date: DateKey) => void;
  openInspector: () => void;
  onDiagnostic?: ((entry: Diagnostic) => void) | undefined;
}

/**
 * DOM and state handlers exposed by the interaction controller.
 * @public
 */
export interface InteractionController {
  previews: readonly import("./preview.js").PreviewLayer[];
  touchAction: "none" | "auto";
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onGridKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onCellKeyDown: (date: DateKey, event: KeyboardEvent<HTMLElement>) => void;
  onItemKeyDown: (itemId: string, event: KeyboardEvent<HTMLElement>) => void;
  selectDate: (date: DateKey, event: SelectionClickEvent) => void;
  selectItem: (itemId: string, event: SelectionClickEvent) => void;
  doubleClickItem: (itemId: string) => void;
  shouldIgnoreClick: (event: { target?: EventTarget | null }) => boolean;
}

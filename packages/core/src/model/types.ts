import type { Diagnostic } from "../diagnostics.js";
import type { PlannerPeriod } from "../period.js";

/**
 * The render plane a layer belongs to.
 * @public
 */
export type RenderChannel = "background" | "highlight" | "ribbon" | "annotation" | "foreground";

/**
 * The semantic kind of a planner item.
 * @public
 */
export type ItemKind = "highlight" | "activity" | "reservation" | "annotation";

/**
 * The global interaction mode.
 * @public
 */
export type InteractionMode =
  | "inspect"
  | "select"
  | "paint"
  | "erase"
  | "create"
  | "move"
  | "resize"
  | "auto";

/**
 * Per-action edit permissions for a layer or group.
 * @public
 */
export interface LayerPolicy {
  /** Whether items may be moved. */
  allowMove?: boolean;
  /** Whether items may be resized. */
  allowResize?: boolean;
  /** Whether highlights may be painted or erased. */
  allowPaint?: boolean;
  /** Whether new items may be created. */
  allowCreate?: boolean;
  /** Whether items may be deleted. */
  allowDelete?: boolean;
}

/**
 * A named group of layers, optionally nested under another group.
 * @public
 */
export interface LayerGroup {
  /** Stable group identifier, unique among groups. */
  id: string;
  /** Human-readable group name. */
  name: string;
  /** Parent group identifier, if this group is nested. */
  parentGroupId?: string;
  /** Initial visibility when no explicit visibility state is supplied. */
  defaultVisible?: boolean;
  /** Inherited permissions for descendant layers. */
  policy?: LayerPolicy;
}

/**
 * A visual layer on one render channel.
 * @public
 */
export interface PlannerLayer {
  /** Stable layer identifier, unique among layers. */
  id: string;
  /** Human-readable layer name. */
  name: string;
  /** Group this layer belongs to, if any. */
  groupId?: string;
  /** Render plane owned by this layer. */
  channel: RenderChannel;
  /** CSS color used as the layer's base color. */
  color: string;
  /** Optional layer opacity from 0 to 1. */
  opacity?: number;
  /** Initial visibility when no explicit visibility state is supplied. */
  defaultVisible?: boolean;
  /** Whether all edits on this layer are blocked. */
  locked?: boolean;
  /** Permission-style alias for `locked`. */
  readOnly?: boolean;
  /** Per-action permissions for this layer. */
  policy?: LayerPolicy;
  /** Primary lane tie-break; lower values sort first. */
  sortOrder?: number;
  /** Secondary lane tie-break; higher values sort first. */
  displayPriority?: number;
  /** Short label used by legends and the inspector. */
  label?: string;
  /** Non-color identity pattern. */
  pattern?: "solid" | "hatch" | "dots";
}

/**
 * A resource reference attached to an item.
 * @public
 */
export interface Assignment {
  /** Identifier of the referenced resource. */
  resourceId: string;
  /** Optional role of the resource on this item. */
  role?: string;
  /** Optional assigned quantity; must be greater than zero. */
  quantity?: number;
}

/**
 * A bookable resource. R1 has no capacity engine.
 * @public
 */
export interface Resource {
  /** Stable resource identifier, unique among resources. */
  id: string;
  /** Human-readable resource name. */
  name: string;
  /** Host-defined resource type, such as `person` or `room`. */
  type: string;
  /** Optional host-owned capacity metadata. */
  capacity?: {
    /** Optional capacity quantity. */
    quantity: number;
    /** Host-defined capacity unit, such as `seats`. */
    unit: string;
  };
  /** Optional IANA time zone for the resource. */
  timeZone?: string;
}

/**
 * Optional annotation presentation data.
 * @public
 */
export interface PlannerAnnotationStyle {
  /** Short badge label, such as `OH`. */
  label?: string;
  /** Badge background color. */
  background?: string;
  /** Ordering priority for overlapping badges. */
  priority?: number;
}

/**
 * One canonical planner item.
 * @public
 */
export interface PlannerItem {
  /** Stable item identifier, unique among items and annotations. */
  id: string;
  /** Semantic kind of the item. */
  kind: ItemKind;
  /** Layer that owns the item. */
  layerId: string;
  /** Half-open period; timed periods are projected for layout. */
  period: PlannerPeriod;
  /** Optional display title. */
  title?: string;
  /** Optional item color override. */
  color?: string;
  /** Optional text color override. */
  textColor?: string;
  /** Optional host class name. */
  className?: string;
  /** Optional host style values; flat string or number records only. */
  style?: Record<string, string | number>;
  /** Optional host status used by filters. */
  status?: string;
  /** Optimistic-concurrency version; new items use `1`. */
  version: number;
  /** Whether this item's edits are blocked. */
  readOnly?: boolean;
  /** Published/pinned alias for `readOnly`. */
  locked?: boolean;
  /** Optional resource assignments. */
  assignments?: Assignment[];
  /** Optional annotation badge data. */
  annotation?: PlannerAnnotationStyle;
  /** Host metadata; never interpreted or rendered as HTML by the core. */
  metadata?: unknown;
}

/**
 * Host-side item filter.
 * @public
 */
export interface PlannerFilter {
  /** Allowlist of layer IDs; empty or absent means all layers. */
  layerIds?: string[];
  /** Allowlist of assigned resource IDs. */
  resourceIds?: string[];
  /** Allowlist of item statuses. */
  statuses?: string[];
  /** Trimmed, case-insensitive title search. */
  search?: string;
}

/**
 * Serialized visibility flags. Hidden always wins over local show.
 * @public
 */
export interface VisibilityState {
  /** IDs of hidden groups; a hidden group hides every descendant. */
  hiddenGroupIds: string[];
  /** IDs of hidden layers. */
  hiddenLayerIds: string[];
  /** IDs of locally hidden items. */
  hiddenItemIds: string[];
  /** Render channels that are hidden entirely. */
  hiddenChannels?: RenderChannel[];
}

/**
 * The canonical, validated planner model.
 * @public
 */
export interface PlannerModel {
  /** Valid layer groups. */
  groups: LayerGroup[];
  /** Valid layers. */
  layers: PlannerLayer[];
  /** Valid items and annotations. */
  items: PlannerItem[];
  /** Valid resources. */
  resources: Resource[];
}

/**
 * Raw host input accepted by the validator.
 * @public
 */
export interface PlannerDataInput {
  /** Items to validate. */
  items?: PlannerItem[];
  /** Layer groups to validate. */
  groups?: LayerGroup[];
  /** Layers to validate. */
  layers?: PlannerLayer[];
  /** Resources to validate. */
  resources?: Resource[];
  /** Annotation items merged into the item namespace. */
  annotations?: PlannerItem[];
}

/**
 * Result of validating host data. The model never contains invalid entities.
 * @public
 */
export interface PlannerDataValidation {
  /** True when no error-level diagnostic was produced. */
  ok: boolean;
  /** Valid entities in input order. */
  model: PlannerModel;
  /** Typed diagnostics for every dropped entity. */
  diagnostics: Diagnostic[];
}

/**
 * Options for validating planner data.
 * @public
 */
export interface ValidatePlannerDataOptions {
  /** IANA zone used to validate and project timed periods; defaults to UTC. */
  displayTimeZone?: string;
}

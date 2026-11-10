import type { Diagnostic } from "../diagnostics.js";
import type { PlannerPeriod } from "../period.js";

/** The render plane a layer belongs to. */
export type RenderChannel = "background" | "highlight" | "ribbon" | "annotation" | "foreground";

/** The semantic kind of a planner item. */
export type ItemKind = "highlight" | "activity" | "reservation" | "annotation";

/** The global interaction mode. */
export type InteractionMode =
  | "inspect"
  | "select"
  | "paint"
  | "erase"
  | "create"
  | "move"
  | "resize"
  | "auto";

/** Per-action edit permissions for a layer or group. */
export interface LayerPolicy {
  allowMove?: boolean;
  allowResize?: boolean;
  allowPaint?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

/** A named group of layers, optionally nested under another group. */
export interface LayerGroup {
  id: string;
  name: string;
  parentGroupId?: string;
  defaultVisible?: boolean;
  policy?: LayerPolicy;
}

/** A visual layer on one render channel. */
export interface PlannerLayer {
  id: string;
  name: string;
  groupId?: string;
  channel: RenderChannel;
  color: string;
  opacity?: number;
  defaultVisible?: boolean;
  locked?: boolean;
  readOnly?: boolean;
  policy?: LayerPolicy;
  sortOrder?: number;
  displayPriority?: number;
  label?: string;
  pattern?: "solid" | "hatch" | "dots";
}

/** A resource reference attached to an item. */
export interface Assignment {
  resourceId: string;
  role?: string;
  quantity?: number;
}

/** A bookable resource. R1 has no capacity engine. */
export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity?: { quantity: number; unit: string };
  timeZone?: string;
}

/** Optional annotation presentation data. */
export interface PlannerAnnotationStyle {
  label?: string;
  background?: string;
  priority?: number;
}

/** One canonical planner item. */
export interface PlannerItem {
  id: string;
  kind: ItemKind;
  layerId: string;
  period: PlannerPeriod;
  title?: string;
  color?: string;
  textColor?: string;
  className?: string;
  style?: Record<string, string | number>;
  status?: string;
  version: number;
  readOnly?: boolean;
  locked?: boolean;
  assignments?: Assignment[];
  annotation?: PlannerAnnotationStyle;
  metadata?: unknown;
}

/** Host-side item filter. */
export interface PlannerFilter {
  layerIds?: string[];
  resourceIds?: string[];
  statuses?: string[];
  search?: string;
}

/** Serialized visibility flags. Hidden always wins over local show. */
export interface VisibilityState {
  hiddenGroupIds: string[];
  hiddenLayerIds: string[];
  hiddenItemIds: string[];
  hiddenChannels?: RenderChannel[];
}

/** The canonical, validated planner model. */
export interface PlannerModel {
  groups: LayerGroup[];
  layers: PlannerLayer[];
  items: PlannerItem[];
  resources: Resource[];
}

/** Raw host input accepted by the validator. */
export interface PlannerDataInput {
  items?: PlannerItem[];
  groups?: LayerGroup[];
  layers?: PlannerLayer[];
  resources?: Resource[];
  annotations?: PlannerItem[];
}

/** Result of validating host data. The model never contains invalid entities. */
export interface PlannerDataValidation {
  ok: boolean;
  model: PlannerModel;
  diagnostics: Diagnostic[];
}

/** Options for validating planner data. */
export interface ValidatePlannerDataOptions {
  displayTimeZone?: string;
}

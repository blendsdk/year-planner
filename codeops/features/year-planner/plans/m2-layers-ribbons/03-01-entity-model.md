# Entity Model and Validation: M2 Layers and Ribbons

> **Document**: 03-01-entity-model.md
> **Parent**: [Index](00-index.md)

## Overview

Defines the canonical planner entities, the public input bundle and the
non-blanking validation pass that produces a normalized model. The model is
pure data and never stores DOM state.

## Architecture

### Proposed Modules

| File | Responsibility |
|---|---|
| `src/model/types.ts` | Public entity interfaces and unions |
| `src/model/validation.ts` | Collection validation, cycle detection, normalization |
| `src/model/equality.ts` | Structural equality used by validation and paint |

`types.ts` has no runtime code except the channel and kind constant arrays used
by validation. All entities remain plain JSON-compatible objects; `metadata` is
the only `unknown` field and is never interpreted by the core.

## Implementation Details

### Public types

```ts
export type RenderChannel = "background" | "highlight" | "ribbon" | "annotation" | "foreground";
export type ItemKind = "highlight" | "activity" | "reservation" | "annotation";
export type InteractionMode =
  | "inspect" | "select" | "paint" | "erase" | "create" | "move" | "resize" | "auto";

export interface LayerPolicy {
  allowMove?: boolean;
  allowResize?: boolean;
  allowPaint?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

export interface LayerGroup {
  id: string;
  name: string;
  parentGroupId?: string;
  defaultVisible?: boolean;
  policy?: LayerPolicy;
}

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

export interface Assignment {
  resourceId: string;
  role?: string;
  quantity?: number;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity?: { quantity: number; unit: string };
  timeZone?: string;
}

export interface PlannerAnnotationStyle {
  label?: string;
  background?: string;
  priority?: number;
}

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

export interface PlannerFilter {
  layerIds?: string[];
  resourceIds?: string[];
  statuses?: string[];
  search?: string;
}

export interface VisibilityState {
  hiddenGroupIds: string[];
  hiddenLayerIds: string[];
  hiddenItemIds: string[];
  hiddenChannels?: RenderChannel[];
}
```

`PlannerPeriod` and `DateInterval` come from the existing temporal core.

### Validation API

```ts
export interface PlannerDataInput {
  items?: PlannerItem[];
  groups?: LayerGroup[];
  layers?: PlannerLayer[];
  resources?: Resource[];
  annotations?: PlannerItem[];
}

export interface PlannerModel {
  groups: LayerGroup[];
  layers: PlannerLayer[];
  items: PlannerItem[];
  resources: Resource[];
}

export interface PlannerDataValidation {
  ok: boolean;
  model: PlannerModel;
  diagnostics: Diagnostic[];
}

export interface ValidatePlannerDataOptions {
  displayTimeZone?: string;
}

export function validatePlannerData(
  input: PlannerDataInput,
  options?: ValidatePlannerDataOptions,
): PlannerDataValidation;

export function emptyPlannerModel(): PlannerModel;
```

### Validation order

1. **Groups** — require non-empty string IDs and names, boolean policy fields.
   Detect duplicate IDs and unknown `parentGroupId`. Detect cycles with a
   depth-first walk over the parent links.
2. **Cycle recovery** — remove every group that participates in a cycle, then
   remove groups whose ancestor was removed. Emit one `GROUP_CYCLE` diagnostic
   per detected cycle with the involved IDs.
3. **Layers** — require valid channel, non-empty color, opacity 0–1, policy
   booleans, finite `sortOrder`/`displayPriority`, known pattern and an existing
   non-excluded group.
4. **Resources** — require non-empty ID/name/type, valid quantity and an IANA
   time zone when supplied.
5. **Items and annotations** — merge `annotations` after `items`; require a
   unique ID in the shared item namespace, a valid kind, an existing layer, a
   valid period (timed periods are projected with `displayTimeZone`, default
   `UTC`), an integer `version >= 1`, a flat style record and known assignment
   resources. The returned item keeps its original period; projection is used
   only to validate its dates.
6. **Channel pairing** — an `annotation` item must be on an
   `annotation`-channel layer; a non-annotation item may not be on an
   `annotation`-channel layer.
7. **Normalize** — the returned model contains only valid entities, in input
   order. `ok` is true when no error-level diagnostic exists.

### Error handling

| Error case | Handling | AR Ref |
|---|---|---|
| Duplicate entity ID | Drop the later duplicate, `DUPLICATE_ID` | AR-4 |
| Invalid group field | Drop group, `INVALID_GROUP` | AR-3 |
| Unknown group/layer/resource reference | Drop the dependent entity, `UNKNOWN_REFERENCE` | AR-3 |
| Group cycle | Drop cycle members and dependents, `GROUP_CYCLE` | AR-5 |
| Invalid period | Drop item, keep the RD-02 code, message names the item ID only | AR-26 |
| Invalid version | Drop item, `INVALID_VERSION` | AR-3 |
| Annotation channel mismatch | Drop item, `INVALID_ANNOTATION` | AR-14 |
| Invalid style | Drop item, `INVALID_STYLE` | AR-3 |
| Invalid layer channel/opacity | Drop layer, `INVALID_LAYER` | AR-3 |
| Invalid resource field (other than time zone) | Drop resource, `INVALID_RESOURCE` | AR-3 |
| Invalid resource time zone | Drop resource, `INVALID_TIMEZONE` | AR-3 |
| Missing required field | Drop entity, `INVALID_ITEM`/`INVALID_LAYER`/`INVALID_RESOURCE` | AR-3 |

Diagnostics never contain item titles, date values, instants, zones, resource
names or metadata (AR-26). Item-related diagnostics carry entity IDs in
`itemIds` only and use a generic message; the `periods` field is never
populated by M2. RD-02 diagnostics are wrapped: the original code is preserved,
the message becomes `Invalid period for item <id>`, and the item ID is added.
Resource-entity diagnostics may carry the resource's own ID in `resourceIds`,
never an assignment's resource ID on a hidden item.

### Code example

```ts
const result = validatePlannerData({
  groups: [{ id: "ops", name: "Operations" }],
  layers: [
    {
      id: "ops-bookings",
      name: "Bookings",
      groupId: "ops",
      channel: "ribbon",
      color: "#1d4e89",
    },
  ],
  items: [
    {
      id: "booking-1",
      kind: "activity",
      layerId: "ops-bookings",
      period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
      version: 1,
    },
  ],
});
```

## Testing Requirements

- Unit tests for every diagnostic path and the non-blanking guarantee.
- Cycle tests with two-node and three-node cycles plus a valid sibling.
- Timed-period projection in two zones.
- API report update after exports land.

# Visibility and Editability: M2 Layers and Ribbons

> **Document**: 03-02-visibility-editability.md
> **Parent**: [Index](00-index.md)

## Overview

Resolves whether an item is effectively visible and whether an action is
allowed. Both are presentation/UI guardrails, never authorization or business
occupancy.

## Architecture

| File | Responsibility |
|---|---|
| `src/model/visibility.ts` | Precedence, filters, tri-state groups, reducer, presets |
| `src/model/editability.ts` | Policy resolution, flags, mode mapping |

Both consume a validated `PlannerModel`. They never mutate it.

## Implementation Details

### Visibility API

```ts
export type VisibilityReason =
  | "visible"
  | "group"
  | "layer"
  | "item"
  | "filter"
  | "channel"
  | "unknown-entity";

export interface EffectiveVisibility {
  visible: boolean;
  reason: VisibilityReason;
}

export interface VisibilityContext {
  model: PlannerModel;
  visibility: VisibilityState;
  filter?: PlannerFilter;
}

export function getEffectiveVisibility(
  itemId: string,
  context: VisibilityContext,
): EffectiveVisibility;

export function resolveItemVisibility(
  context: VisibilityContext,
): ReadonlyMap<string, EffectiveVisibility>;

export function visibleItems(context: VisibilityContext): PlannerItem[];

export function countVisibleItems(context: VisibilityContext): number;

export function getGroupVisibility(
  groupId: string,
  context: VisibilityContext,
): "visible" | "hidden" | "mixed";

export function isLayerEffectivelyHidden(
  layerId: string,
  context: VisibilityContext,
): boolean;

export function getLayerChannel(layerId: string, context: VisibilityContext): RenderChannel | undefined;
```

`resolveItemVisibility` builds the group ancestry and layer map once and
evaluates every item. `getEffectiveVisibility` is the single-item convenience
wrapper. `unknown-entity` is an additive M2 reason for invalid IDs; the six
RD-04 reasons remain the valid-data contract.

### Visibility precedence

| Order | Check | Reason |
|---|---|---|
| 1 | Item's layer group has a hidden ancestor (including itself) | `group` |
| 2 | Layer ID is hidden | `layer` |
| 3 | Item ID is hidden | `item` |
| 4 | Filter rejects the item | `filter` |
| 5 | Layer channel is hidden | `channel` |
| — | Otherwise | `visible` |

A hidden parent always wins, so `showItem` can never override a hidden group or
layer (AR-7). Filters never mutate items or IDs.

`getGroupVisibility` returns:

- `hidden` when the group or an ancestor is hidden;
- with no descendant items: `visible` when at least one descendant layer is not
  hidden, otherwise `hidden` (AR-6);
- with descendant items: `mixed` when both visible and hidden items exist,
  `visible` when at least one is visible, otherwise `hidden`. Empty hidden
  layers do not force `mixed`.

### Filter rules

- `layerIds` non-empty → item's layer must be in the list.
- `resourceIds` non-empty → item must have at least one assignment whose
  `resourceId` is in the list.
- `statuses` non-empty → item's `status` must be in the list.
- `search` trimmed and lowercased; non-empty → item `title` must contain it
  case-insensitively. Whitespace-only search is ignored.
- Dimensions are ANDed (AR-8).

### Visibility state helpers

```ts
export type VisibilityAction =
  | { type: "showItem"; itemId: string }
  | { type: "hideItem"; itemId: string }
  | { type: "toggleItem"; itemId: string }
  | { type: "showLayer"; layerId: string }
  | { type: "hideLayer"; layerId: string }
  | { type: "toggleLayer"; layerId: string }
  | { type: "showGroup"; groupId: string }
  | { type: "hideGroup"; groupId: string }
  | { type: "toggleGroup"; groupId: string }
  | { type: "showChannel"; channel: RenderChannel }
  | { type: "hideChannel"; channel: RenderChannel }
  | { type: "toggleChannel"; channel: RenderChannel }
  | { type: "reset" };

export interface VisibilityPresetOptions {
  hideGroupIds?: string[];
  hideLayerIds?: string[];
  hideItemIds?: string[];
  hideChannels?: RenderChannel[];
}

export function visibilityReducer(
  context: VisibilityContext,
  state: VisibilityState,
  action: VisibilityAction,
): VisibilityState;

export function createVisibilityPreset(options?: VisibilityPresetOptions): VisibilityState;

export function createInitialVisibility(
  model: PlannerModel,
  preset?: VisibilityPresetOptions,
): VisibilityState;

export function serializeVisibility(state: VisibilityState): string;
```

- `createInitialVisibility` seeds hidden groups/layers from
  `defaultVisible === false`, then merges the preset.
- `visibilityReducer` returns a new state with deduplicated arrays; it never
  mutates the input. `reset` returns `createVisibilityPreset()` (all lists
  empty), not the initial defaults.
- `toggleGroup` uses the tri-state result: hidden → show, visible → hide,
  mixed → hide the group (AR-7). A mixed toggle hides all descendants
  **effectively** by adding the group flag; it never rewrites descendant flags.
  `showGroup` removes only the group flag and does not clear descendant flags.
- `serializeVisibility` sorts and deduplicates every list for a stable string.

### Editability API

```ts
export type EditAction = "move" | "resize" | "paint" | "create" | "delete";
export type EditabilityReason =
  | "editable"
  | "global-read-only"
  | "hidden"
  | "item-locked"
  | "layer-locked"
  | "policy"
  | "interaction-mode"
  | "unknown-entity";

export interface Editability {
  editable: boolean;
  reason: EditabilityReason;
}

export interface EditabilityContext extends VisibilityContext {
  readOnly?: boolean;
  mode?: InteractionMode;
  activeLayerId?: string;
}

export type ResolvedLayerPolicy = Required<LayerPolicy>;

export function getResolvedLayerPolicy(layerId: string, model: PlannerModel): ResolvedLayerPolicy;

export function getItemEditability(
  itemId: string,
  action: Exclude<EditAction, "create" | "delete">,
  context: EditabilityContext,
): Editability;

export function canCreateItem(layerId: string, context: EditabilityContext): Editability;

export function canDeleteItem(itemId: string, context: EditabilityContext): Editability;
```

### Editability precedence

1. Global `readOnly` → `global-read-only`.
2. Not effectively visible → `hidden`.
3. Item `locked` or `readOnly` → `item-locked`.
4. Layer `locked` or `readOnly` → `layer-locked`.
5. Resolved layer/group policy denies the action → `policy`.
6. Interaction mode does not allow the action → `interaction-mode`.
7. Otherwise `editable`.

`getResolvedLayerPolicy` walks **root → leaf**: each group's defined field
overrides the inherited value, then the layer's defined fields override the
groups (AR-9, AR-32). Missing flags resolve to `true`.

`canCreateItem` checks global read-only, hidden layer, layer `locked ||
readOnly`, `allowCreate` and the mode; the target must equal `activeLayerId`
(AR-30). `canDeleteItem` checks the same layer/global guardrails plus effective
item visibility, item `locked || readOnly`, `allowDelete` and the mode.

Mode mapping (AR-10):

| Mode | Allowed edits |
|---|---|
| `auto` | all otherwise-allowed actions |
| `paint`, `erase` | paint |
| `move` | move |
| `resize` | resize |
| `create` | create |
| `inspect`, `select` | none |

### Error handling

| Case | Handling | AR Ref |
|---|---|---|
| Unknown item/layer/group | Return `{ visible: false, reason: "unknown-entity" }` / `{ editable: false, reason: "unknown-entity" }`; never throw | AR-3 |
| Hidden ancestor | `group` wins over local flags | AR-7 |
| Mixed group toggle | Hide the group | AR-7 |
| Policy conflict | Nearest group then layer wins | AR-9 |

## Testing Requirements

- One test per precedence step, including a hidden item that is shown locally.
- Tri-state tests for visible/hidden/mixed and empty groups.
- Filter tests for each dimension, AND composition and search whitespace.
- Reducer immutability, deduplication and serialization stability.
- Editability matrix for global/item/layer/group/mode.

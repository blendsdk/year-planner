# RD-04: Layers, Visibility, Annotations and Data Validation

> **Document**: RD-04-layers-visibility.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01, RD-02
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the canonical item model and the presentation hierarchy around it:
layer groups, layers, render channels, items, annotations, resources and
assignments. It also defines visibility precedence, filters, editability,
paint/erase data semantics and runtime validation.

Two invariants are central:

1. **Visibility is presentation, never authorization or business occupancy.**
   Hiding a group, layer or item must not change canonical items, assignments or
   host validation results.
2. **One item has one period.** Erasing the middle of a highlight creates two
   residual highlight items; it never creates an invalid hole inside one simple
   interval.

---

## Functional Requirements

### Must Have

- [ ] Exact public entity interfaces for `LayerGroup`, `PlannerLayer`,
  `LayerPolicy`, `PlannerItem`, `Resource`, `Assignment`, `VisibilityState`
  and `PlannerFilter` (see Technical Requirements).
- [ ] `LayerGroup` supports nested `parentGroupId`; cycles are rejected.
- [ ] `PlannerLayer` belongs to at most one group and declares one render
  channel: `background`, `highlight`, `ribbon`, `annotation` or `foreground`.
- [ ] Annotations are `PlannerItem` values with `kind: 'annotation'` on an
  annotation-channel layer. A convenience `annotations` prop accepts the same
  item shape; there is no separate annotation entity.
- [ ] Highlight paint/erase semantics:
  - the paint command carries `defaults: PaintDefaults`; the effective layer is
    `command.layerId`, which must equal `activeLayerId`. The effective defaults
    are `{ kind: 'highlight', ...defaults }`; if the range intersects no matching
    visible item, one new item is created from those defaults;
  - paint union adds the drawn range and merges only affected items whose
    `title`, `kind`, `status`, `metadata`, `style`, `assignments`, `annotation`,
    `color`, `textColor` and `className` are exactly equal to the new paint
    item; differing items remain separate;
  - erase subtracts the range from each affected highlight item and replaces it
    with zero, one or two new highlight items with new IDs;
  - new residual and merged items copy **all** source attributes (`layerId`,
    `title`, `kind`, `metadata`, `color`, `textColor`, `className`, `style`,
    `status`, `assignments`, `annotation`) and use `version: 1` because they are
    new identities;
  - IDs come from `createId` (RD-07); an ID is never reused;
  - canonical item count and IDs change; no item ever contains a hole.
- [ ] Resources and assignments are typed and validated. R1 has no capacity
  engine; resources/assignments may be used by a host validator or mock demo.
- [ ] Editability precedence, highest first:
  1. the global `readOnly` prop;
  2. effective visibility: hidden items are not editable by pointer or
     imperative commands, and paint/erase skips them;
  3. an item's `locked` or `readOnly` flag;
  4. a layer's `locked` or `readOnly` flag (blocks all edit actions);
  5. the layer `policy.allowMove/allowResize/allowPaint/allowCreate/allowDelete`;
  6. the ancestor group policy;
  7. the global interaction mode.
  `locked` and `readOnly` are equivalent UI guardrails; `locked` is intended for
  published/pinned items and `readOnly` for permission-limited items.
- [ ] Visibility precedence, highest first:
  1. host-authorized data (the component never receives unauthorized details);
  2. hidden ancestor group;
  3. hidden layer;
  4. hidden item;
  5. filters (layer allowlist, resource, status, search);
  6. hidden render channel or density policy.
- [ ] A hidden parent suppresses every descendant. `showItem(id)` clears the
  item's local hidden flag but **does not** override a hidden group or layer.
- [ ] `getEffectiveVisibility(itemId)` returns `{ visible, reason }` with one of
  `visible`, `group`, `layer`, `item`, `filter`, `channel`.
- [ ] Group visibility is tri-state: visible, hidden or mixed. `toggleGroup` on
  a visible group hides it; on a hidden group shows it; on a mixed group hides
  all descendants (deterministic).
- [ ] Visibility is controlled by `visibility` + `onVisibilityChange` or
  uncontrolled via `defaultVisibility`; imperative `show/hide/toggle` calls the
  same reducer and emits the same callback.
- [ ] Filters support layer IDs, resource IDs, statuses and search text; no
  scenario filter in R1. `search` is trimmed, case-insensitive and matches
  `PlannerItem.title`; an empty/whitespace search applies no text filter.
  Results are deterministic and do not mutate items.
- [ ] Hidden items are absent from the visual DOM and accessibility tree.
  Hidden item titles, intervals, resource IDs and counts never appear in
  tooltips, overflow lists, the inspector or diagnostics. Counts use
  effective-visible items only.
- [ ] Runtime validation checks IDs, duplicate IDs, group cycles, layer/group
  references, resource/assignment references, period validity, version numbers
  and annotation dates. Invalid entities produce typed diagnostics per entity;
  one invalid item does not blank the whole planner.
- [ ] The public API accepts `items`, `groups`, `layers`, `resources`,
  `annotations`, `visibility`, `filter`, `readOnly` and callbacks.

### Should Have

- [ ] A serializable visibility preset helper.
- [ ] `validatePlannerData` returns diagnostics plus a normalized model and a
  non-blanking fallback collection.
- [ ] `layer.displayPriority` and `sortOrder` for deterministic lane tie-breaks.
- [ ] Layer labels/patterns/legends so layer identity is never color-only.

### Won't Have (Out of Scope)

- Authorization decisions, tenant isolation or data redaction — host-owned.
- Built-in holiday data or statutory calendars.
- Capacity/availability calculation — host-owned; mock example only.
- Scenario branching, recurrence, resource timelines, milestones,
  parent/child activities and dependencies — deferred.
- A data provider/loading/error state machine — deferred.

---

## Technical Requirements

### Core types

```ts
type RenderChannel = 'background' | 'highlight' | 'ribbon' | 'annotation' | 'foreground';
type ItemKind = 'highlight' | 'activity' | 'reservation' | 'annotation';

interface LayerPolicy {
  allowMove?: boolean;
  allowResize?: boolean;
  allowPaint?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

interface LayerGroup {
  id: string;
  name: string;
  parentGroupId?: string;
  defaultVisible?: boolean;
  policy?: LayerPolicy;
}

interface PlannerLayer {
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
  pattern?: 'solid' | 'hatch' | 'dots';
}

interface PlannerItem {
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
  annotation?: {
    label?: string;
    background?: string;
    priority?: number;
  };
  metadata?: unknown;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity?: { quantity: number; unit: string };
  timeZone?: string;
}

interface Assignment {
  resourceId: string;
  role?: string;
  quantity?: number;
}

interface VisibilityState {
  hiddenGroupIds: string[];
  hiddenLayerIds: string[];
  hiddenItemIds: string[];
  hiddenChannels?: RenderChannel[];
}
```

### Shared public contracts

These types are canonical here; RD-06/RD-07/RD-08 consume them. This avoids a
circular type dependency between the React view and the interaction/command RDs.

```ts
type InteractionMode = 'inspect' | 'select' | 'paint' | 'erase' | 'create' | 'move' | 'resize' | 'auto';

interface DateInterval { startDate: DateKey; endDateExclusive: DateKey; }

interface PlannerSelection {
  dates: DateInterval[];
  items: string[];
  anchorDate?: DateKey;
  focusDate?: DateKey;
  anchorItemId?: string;
}

interface PlannerFilter {
  layerIds?: string[];
  resourceIds?: string[];
  statuses?: string[];
  search?: string;
}

interface Diagnostic {
  code: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  itemIds?: string[];
  resourceIds?: string[];
  periods?: PlannerPeriod[];
}

interface ValidationResult {
  permitted: boolean;
  diagnostics: Diagnostic[];
}

interface CommandContext { requestId: string; baseRevision?: string; }

interface PaintDefaults {
  kind: 'highlight';
  title?: string;
  color?: string;
  textColor?: string;
  className?: string;
  style?: Record<string, string | number>;
  status?: string;
  metadata?: unknown;
  annotation?: { label?: string; background?: string; priority?: number };
}

type PlannerCommand =
  | { type: 'create'; item: PlannerItem }
  | { type: 'update'; itemId: string; patch: Partial<Omit<PlannerItem, 'id' | 'version'>>; expectedVersion: number }
  | { type: 'move'; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: 'resize'; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: 'delete'; itemId: string; expectedVersion: number }
  | { type: 'paint'; layerId: string; period: PlannerPeriod; operation: 'union' | 'subtract'; defaults: PaintDefaults; expectedVersions: Record<string, number> };

type CommandOutcome =
  | { accepted: true; revision: string; updatedItems?: PlannerItem[]; removedItemIds?: string[] }
  | { accepted: false; diagnostics: Diagnostic[]; latestRevision?: string };
```

### Paint/erase algorithm

```text
paint(layerId, range, defaults, createId):
  require layerId === activeLayerId
  effectiveDefaults = { kind: 'highlight', ...defaults }
  affected = effectively visible, editable highlight items in layerId intersecting range
  matching = affected whose attributes equal effectiveDefaults attributes
  merged = union(range, matching periods)
  remove matching; insert merged item (new ID via createId, version 1)
  leave non-matching affected items untouched

erase(layerId, range, createId):
  for each effectively visible affected highlight item:
    residual = subtract(item.period, range)   // 0, 1 or 2 intervals
    remove source item
    insert one residual item per interval
      (new ID via createId, version 1, copied attributes)
```

The operation is atomic at the command boundary. The controlled `paint`
command returns the full affected item set in `updatedItems`; uncontrolled mode
applies the same pure helper and records before/after for local undo.

### Visibility algorithm

1. Build group ancestry with cycle detection.
2. Resolve layer to group ancestry.
3. For each item, evaluate group, layer, item, filter and channel in order.
4. Return the first hiding reason; otherwise visible.
5. Compute tri-state group visibility from visible descendants.

### Editability algorithm

1. Global `readOnly` wins.
2. Hidden items are skipped; paint/erase only affects effectively visible items.
3. Item `locked`/`readOnly` wins over layer/group policy.
4. Layer `locked`/`readOnly` wins over layer policy and group policy.
5. Layer policy overrides group policy for the specific action.
6. Missing policy means allowed. Create requires `createDefaults.layerId` or
   `activeLayerId`; delete requires host confirmation, not an active layer.

### Validation

- Unknown IDs → `UNKNOWN_REFERENCE`; duplicates → `DUPLICATE_ID`; cycles →
  `GROUP_CYCLE`; invalid periods → RD-02 diagnostics.
- Invalid entities are excluded from the normalized model with a diagnostic;
  the remaining valid items still render.
- Metadata is untrusted and never rendered as raw HTML.

### Complexity

Model and validation: **M**. Visibility resolution: **M**. Paint/erase algebra:
**M**.

---

## Integration Points

- RD-05 consumes visible items and paint/erase residuals for fragments/lanes.
- RD-06 consumes annotations, layer labels/patterns and visibility.
- RD-07 enforces editability and uses active layer/paint semantics.
- RD-08 sends paint/erase commands and receives `updatedItems`.
- RD-09 ensures hidden items and counts do not leak.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Paint/erase model | Interval-set item, split items, hole | Split into new items | Keeps one-period invariant; matches acceptance | AR #37 |
| Batch move | Include, defer | Deferred | High-stakes; not required for R1 | AR #38 |
| Read-only model | Host-only, item/layer/group flags | Flags + global prop | Testable UI guardrail | AR #39 |
| Visibility vs occupancy | Coupled, separate | Separate | Hidden bookings may still block capacity | AR #24 |
| Group precedence | Child override, parent wins | Parent wins | Predictable presentation | AR #74 |
| Annotations | Separate entity, item kind | Item kind | One canonical model | AR #43 |
| Holidays | Built-in, host data | Host data only | No unverified statutory assumptions | AR #16 |

---

## Security Considerations

- **Data sensitivity**: Item titles, resources and annotations may be
  business-sensitive. The component does not log or persist them.
- **Input validation**: All IDs, references, periods, style values and metadata
  are validated; malformed data produces diagnostics.
- **Authentication & authorization**: Host-owned. Visibility and read-only are
  UI guardrails, not permissions.
- **Injection risks**: No raw HTML; metadata is rendered only through React
  escaping or explicit host render slots. Style values are host-trusted and must
  not contain remote URLs in untrusted metadata.
- **Encryption needs**: N/A — no storage or transport.
- **Rate limiting**: N/A — no endpoints.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] Hiding `Operations` hides `Logistics` and its bookings/maintenance
   visually; canonical item IDs, periods and assignments are unchanged.
2. [ ] `showItem('booking-jan-a')` while its parent group is hidden leaves it
   effectively hidden; `getEffectiveVisibility` reports `group`.
3. [ ] Hiding a layer hides its items; showing an item under the hidden layer
   does not override the layer.
4. [ ] Hidden items are absent from the DOM, accessibility tree, inspector,
   overflow list, tooltips and counts; their titles/intervals do not appear in
   diagnostics.
5. [ ] A group with one visible and one hidden child reports mixed/tri-state.
6. [ ] A group cycle is rejected with `GROUP_CYCLE`; valid items still render.
7. [ ] An item referencing an unknown layer/resource is rejected with
   `UNKNOWN_REFERENCE`; valid items still render.
8. [ ] A filter by status returns only matching items and does not mutate the
   input array or item IDs. `search: "  alpha  "` matches a title containing
   "Alpha" case-insensitively; `search: "   "` applies no text filter.
9. [ ] Controlled visibility calls `onVisibilityChange`; imperative show/hide
   calls the same callback; uncontrolled mode uses `defaultVisibility`.
10. [ ] A holiday annotation supplies custom label, background and text color;
    no built-in holiday is invented.
11. [ ] Erasing `[2027-06-14, 2027-06-17)` from a highlight
    `[2027-06-10, 2027-06-21)` removes the source item and creates exactly two
    highlight items for `[2027-06-10, 2027-06-14)` and
    `[2027-06-17, 2027-06-21)`, both with new IDs and copied attributes.
12. [ ] Painting `[2027-06-12, 2027-06-15)` over an existing highlight
    `[2027-06-10, 2027-06-14)` in the same layer produces one merged highlight
    `[2027-06-10, 2027-06-15)`; residual/merged items have new IDs and
    `version: 1`.
13. [ ] Painting over two highlights with different `metadata`/`color` does not
    merge them; the drawn range is added per the attribute policy and the
    differing items remain separate.
14. [ ] A locked item cannot be moved, resized or painted; a layer with
    `locked: true` or `readOnly: true` blocks all edits; a layer with
    `allowMove: false` cannot be moved; global `readOnly` blocks all edits.
15. [ ] Painting/erasing a range that intersects a hidden highlight leaves the
    hidden item unchanged; its ID is absent from `expectedVersions`,
    `updatedItems` and diagnostics.
16. [ ] Painting over a titled highlight preserves the title when the attributes
    match; a title difference prevents merging.
17. [ ] A paint command whose `layerId` differs from `activeLayerId` is rejected
    with `INVALID_PAINT_TARGET`; no mutation occurs.
18. [ ] Security requirements verified: hidden data absent from DOM/ARIA/counts,
    style values host-trusted, no raw HTML, no authorization inferred.

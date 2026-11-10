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
assignments. It also defines visibility precedence, filters and runtime
validation.

The central invariant is that **visibility is presentation, never authorization
or business occupancy**. Hiding a group, layer or item must not change canonical
items, assignments or host validation results.

---

## Functional Requirements

### Must Have

- [ ] Entity types: `LayerGroup`, `PlannerLayer`, `PlannerItem`, `Annotation`,
  `Resource`, `Assignment`, `VisibilityState`, `PlannerFilter`.
- [ ] `LayerGroup` supports nested `parentGroupId`; cycles are rejected.
- [ ] `PlannerLayer` belongs to at most one group and declares one render
  channel: `background`, `highlight`, `ribbon`, `annotation` or `foreground`.
- [ ] `PlannerItem` has stable `id`, `kind`, `layerId`, `period`,
  `version`, optional `title`, `color`, `textColor`, `className`, `style`,
  `status`, `parentItemId`, `scenarioId`, `assignments` and `metadata`.
- [ ] Date-bound annotations are intervals with `kind: 'holiday' | 'note'`,
  label, color/text/background, priority and metadata. They are host data; the
  component ships no holiday database and does not infer holidays.
- [ ] Resources and assignments are typed and validated but R1 has no capacity
  engine. Resource/assignment data may be used by host validation.
- [ ] Visibility precedence, highest first:
  1. host-authorized data (the component never receives unauthorized details);
  2. hidden ancestor group;
  3. hidden layer;
  4. hidden item;
  5. filters (layer allowlist, resource, status, search, scenario);
  6. hidden render channel or density policy.
- [ ] A hidden parent suppresses every descendant. `showItem(id)` clears the
  item's local hidden flag but **does not** override a hidden group or layer.
- [ ] `getEffectiveVisibility(itemId)` returns `{ visible, reason }` with one of
  `visible`, `group`, `layer`, `item`, `filter`, `channel`.
- [ ] Group visibility is tri-state: visible, hidden or mixed, derived from
  descendants.
- [ ] Visibility is controlled by `visibility` + `onVisibilityChange`, or
  uncontrolled internally; imperative `show/hide/toggle` calls the same reducer
  and emits the same callback.
- [ ] Filtering supports layer IDs, resource IDs, statuses, search text and
  scenario ID; results are deterministic and do not mutate items.
- [ ] Hidden items are absent from the visual DOM and accessibility tree;
  hidden item details never appear in tooltips, overflow lists or diagnostics.
- [ ] Runtime validation checks IDs, duplicate IDs, group cycles, layer/group
  references, resource/assignment references, period validity, version numbers
  and annotation dates; invalid data produces typed diagnostics.
- [ ] The public API accepts `items`, `groups`, `layers`, `resources`,
  `annotations`, `visibility`, `filter` and callbacks; no provider is required.

### Should Have

- [ ] A serializable visibility preset helper.
- [ ] A `validatePlannerData` function returning diagnostics and a normalized
  model.
- [ ] `layer.displayPriority` and `sortOrder` for deterministic lane tie-breaks.

### Won't Have (Out of Scope)

- Authorization decisions, tenant isolation or data redaction — host-owned.
- Built-in holiday data or statutory calendars.
- Capacity/availability calculation — host-owned; mock example only.
- Scenario branching, recurrence and resource timelines — deferred.
- A data provider/loading/error state machine — deferred.

---

## Technical Requirements

### Core types

```ts
interface PlannerItem {
  id: string;
  kind: 'highlight' | 'activity' | 'reservation' | 'annotation' | 'milestone';
  layerId: string;
  period: PlannerPeriod;
  title?: string;
  color?: string;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
  status?: string;
  parentItemId?: string;
  scenarioId?: string;
  assignments?: Assignment[];
  version: number;
  metadata?: unknown;
}

interface VisibilityState {
  hiddenGroupIds: string[];
  hiddenLayerIds: string[];
  hiddenItemIds: string[];
  hiddenChannels?: RenderChannel[];
}
```

### Visibility algorithm

1. Build group ancestry with cycle detection.
2. Resolve layer to group ancestry.
3. For each item, evaluate group, layer, item, filter and channel in order.
4. Return the first hiding reason; otherwise visible.
5. Compute tri-state group visibility from visible descendants.

### Validation

- Unknown IDs are rejected with `UNKNOWN_REFERENCE`; duplicate IDs with
  `DUPLICATE_ID`; cycles with `GROUP_CYCLE`; invalid periods with the RD-02
  diagnostics.
- Metadata is treated as untrusted and never rendered as raw HTML.

### Complexity

Model and validation: **M**. Visibility resolution: **M**.

---

## Integration Points

- RD-05 consumes visible items for fragments and lanes.
- RD-06 consumes annotations and visibility for rendering.
- RD-07 prevents hidden/locked items from being dragged.
- RD-08 passes canonical items to host validation regardless of visibility.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Visibility vs occupancy | Coupled, separate | Separate | Hidden bookings may still block capacity | AR #24 |
| Group precedence | Child override, parent wins | Parent wins | Predictable privacy/presentation semantics | AR #4 |
| Holidays | Built-in, host data | Host data only | No unverified statutory assumptions | AR #16 |
| Provider | Required, optional | Not in R1 | Lower scope; controlled props are enough | AR #7 |
| Resources | Full engine, types only | Types/mock validation | Keeps R1 focused on the year view | AR #6 |

---

## Security Considerations

- **Data sensitivity**: Item titles, resources and annotations may be
  business-sensitive. The component must not log or persist them.
- **Input validation**: All IDs, references, periods and metadata are validated;
  malformed data produces diagnostics.
- **Authentication & authorization**: Host-owned. The component never treats
  visibility as permission.
- **Injection risks**: No raw HTML; metadata is rendered only through React
  escaping or explicit host render slots.
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
4. [ ] Hidden items are absent from the DOM and accessibility tree; their
   titles do not appear in tooltips, overflow lists or diagnostics.
5. [ ] A group with one visible and one hidden child reports mixed/tri-state.
6. [ ] A group cycle is rejected with `GROUP_CYCLE` and the data is not rendered.
7. [ ] An item referencing an unknown layer/resource is rejected with
   `UNKNOWN_REFERENCE`.
8. [ ] A filter by status returns only matching items and does not mutate the
   input array or item IDs.
9. [ ] Controlled visibility calls `onVisibilityChange` with the next state;
   imperative show/hide calls the same callback; uncontrolled mode uses the same
   reducer.
10. [ ] A holiday annotation supplies custom label, background and text color;
   no built-in holiday is invented.
11. [ ] Security requirements verified: hidden data absent from DOM/ARIA,
    metadata escaped, no authorization inferred from visibility.

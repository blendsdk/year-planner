# Testing Strategy: M2 Layers and Ribbons

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
|---|---|
| Core model, validation, visibility, paint | 95% lines/branches/functions/statements |
| Ribbon geometry and print | 95% lines/branches/functions/statements |
| React package | Unchanged from M1 (80% floor) |

The existing `packages/core/vitest.config.ts` enforces 95% across all four
metrics. M2 adds no test dependency.

## Specification Test Cases

> Expectations come from RD-04, RD-05, the 03-document design and the
> Ambiguity Register. If an implementation disagrees, the implementation is
> wrong.

### Entity model and validation

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-1 | Empty input | `ok: true`, empty model, no diagnostics | RD-04 validation |
| ST-2 | Two items with the same ID | `DUPLICATE_ID`; first item kept, second dropped; `ok: false` | AR-4 |
| ST-3 | Item references a missing layer | `UNKNOWN_REFERENCE` with the item ID; a valid sibling remains | RD-04 AC7 |
| ST-4 | Groups `a → b → a` plus a valid group/layer/item | `GROUP_CYCLE`; cycle members and dependents dropped; valid item remains | RD-04 AC6, AR-5 |
| ST-5 | Layer references a missing group | `UNKNOWN_REFERENCE`; layer dropped | RD-04 validation |
| ST-6 | Item assignment references a missing resource | `UNKNOWN_REFERENCE`; item dropped | RD-04 Must Have |
| ST-7 | Item has `version: 0` and title `"Secret"` | `INVALID_VERSION`; item dropped; message and fields contain neither title nor dates; `periods` absent | AR-26 |
| ST-8 | `kind: "annotation"` on a `ribbon` layer | `INVALID_ANNOTATION`; item dropped | AR-14 |
| ST-9 | `annotations` array with a valid annotation on an annotation layer | Annotation merged into `model.items`, same ID and original period | RD-04 AC10 |
| ST-10 | Item with a reverse period and title `"Secret"` | RD-02 `INVALID_RANGE`; item dropped; diagnostic has `itemIds` only, no `periods`, title or dates | AR-26 |
| ST-11 | Item `style: { nested: { a: 1 } }` | `INVALID_STYLE`; item dropped | RD-04 security |
| ST-12 | Resource with `timeZone: "Mars/Olympus"` | `INVALID_TIMEZONE`; resource dropped; `resourceIds` only | RD-04 validation |
| ST-13 | Timed item `2027-01-31T23:30Z → 2027-02-01T01:00Z`, zone UTC | Valid; returned item keeps the timed period | RD-06 displayTimeZone, AR-2 |
| ST-64 | Holiday annotation with `label: "OH"`, `background: "#ffd166"`, `textColor: "#111111"` | All fields preserved in the model; no built-in holiday data is added | RD-04 AC10 |
| ST-76 | Table: invalid layer channel/opacity/pattern, duplicate group/layer/resource, non-annotation on annotation layer, invalid date, invalid capacity | Each produces its typed diagnostic; valid siblings remain; `INVALID_ITEM` is used for missing required item fields | RD-04 validation, AR-3 |

### Visibility and editability

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-14 | Hidden parent group with a descendant layer/item | Item hidden with reason `group`; item object unchanged | RD-04 AC1/AC2 |
| ST-15 | Hidden group, then `showItem` | Item remains hidden with reason `group` | RD-04 AC2 |
| ST-16 | Hidden layer, then `showItem` | Item hidden with reason `layer` | RD-04 AC3 |
| ST-17 | Hidden item; hidden channel; status filter | Reasons `item`, `channel`, `filter` respectively | RD-04 precedence |
| ST-18 | Group with one visible and one hidden child (child hidden by its own flag) | `getGroupVisibility` returns `mixed` | RD-04 AC5 |
| ST-19 | Toggle a visible, hidden and mixed group | visible → hidden; hidden → visible; mixed → hidden; descendant `hiddenItemIds` unchanged | RD-04 tri-state, AR-7 |
| ST-20 | Filter `statuses: ["confirmed"]` over confirmed and tentative items | Only confirmed visible; input array and IDs unchanged | RD-04 AC8 |
| ST-21 | `search: "  alpha  "` and `search: "   "` | First matches "Alpha" case-insensitively; second applies no text filter | RD-04 AC8 |
| ST-22 | Resource allowlist `["alice"]` and layer allowlist `["ops"]` | Item visible only when it matches both dimensions | AR-8 |
| ST-23 | `createInitialVisibility` with `defaultVisible: false` | Seed hidden group/layer IDs; `serializeVisibility` is deterministic | RD-04 Should Have |
| ST-24 | `countVisibleItems` with two visible and one hidden item | Returns `2`; `visibleItems` excludes the hidden item | RD-04 AC4 |
| ST-25 | Global `readOnly` | Every action returns `editable: false`, reason `global-read-only` | RD-04 AC14 |
| ST-26 | Locked/read-only item; locked/read-only layer; `allowMove: false` | Item move/resize/paint denied with `item-locked`; layer denies all with `layer-locked`; `allowMove: false` denies move but allows resize with `policy` | RD-04 AC14 |
| ST-27 | Nested group policies and a layer policy | Nearest group wins; layer overrides group | AR-9 |
| ST-28 | Hidden item | Editability false with reason `hidden` | RD-04 precedence |
| ST-29 | Mode `paint`, `auto` and `select` | Paint allowed, move denied in `paint`; both allowed in `auto`; direct paint under `select` returns `NOT_EDITABLE` with no mutation | AR-10 |
| ST-30 | Create on a hidden layer; create on a `readOnly` layer; delete a hidden item; delete with `allowDelete: false` | Denied with `hidden`, `layer-locked`, `hidden`, `policy` | RD-04 editability |
| ST-65 | Empty group with a visible layer; empty group with only hidden layers; hidden ancestor | `visible`; `hidden`; `hidden` | AR-6 |
| ST-66 | Table of every reducer action: show/hide/toggle item/layer/group/channel, reset | The exact state table below; input immutable; arrays deduplicated; show/hide preserve other arrays | AR-7 |
| ST-67 | Farther group defines `allowMove: false`; nearest group defines `allowResize: false`; layer defines `allowPaint: false` | Move denied, resize denied, paint denied; other actions allowed | AR-32 |
| ST-68 | Editability matrix for item `readOnly`, layer `readOnly`, layer `locked`, item `locked`, resize and paint | The exact reason matrix below; no action leaks through | RD-04 AC14 |
| ST-78 | Mode `inspect`/`create`/`auto`; create target differs from `activeLayerId` | `inspect` denies create/delete; `create` allows create, denies delete; target mismatch denies with `policy` | AR-30 |

**Reducer fixture for ST-66.** Start from
`S0 = { hiddenGroupIds: [], hiddenLayerIds: ["layer-a"], hiddenItemIds: ["item-a"], hiddenChannels: ["ribbon"] }`.

| Action | Expected state |
|---|---|
| `showItem item-a` | `hiddenItemIds: []` |
| `hideItem item-b` | `hiddenItemIds: ["item-a", "item-b"]` |
| `toggleItem item-a` | `hiddenItemIds: []` |
| `toggleItem item-c` | `hiddenItemIds: ["item-a", "item-c"]` |
| `showLayer layer-a` | `hiddenLayerIds: []` |
| `hideLayer layer-b` | `hiddenLayerIds: ["layer-a", "layer-b"]` |
| `toggleLayer layer-a` | `hiddenLayerIds: []` |
| `showChannel ribbon` | `hiddenChannels: []` |
| `hideChannel annotation` | `hiddenChannels: ["ribbon", "annotation"]` |
| `toggleChannel ribbon` | `hiddenChannels: []` |
| `hideGroup group-a` | `hiddenGroupIds: ["group-a"]` |
| `showGroup group-a` (from hidden) | `hiddenGroupIds: []` |
| `toggleGroup group-a` (visible) | `hiddenGroupIds: ["group-a"]` |
| `toggleGroup group-a` (hidden) | `hiddenGroupIds: []` |
| `toggleGroup group-a` (mixed) | `hiddenGroupIds: ["group-a"]`, descendant flags unchanged |
| `reset` | `{ hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [], hiddenChannels: [] }` |
| Any action | `S0` is not mutated; arrays stay deduplicated |

**Editability matrix for ST-68.** Item and layer start without flags or policy.

| Setup | Action | Expected |
|---|---|---|
| global `readOnly` | move | `false`, `global-read-only` |
| item `locked` | move | `false`, `item-locked` |
| item `readOnly` | resize | `false`, `item-locked` |
| item `locked` | paint | `false`, `item-locked` |
| layer `locked` | paint | `false`, `layer-locked` |
| layer `readOnly` | move | `false`, `layer-locked` |
| `allowMove: false` | move | `false`, `policy` |
| `allowResize: false` | resize | `false`, `policy` |
| `allowPaint: false` | paint | `false`, `policy` |
| hidden item | move | `false`, `hidden` |
| mode `select` | move | `false`, `interaction-mode` |
| mode `move` | move | `true`, `editable` |
| mode `move` | resize | `false`, `interaction-mode` |
| mode `auto` | resize | `true`, `editable` |

**Create/delete matrix for ST-78.**

| Setup | Action | Expected |
|---|---|---|
| mode `inspect` | create | `false`, `interaction-mode` |
| mode `create`, target = active layer | create | `true`, `editable` |
| mode `create` | delete | `false`, `interaction-mode` |
| mode `auto`, target = active layer | create | `true`, `editable` |
| mode `auto`, target ≠ active layer | create | `false`, `policy` |
| mode `auto`, layer `readOnly` | create | `false`, `layer-locked` |
| mode `auto`, visible item, `allowDelete: true` | delete | `true`, `editable` |
| mode `auto`, hidden item | delete | `false`, `hidden` |

### Paint and erase

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-31 | Erase `[2027-06-14, 2027-06-17)` from `[2027-06-10, 2027-06-21)` | Source removed; two residuals `[06-10, 06-14)` and `[06-17, 06-21)`; new IDs; `version: 1`; attributes copied | RD-04 AC11 |
| ST-32 | Paint `[2027-06-12, 2027-06-15)` over matching `[06-10, 06-14)` | One merged `[06-10, 06-15)`; new ID; `version: 1` | RD-04 AC12 |
| ST-33 | Paint over items with different `metadata` and `color` | No merge; drawn range added; originals remain separate and appear unchanged in `updatedItems` | RD-04 AC13 |
| ST-34 | Paint over no matching item | One new item for the drawn range from defaults | AR-12 |
| ST-35 | Paint with `layerId !== activeLayerId` | `INVALID_PAINT_TARGET`; no updated/removed items | RD-04 AC17 |
| ST-36 | Erase intersecting a hidden highlight | Hidden item unchanged; ID absent from `updatedItems`, `removedItemIds`, diagnostics | RD-04 AC15 |
| ST-37 | Global read-only; locked layer; locked **item** intersecting paint/erase | Global/layer → `NOT_EDITABLE`, no mutation; locked item → skipped, unchanged, absent from results, range item still created for paint | RD-04 AC14, AR-28 |
| ST-38 | `expectedVersions` mismatch | `STALE_VERSION`; no mutation | AR-13 |
| ST-39 | Paint with same vs different title | Same title merges/preserves; different title prevents merge | RD-04 AC16 |
| ST-40 | Erase the full covered range | Source removed; zero residuals | RD-04 paint algorithm |
| ST-41 | Paint on a `ribbon`/`annotation`/`foreground` layer | `INVALID_PAINT_CHANNEL`; no mutation | AR-27 |
| ST-42 | Paint on a `background`-channel layer | Allowed; creates a highlight item | AR-27 |
| ST-69 | Table: each compared attribute (`assignments`, `annotation`, `style`, `status`, `textColor`, `className`) equal then different | Equal → merges and preserves; different → separate items | RD-04 Must Have, AR-11 |
| ST-70 | Erase left-only and right-only ranges | Left-only → one residual at the right; right-only → one residual at the left | RD-04 paint algorithm |
| ST-71 | Paint/erase with a reverse range | RD-02 `INVALID_RANGE`; no mutation; diagnostic `itemIds`-free (range is caller input) | AR-33 |
| ST-81 | Erase over a timed highlight | Timed item skipped, period unchanged, absent from `updatedItems`/`removedItemIds` | AR-34 |

### Ribbon geometry

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-43 | `[2027-01-28, 2027-02-07)` | January fragment Jan 28–31 (end clipped) and February fragment Feb 1–6 (start clipped); same item ID; no other dates | RD-05 AC1 |
| ST-44 | One-day and eight-day intervals starting Feb 1 | Widths exactly 55 and 410 design px (6 weekdays + 2 weekends) | RD-05 AC2 |
| ST-45 | Three items all Feb 1–3 | Lanes `0`, `1`, `2`; three distinct fragments | RD-05 AC3 |
| ST-46 | `[2026-12-28, 2027-01-04)` | December and January fragments with one item ID; both continuation flags correct | RD-05 AC4 |
| ST-47 | Hide one of three overlapping layers | Remaining lanes repack to `0` and `1`; IDs and periods unchanged | RD-05 AC5 |
| ST-48 | Twenty items all Feb 1–4, compact | `visibleLaneCount: 3`, `laneCount: 20`, `overflowCount: 17`, overflow list has 17 entries with titles/periods | RD-05 AC6 |
| ST-49 | Twenty items, expanded | `visibleLaneCount: 20`; row height 378 > 90 | RD-05 AC7 |
| ST-50 | Hidden item among overflow | Hidden ID absent from fragments and overflow | RD-05 AC8 |
| ST-51 | Item outside the year window | No fragment; canonical period unchanged | RD-05 Must Have |
| ST-52 | Touching intervals Feb 1–3 and Feb 3–5 | Both lane `0` | RD-05 lane rule |
| ST-53 | Long item and short item both starting Feb 1 | Long item lane `0`, short item lane `1` (source duration sort) | AR-16 |
| ST-54 | Item A `[Jan 28, Feb 7)` and item C `[Feb 1, Feb 12)` in February | C is longer and has no previous lane, so C lane `0` and A lane `1`; hiding C gives A lane `0` (previous-row reuse) | AR-16 |
| ST-55 | Identical inputs twice; then change version/visibility/window | Same signature twice; different signature after each change | RD-05 AC10 |
| ST-56 | Hit index for one Feb 1–4 fragment | Entry at `x=80`, `y=198`, `width=165`; hit at `(80,198)`; miss at `(245,198)` | AR-22 |
| ST-57 | `RibbonOptions` and `RibbonLayout` connector surface | No connector option is accepted and no connector descriptors exist; the deferral to RD-06 is documented | AR-21 |
| ST-58 | Ten background-channel items overlapping | `laneCount: 0`, `overflowCount: 0`; ten fragments listed | AR-15 |
| ST-72 | Three items with `sortOrder`/`displayPriority`/equal keys | Exact lane order follows sortOrder asc, displayPriority desc, then item ID | AR-16 |
| ST-73 | January and February fragments of `[Jan 28, Feb 7)`, a middle fragment clipped at both ends, a single-row fragment and an outside-window item | Jan `false/true`; Feb `true/false`; middle `true/true`; single `false/false`; outside `n/a` | RD-05 Must Have |
| ST-74 | Annotation and foreground layers | Annotation fragment `height: 14`, lane 0; foreground fragment full row height, lane 0; neither affects `laneCount` | AR-15 |
| ST-75 | Overlapping background and ribbon fragments; `byItemId` | `hitTest` at the ribbon lane returns the ribbon; `byItemId` returns all fragments; y-boundary miss | AR-22, AR-31 |
| ST-77 | Timed item crossing midnight in `America/New_York` | Fragments cover the touched dates; original timed period preserved | AR-2 |
| ST-80 | Overflow with titled items | Entries carry title and original period; hidden entries absent | RD-05 AC6/AC8 |

### Print planning

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|---|---|---|
| ST-59 | 12, 14, 15, 18, 24, 28, 29 and 36 base rows, paginate | Page counts `1,1,2,2,2,2,3,3`; `totalWidth` is 1,995; every page's `contentHeight × scale ≤ 1077` and `totalWidth × scale ≤ 1542`; no row split | RD-05 AC9/AC13, AR-29 |
| ST-60 | 18-month window, `mode: "fit"` | One page, scale < 0.7, `PRINT_FIT_TOO_SMALL`, `requiresPaginate: true` | RD-05 AC12 |
| ST-61 | 14-month window, `mode: "fit"` | One page, scale ≈ 0.773 (width-bound), `PRINT_FIT_TOO_SMALL` warning, `requiresPaginate: true` | RD-05 AC12, AR-29 |
| ST-62 | `rowsPerPage: 0` or `15`; page `"A4"`; mode `"auto"` | `INVALID_PRINT_OPTIONS`, `ok: false` | AR-19 |
| ST-63 | 36 rows with the default rows per page | Three pages of 14/14/8 rows | RD-05 AC13 |
| ST-79 | 14 expanded rows (20 lanes each) on one page | Scale ≈ 0.201 from height; `PRINT_FIT_TOO_SMALL` and `requiresPaginate: true`; no row clipping | AR-29 |

## Test Categories

### Specification Tests

| Test file | ST cases | Component |
|---|---|---|
| `packages/core/src/model/validation.spec.test.ts` | ST-1–ST-13, ST-64, ST-76 | Entity validation and normalization |
| `packages/core/src/model/visibility.spec.test.ts` | ST-14–ST-30, ST-65–ST-68, ST-78 | Visibility, filters, editability |
| `packages/core/src/model/paint.spec.test.ts` | ST-31–ST-42, ST-69–ST-71, ST-81 | Paint/erase |
| `packages/core/src/ribbon/fragments.spec.test.ts` | ST-43–ST-55, ST-57, ST-58, ST-72–ST-74, ST-77, ST-80 | Fragments, lanes, overflow, signature, connector deferral |
| `packages/core/src/ribbon/hit-index.spec.test.ts` | ST-56, ST-75 | Hit index |
| `packages/core/src/ribbon/print.spec.test.ts` | ST-59–ST-63, ST-79 | Print planning |

### Implementation Tests

| Test file | Description | Priority |
|---|---|---|
| `packages/core/src/model/validation.impl.test.ts` | Empty/unknown entities, deep equality, cycle recovery, style/period redaction | High |
| `packages/core/src/model/visibility.impl.test.ts` | Policy merge, reducer immutability, serialization, empty groups | High |
| `packages/core/src/model/paint.impl.test.ts` | Attribute copy, no-op paths, invalid input, background channel | High |
| `packages/core/src/ribbon/fragments.impl.test.ts` | Lane gaps, zero items, multi-row clipping, overflow dedupe | High |
| `packages/core/src/ribbon/hit-index.impl.test.ts` | Hit boundaries, entry ordering, byItemId | High |
| `packages/core/src/ribbon/print.impl.test.ts` | Boundary row counts, scale math, empty ribbon | Medium |

### Integration Tests

| Test | Components | Description |
|---|---|---|
| Layout → ribbons → print | M1 layout + M2 geometry | 12/24/36-month smoke in one test |
| Validate → visibility → ribbons | Model + visibility + ribbon | Invalid item dropped, valid item still fragment |

### End-to-End Tests

N/A for this slice: RD-06 owns the DOM and print output. The existing M1
Playwright suite remains green and is run by `pnpm verify:full`.

## Test Data

- Classic 2027 layout (14 rows, Dec 2026–Jan 2028).
- Classic 2016 layout for width checks (leap year).
- Range layouts of 12, 15, 18, 24, 28, 29 and 36 months.
- One group tree, one ribbon layer, one background layer, one annotation layer,
  one resource.
- Twenty overlapping items for lane/overflow tests.
- Paint fixtures from RD-04 AC11–AC16.
- No mocks: all functions are pure; the ID factory is a deterministic counter.

## Verification Checklist

- [x] All specification cases have concrete input/output pairs
- [x] Every case traces to a requirement, design doc or AR entry
- [ ] Specification tests are written before implementation
- [ ] Red phase recorded for each phase
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover edge cases and internals
- [ ] `pnpm verify` passes per task and `pnpm verify:full` at completion
- [ ] Coverage stays at or above 95% for the core package

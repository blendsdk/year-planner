# Ambiguity Register: M2 Layers, Visibility and Ribbons

> **Status**: ✅ GATE PASSED — all 34 items resolved
> **Last Updated**: 2026-11-10 12:45
> **Authority**: `--auto-design` delegated resolutions plus two explicit user decisions (AR-1, AR-24)
> **Policy version**: 1
> **Root invocation ID**: `yp-m2-2026-11-10T12-37Z`
> **CodeOps Artifact Schema**: 1

## Scope baseline

- **Planning target**: RD-04 (layers, visibility, annotations, validation, paint/erase) and RD-05 (fragments, lanes, overflow, print planning, hit index) as a **core-engine slice**.
- **Context artifacts**: RD-01–RD-06, M1 plan and implementation, renderer ADR, requirements preflight.
- **Modification set**: new M2 plan documents, `packages/core/src/**`, core tests, API reports, docs, roadmap. No React renderer work (RD-06 stays next).

## Register

| # | Category | Ambiguity / Gap | Options Presented | Resolution | Status |
|---|----------|-----------------|-------------------|------------|--------|
| 1 | Scope | Which requirements this plan implements | RD-04 only / RD-04 + RD-05 core / RD-04 + RD-05 + RD-06 | **User chose option A: RD-04 + RD-05 core engine; RD-06 renderer integration remains the next slice.** | ✅ Resolved |
| 2 | Technical | Timed `PlannerItem.period` handling | Reject timed / accept and project / implicit host zone | **AI — delegated (AR-2):** accept both period kinds; validation and projection take `displayTimeZone` (default `UTC`). | ✅ Resolved |
| 3 | Technical | New diagnostic codes | Reuse generic codes / add typed codes | **AI — delegated (AR-3):** add typed codes (`DUPLICATE_ID`, `UNKNOWN_REFERENCE`, `GROUP_CYCLE`, `INVALID_GROUP`, `INVALID_ITEM`, `INVALID_VERSION`, `INVALID_ANNOTATION`, `INVALID_STYLE`, `INVALID_LAYER`, `INVALID_RESOURCE`, `NOT_EDITABLE`, `INVALID_PAINT_TARGET`, `INVALID_PAINT_CHANNEL`, `STALE_VERSION`, `INVALID_PRINT_OPTIONS`, `PRINT_FIT_TOO_SMALL`). | ✅ Resolved |
| 4 | Data | ID uniqueness scope | Global across entities / per collection | **AI — delegated (AR-4):** uniqueness is scoped per collection (groups, layers, items, resources); items and annotations share one item namespace. | ✅ Resolved |
| 5 | Behavioral | Group-cycle handling | Break edge / keep and mark / exclude cycle | **AI — delegated (AR-5):** exclude every group in a cycle and every dependent group/layer/item; emit `GROUP_CYCLE` once per cycle; valid entities still render. | ✅ Resolved |
| 6 | Behavioral | Tri-state group visibility with empty groups | Visible / hidden / mixed | **AI — delegated (AR-6):** with no descendant items, an unhidden group is `visible` if at least one descendant layer is unhidden, else `hidden`. | ✅ Resolved |
| 7 | Behavioral | Reducer semantics for toggle/show | Clear descendants / preserve local flags | **AI — delegated (AR-7):** `showGroup` removes only the group flag; descendant item/layer flags stay and remain dominated by ancestors. Mixed group toggle hides the group. | ✅ Resolved |
| 8 | Behavioral | Filter composition | OR / AND across dimensions | **AI — delegated (AR-8):** dimensions are ANDed; non-empty arrays are allowlists; empty/whitespace search is ignored. | ✅ Resolved |
| 9 | Behavioral | Multi-ancestor policy precedence | Root wins / nearest wins / merge | **AI — delegated (AR-9/AR-32):** per field, walk root → leaf; each defined value replaces the inherited one; nearest group wins; layer wins over groups; a field never defined is allowed. | ✅ Resolved |
| 10 | Behavioral | Interaction-mode mapping to actions | Mode is advisory / hard gate | **AI — delegated (AR-10):** `auto` allows every otherwise-allowed action; `paint`/`erase` allow paint; `move`/`resize`/`create` allow that action; `inspect`/`select` allow no edits. | ✅ Resolved |
| 11 | Technical | Paint attribute equality | JSON stringify / structural equality | **AI — delegated (AR-11):** recursive structural equality over the listed attributes, array order significant, object key order insignificant. | ✅ Resolved |
| 12 | Behavioral | Paint with no matching items | Create range / no-op | **AI — delegated (AR-12):** create one item for the drawn range from the effective defaults; non-matching intersecting items remain untouched. | ✅ Resolved |
| 13 | Technical | Paint/erase result and stale versions | Throw / result union | **AI — delegated (AR-13):** return `{ ok, updatedItems, removedItemIds, diagnostics }`; a version mismatch produces `STALE_VERSION` and no mutation. | ✅ Resolved |
| 14 | Data | Annotation merge and channel rule | Separate collection / merged namespace | **AI — delegated (AR-14):** merge `annotations` into the item namespace; require `kind: 'annotation'` on an `annotation`-channel layer, and reject non-annotation items on annotation channels. | ✅ Resolved |
| 15 | Technical | Which channels consume ribbon lanes | All channels / ribbon only | **AI — delegated (AR-15):** only `ribbon` consumes lanes; `background`, `highlight`, `annotation` and `foreground` are backdrop/badge descriptors with lane 0. | ✅ Resolved |
| 16 | Technical | Lane sort duration and reuse | Clipped / source duration | **AI — delegated (AR-16):** sort by clipped start, then **source** duration descending, then layer `sortOrder` ascending, `displayPriority` descending, stable item ID; reuse the previous row's lane when free. | ✅ Resolved |
| 17 | Technical | Overflow counting unit | Items / fragments | **AI — delegated (AR-17):** overflow counts ribbon fragments per row; the list deduplicates by item but preserves first-fragment order. | ✅ Resolved |
| 18 | Technical | Row growth and print constants | Fixed rows / grow | **AI — delegated (AR-18):** row height is `max(base, visibleLanes × laneHeight + laneTop)`; laneHeight 18, laneTop 18; A3 inner 1542×1077 design px at 6 mm per side; date text 12 design px. | ✅ Resolved |
| 19 | Technical | Fit print diagnostic semantics | Fatal / warning plus scale | **AI — delegated (AR-19):** fit returns one page, the computed scale and a `PRINT_FIT_TOO_SMALL` warning when date text would print below 7 pt; `requiresPaginate` is true. | ✅ Resolved |
| 20 | Technical | Ribbon signature content | Geometry only / geometry plus inputs | **AI — delegated (AR-20):** include layout signature, visibility/filter, density/options, item IDs + versions + periods and fragment geometry. | ✅ Resolved |
| 21 | Technical | Connector geometry | Always / constrained | **AI — delegated (AR-21):** `edge-path` is deferred to RD-06 with the SVG shape plane; M2 emits no connector descriptors and exposes no connector option. | ✅ Resolved |
| 22 | Technical | Hit-index coordinates | Row-local / absolute | **AI — delegated (AR-22):** entries use absolute day-plane coordinates (`x`, cumulative row `y`); `hitTest` returns the topmost (highest-lane) match. | ✅ Resolved |
| 23 | Process | Verify command | `pnpm verify` / `pnpm verify:full` | **AI — delegated (AR-23):** use `pnpm verify` per task and `pnpm verify:full` at phase and plan completion. | ✅ Resolved |
| 24 | Process | Commit mode | Ask / auto / none | **User directive:** `--auto-commit --auto-design`; commit and push after each verified task. | ✅ Resolved |
| 25 | Technical | Module split | One large file / focused modules | **AI — delegated (AR-25):** `model/` (types, validation, visibility, editability, paint) and `ribbon/` (fragments, lanes, print, hit index), each file below 700 lines. | ✅ Resolved |
| 26 | Security | Diagnostic redaction | Include entity detail / IDs only | **AI — delegated (AR-26):** item-related diagnostics carry item IDs and generic messages; never titles, periods, instants, zones or assignment resource IDs, so hidden data cannot leak through errors. | ✅ Resolved |
| 27 | Technical | Which channels accept paint | All / background+highlight / highlight only | **AI — delegated (AR-27):** paint/erase accept `background` and `highlight` layers; `ribbon`, `annotation` and `foreground` return `INVALID_PAINT_CHANNEL`. | ✅ Resolved |
| 28 | Behavioral | Per-item lock during paint/erase | Reject whole command / skip item | **AI — delegated (AR-28):** a hidden/locked/read-only **item** is skipped and left unchanged (same as AC15); a hidden/locked/read-only **layer** or global read-only rejects the command with `NOT_EDITABLE`. | ✅ Resolved |
| 29 | Technical | Print scaling | Scale 1 / per-page uniform scale | **AI — delegated (AR-29):** every page gets a uniform `scale = min(1, innerWidth/contentWidth, innerHeight/contentHeight)`; paginate chunks strictly by `rowsPerPage`. | ✅ Resolved |
| 30 | Behavioral | Create/delete mode and target | Mode advisory / hard gate | **AI — delegated (AR-30):** `canCreateItem` and `canDeleteItem` obey the same mode mapping as other actions; create requires `layerId === activeLayerId` or an explicit target equal to it. | ✅ Resolved |
| 31 | Technical | Hit-index ordering | Insertion order / geometric order | **AI — delegated (AR-31):** entries are sorted by absolute `y` ascending, then lane ascending, then x ascending; `hitTest` returns the last match so the topmost shape wins. | ✅ Resolved |
| 32 | Technical | Partial policy resolution | Nearest group whole-policy / per-field | **AI — delegated (AR-32):** resolve per field from root to leaf; defined values override inherited values; layer values override groups. | ✅ Resolved |
| 33 | Technical | Paint range type | `AllDayPeriod` / `PlannerPeriod` | **AI — delegated (AR-33):** paint/erase take an `AllDayPeriod`; timed ranges must be projected by the caller/RD-08 before the command. | ✅ Resolved |
| 34 | Behavioral | Timed highlight targets | Project / skip / reject | **AI — delegated (AR-34):** paint/erase affect only all-day highlight items; timed highlight items are skipped and left unchanged. | ✅ Resolved |

## Delegated resolution provenance

Each block records the eligibility boundary required by the auto-design policy.

### AR-2 — Timed item periods

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation mechanism inside RD-04's PlannerPeriod contract; no product or scope change.
Objective: deterministic projection of every item period into the date grid.
Decision: accept all-day and timed periods; validation and ribbon projection require an explicit displayTimeZone (default UTC).
Evidence: RD-02 defines both period kinds; RD-06 names displayTimeZone with a UTC default; the grid is date-based.
Rejected alternatives: reject timed items (contradicts the RD-04 type); use the host zone implicitly (non-deterministic, SSR-unsafe).
Strongest counterargument: a date-only restriction is simpler and covers the classic planner.
Confidence: High — explicit zones already exist in RD-02/RD-06.
Hardening: in-context challenge; local, reversible, fully covered by tests.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement that items are date-only, or host-provided projection callbacks.
```

### AR-3 — Diagnostic vocabulary

```text
Authority: AI — delegated by --auto-design
Eligibility: error-reporting mechanism; the RD already names the required failure classes.
Objective: typed, non-blanking validation and command failures.
Decision: add the 16 typed codes listed in the register; keep RD-02 codes unchanged.
Evidence: RD-04 names UNKNOWN_REFERENCE, DUPLICATE_ID, GROUP_CYCLE, INVALID_PAINT_TARGET; RD-05 needs print diagnostics.
Rejected alternatives: one generic INVALID_DATA code (loses machine-readable triage); throw exceptions (breaks non-blanking fallback).
Strongest counterargument: more codes enlarge the public union and API report.
Confidence: High — the codes mirror named RD failure classes.
Hardening: in-context challenge; additive to the existing DiagnosticCode union.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 requires a different command-level code set.
```

### AR-4 — ID uniqueness

```text
Authority: AI — delegated by --auto-design
Eligibility: data validation rule within RD-04's validation requirement.
Objective: unambiguous references without cross-entity namespace collisions.
Decision: uniqueness per collection; items and annotations share the item namespace.
Evidence: layers reference groups, items reference layers, assignments reference resources; no RD requires flat global IDs.
Rejected alternatives: global uniqueness (rejects harmless host IDs); no duplicate check (breaks references).
Strongest counterargument: global IDs are simpler to explain.
Confidence: High — references are typed and scoped.
Hardening: in-context challenge; covered by ST-2/ST-9.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a host contract that requires global IDs across entity kinds.
```

### AR-5 — Group cycles

```text
Authority: AI — delegated by --auto-design
Eligibility: failure-recovery mechanism inside RD-04's named GROUP_CYCLE behavior.
Objective: keep valid data rendering while rejecting cyclic groups.
Decision: exclude cycle members and dependents; emit one GROUP_CYCLE per cycle.
Evidence: RD-04 AC6 requires rejection plus valid items still rendering.
Rejected alternatives: break one edge (silently rewrites host data); keep cycles (undefined ancestry).
Strongest counterargument: excluding dependents is more destructive than breaking one edge.
Confidence: High — deterministic and non-blanking.
Hardening: in-context challenge; covered by ST-4.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement to repair rather than reject cyclic data.
```

### AR-6 — Empty group tri-state

```text
Authority: AI — delegated by --auto-design
Eligibility: visibility algorithm detail.
Objective: deterministic group state for groups without items.
Decision: hidden if self/ancestor hidden; else visible when a descendant layer is unhidden; else hidden.
Evidence: RD-04 AC5 defines mixed, not the empty case.
Rejected alternatives: always visible (ignores hidden layers); always mixed (misleading).
Strongest counterargument: an empty group has no meaningful visibility.
Confidence: High — the rule is monotone with child states.
Hardening: in-context challenge; covered by impl tests.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a UI requirement that distinguishes empty groups.
```

### AR-7 — Reducer semantics

```text
Authority: AI — delegated by --auto-design
Eligibility: state-transition mechanism; RD-04 fixes the precedence and tri-state outcomes.
Objective: predictable controlled/uncontrolled visibility behavior.
Decision: show/hide only touches the addressed local flag; mixed toggle hides the group.
Evidence: RD-04 AC2 requires showItem not to override a hidden group; AC5 requires mixed tri-state.
Rejected alternatives: show clears ancestor flags (violates AC2); hide rewrites every descendant (loses host intent).
Strongest counterargument: preserving local flags can surprise users when a group is shown again.
Confidence: High — matches the explicit precedence rules.
Hardening: in-context challenge; covered by ST-14–ST-17, ST-19 and ST-66.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement that group show resets descendant overrides.
```

### AR-8 — Filter composition

```text
Authority: AI — delegated by --auto-design
Eligibility: matching algorithm inside RD-04's filter contract.
Objective: deterministic, non-mutating filtering.
Decision: AND across dimensions; arrays are allowlists; empty search ignored.
Evidence: RD-04 specifies each filter field and the trim/case rule.
Rejected alternatives: OR (matches unrelated items); substring search on IDs (RD says title only).
Strongest counterargument: AND can produce empty results quickly.
Confidence: High — directly matches the RD text.
Hardening: in-context challenge; covered by ST-20–ST-22.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: host demand for OR/nested filter groups.
```

### AR-9 — Multi-ancestor policy

```text
Authority: AI — delegated by --auto-design
Eligibility: policy-resolution mechanism.
Objective: one deterministic effective policy per layer.
Decision: per field, walk root to leaf so defined values override inherited values; nearest group wins, then layer overrides; missing = allowed.
Evidence: RD-04 fixates layer-over-group; nested groups are explicitly supported.
Rejected alternatives: root wins (ignores local intent); whole-policy nearest group (drops farther fields); permissive OR (unpredictable).
Strongest counterargument: nearest-wins can hide a stricter root guardrail.
Confidence: Med — the RD does not spell out multi-ancestor precedence.
Hardening: in-context challenge; tests pin the behavior; revisit if a host needs root lock.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 or a host requirement needs root-policy dominance.
```

### AR-10 — Interaction-mode mapping

```text
Authority: AI — delegated by --auto-design
Eligibility: UI guardrail detail; RD-04 lists mode last in precedence.
Objective: make mode a hard, testable gate rather than advisory text.
Decision: the mapping in the register; `auto` allows otherwise-allowed edits.
Evidence: RD-04's precedence list includes the global interaction mode.
Rejected alternatives: mode advisory (untestable); mode always blocks (makes auto useless).
Strongest counterargument: a host may set mode `select` while issuing an imperative move.
Confidence: Med — command APIs in RD-08 may bypass mode.
Hardening: in-context challenge; the command layer can pass `auto` explicitly.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 defines mode-independent imperative commands.
```

### AR-11 — Paint equality

```text
Authority: AI — delegated by --auto-design
Eligibility: comparison algorithm.
Objective: merge only truly identical paint attributes.
Decision: recursive structural equality; array order significant, object key order irrelevant.
Evidence: RD-04 enumerates the compared attributes and requires differing items to remain separate.
Rejected alternatives: JSON.stringify (key-order false negatives); reference equality (never merges).
Strongest counterargument: metadata may contain non-JSON values (Date, Map).
Confidence: Med — metadata is typed `unknown`.
Hardening: in-context challenge; non-plain objects compare by identity; tests pin plain data.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: metadata becomes a typed JSON contract or hosts need custom equality.
```

### AR-12 — Paint no-match

```text
Authority: AI — delegated by --auto-design
Eligibility: command outcome detail.
Objective: painting always expresses the drawn range.
Decision: create one item from defaults when nothing matches; leave differing items untouched.
Evidence: RD-04's algorithm sets `merged = union(range, matching)` and insert always runs.
Rejected alternatives: no-op when no match (loses the paint); overwrite differing items (destroys data).
Strongest counterargument: a no-match paint could be considered a mistake.
Confidence: High — follows the RD algorithm literally.
Hardening: in-context challenge; covered by ST-33/ST-34/ST-69.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a command flag that suppresses creation.
```

### AR-13 — Paint result and stale versions

```text
Authority: AI — delegated by --auto-design
Eligibility: API/result shape and optimistic-concurrency mechanism.
Objective: atomic, inspectable paint/erase outcomes.
Decision: result union with `ok`, `updatedItems`, `removedItemIds`, `diagnostics`; mismatch = `STALE_VERSION`, no mutation.
Evidence: RD-04 requires atomicity and `expectedVersions`; RD-08 consumes `updatedItems`.
Rejected alternatives: throw (hostile to React event handlers); partial mutation (breaks atomicity).
Strongest counterargument: a result union is more verbose than a throw.
Confidence: High — matches the RD-08 command outcome shape.
Hardening: in-context challenge; covered by ST-38.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 chooses a different command-result contract.
```

### AR-14 — Annotation namespace

```text
Authority: AI — delegated by --auto-design
Eligibility: data-model detail fixed by RD-04 ("no separate annotation entity").
Objective: one canonical item namespace.
Decision: merge `annotations` into items; annotation kind requires an annotation channel; non-annotation items on annotation channels are invalid.
Evidence: RD-04 Must Have and AC10.
Rejected alternatives: separate annotation array in the model (contradicts the RD); allow any kind on annotation channels (ambiguous rendering).
Strongest counterargument: strict channel pairing can reject host data that renders fine.
Confidence: High — the RD states the pairing.
Hardening: in-context challenge; covered by ST-8/ST-9/ST-64.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement for mixed-content annotation layers.
```

### AR-15 — Lane channels

```text
Authority: AI — delegated by --auto-design
Eligibility: rendering-geometry mechanism; RD-05 fixes the channel partition.
Objective: allocate lanes only where overlap needs vertical separation.
Decision: `ribbon` consumes lanes; all other channels use lane 0 and channel-specific heights.
Evidence: RD-05 "Background highlights ... do not consume ribbon lanes".
Rejected alternatives: lane-pack every channel (wastes rows); drop non-ribbon fragments (loses highlights/annotations).
Strongest counterargument: overlapping highlights still need visual separation.
Confidence: High — follows the RD partition.
Hardening: in-context challenge; covered by ST-41/ST-42/ST-58/ST-74.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: overlapping background highlights become a rendering requirement.
```

### AR-16 — Lane sorting and reuse

```text
Authority: AI — delegated by --auto-design
Eligibility: deterministic packing algorithm.
Objective: stable, reproducible lane assignment across rows.
Decision: the sort and reuse rule in the register; source duration is used.
Evidence: RD-05 fixes the sort keys and lane reuse.
Rejected alternatives: clipped duration (changes by row); no reuse (fragments jump lanes).
Strongest counterargument: source duration can prefer a long item that is only one day in this row.
Confidence: High — matches the RD wording.
Hardening: in-context challenge; covered by ST-53 and ST-72.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a visual requirement for clipped-duration sorting.
```

### AR-17 — Overflow unit

```text
Authority: AI — delegated by --auto-design
Eligibility: overflow model detail.
Objective: match the "17 of 20" acceptance example.
Decision: count ribbon fragments; list deduplicates by item in first-fragment order.
Evidence: RD-05 AC6 requires exactly 3 lanes and 17 overflow for 20 concurrent items.
Rejected alternatives: count items (same in one-row example, different across rows); list duplicates (noisy).
Strongest counterargument: per-row fragments of one item can appear as one list entry.
Confidence: High — the acceptance example is fragment-based.
Hardening: in-context challenge; covered by ST-48/ST-80.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement for global rather than per-row overflow.
```

### AR-18 — Row growth and print constants

```text
Authority: AI — delegated by --auto-design
Eligibility: geometry constants and formula.
Objective: expanded rows grow without clipping; fit math is deterministic.
Decision: `max(base, visibleLanes × 18 + 18)`; A3 inner 1077 px; date text 12 px.
Evidence: M1 row height is 90; A3 landscape with 12 mm margins is ~1077 px at 96 DPI; M1 date text is 12 px.
Rejected alternatives: fixed 90 rows (clips 20 lanes); CSS-defined constants (core cannot read them).
Strongest counterargument: the renderer may use different units.
Confidence: Med — renderer tokens are CSS-owned in RD-06.
Hardening: in-context challenge; constants are exported and testable.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-06 establishes different row or text tokens.
```

### AR-19 — Fit diagnostic

```text
Authority: AI — delegated by --auto-design
Eligibility: print-plan result detail.
Objective: honor both "fit scales to one page" and "below 7 pt requires paginate".
Decision: return the one-page scale plus a warning and `requiresPaginate`.
Evidence: RD-05 AC12 states both outcomes.
Rejected alternatives: fatal error (loses the scale); silent scale (violates the 7 pt rule).
Strongest counterargument: returning a plan that should not be used invites misuse.
Confidence: High — the flag makes the constraint explicit.
Hardening: in-context challenge; covered by ST-60/ST-61/ST-62/ST-79.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a renderer that enforces the diagnostic as an error.
```

### AR-20 — Ribbon signature

```text
Authority: AI — delegated by --auto-design
Eligibility: memoization/test key mechanism.
Objective: identical inputs produce identical signatures; meaningful changes produce new ones.
Decision: include layout signature, visibility/filter, options, item id/version/period and fragment geometry.
Evidence: RD-05 AC10.
Rejected alternatives: geometry only (misses identity changes); full metadata (non-deterministic/cyclic).
Strongest counterargument: a title edit without a version bump is not detected.
Confidence: Med — the version-bump contract is required by RD-04.
Hardening: in-context challenge; tests pin version-driven changes.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: hosts mutate items without bumping `version`.
```

### AR-21 — Connector geometry

```text
Authority: AI — delegated by --auto-design
Eligibility: optional shape descriptor.
Objective: avoid misleading cross-grid lines while offering continuity.
Decision: defer `edge-path` to RD-06; M2 supports no connector option and emits no descriptors.
Evidence: fragment x is row-local; a wrapped connector crosses the whole grid or needs the gutter/shape plane owned by RD-06. The spike constrained the gap and therefore never connected wrapped rows.
Rejected alternatives: an unconstrained diagonal (misleading); a row-local gap rule (not constructible across wrapped rows); a gutter path without the renderer (premature shape plane).
Strongest counterargument: RD-05 lists connectors as a should-have, so M2 drops a listed capability.
Confidence: High — the remaining work is renderer-owned geometry.
Hardening: in-context challenge; ST-57 asserts the deferral.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-06 adds the shape plane and requests connector descriptors.
```

### AR-22 — Hit-index coordinates

```text
Authority: AI — delegated by --auto-design
Eligibility: lookup mechanism.
Objective: one coordinate space for pointer and keyboard hit-testing.
Decision: absolute day-plane coordinates; `hitTest` returns the last (highest-lane) match.
Evidence: RD-05 requires fragment IDs and bounds for lookup; RD-07 consumes bounds.
Rejected alternatives: row-local (callers must add offsets); first match (background wins over ribbons).
Strongest counterargument: row heights vary, so absolute y needs the row top.
Confidence: High — `RibbonRow.top` makes it explicit.
Hardening: in-context challenge; covered by ST-56/ST-75.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a renderer with a different scroll/zoom transform.
```

### AR-23 — Verify command

```text
Authority: AI — delegated by --auto-design
Eligibility: project process fact, read from package.json.
Objective: run the repo's actual gates.
Decision: `pnpm verify` per task; `pnpm verify:full` at phase/plan completion.
Evidence: package.json defines both; M1 test report documents them.
Rejected alternatives: ad-hoc vitest only (misses lint/build/API/size).
Strongest counterargument: verify is slower per task.
Confidence: High — existing project convention.
Hardening: none needed.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: the project verify command changes.
```

### AR-25 — Module split

```text
Authority: AI — delegated by --auto-design
Eligibility: internal file organization.
Objective: keep files reviewable and below the 700-line standard.
Decision: `model/` and `ribbon/` subfolders with one concern per file.
Evidence: the M1 core already uses `layout/`; the standards cap files at ~700 lines.
Rejected alternatives: one 1,500-line module (violates the standard).
Strongest counterargument: more files increase import ceremony.
Confidence: High — follows existing structure.
Hardening: none needed.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: the model and ribbon modules merge naturally.
```

### AR-26 — Diagnostic redaction

```text
Authority: AI — delegated by --auto-design
Eligibility: security mechanism inside RD-04's no-leak requirement.
Objective: hidden data never leaks through diagnostics.
Decision: diagnostics carry IDs and generic messages only.
Evidence: RD-04 AC4 forbids hidden titles/intervals in diagnostics.
Rejected alternatives: reuse RD-02 messages verbatim (they embed dates); include titles (leak).
Strongest counterargument: generic messages are less actionable for hosts.
Confidence: High — the security requirement is explicit.
Hardening: in-context challenge; covered by ST-7/ST-10/ST-76.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a host-only debug channel is added.
```

### AR-27 — Paintable channels

```text
Authority: AI — delegated by --auto-design
Eligibility: command-validation detail inside RD-04's paint contract.
Objective: reject paint on layers where a highlight range has no defined meaning.
Decision: allow background and highlight; reject ribbon/annotation/foreground with INVALID_PAINT_CHANNEL.
Evidence: RD-05 says background highlights composite in a backdrop plane; RD-04 paint creates highlight-kind items.
Rejected alternatives: allow every channel (ambiguous ribbon/annotation semantics); highlight only (drops background painting).
Strongest counterargument: a host may want to paint a ribbon range directly.
Confidence: Med — the RD does not name the allowed channels.
Hardening: in-context challenge; covered by ST-41/ST-42.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement to paint ribbon or annotation channels.
```

### AR-28 — Per-item lock during paint

```text
Authority: AI — delegated by --auto-design
Eligibility: failure/partial-success design inside RD-04's editability precedence.
Objective: never mutate a locked item while keeping atomic command behavior.
Decision: hidden/locked/read-only items are skipped and left unchanged; layer/global guardrails reject with NOT_EDITABLE.
Evidence: RD-04 AC15 already skips hidden items; AC14 forbids modifying locked items.
Rejected alternatives: reject the whole command for one locked item (blocks legitimate ranges); overwrite (violates AC14).
Strongest counterargument: silent skipping can surprise a user who expected all-or-nothing.
Confidence: Med — the RD does not state command-level failure semantics.
Hardening: in-context challenge; covered by ST-37/ST-68.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 requires all-or-nothing paint.
```

### AR-29 — Print scaling

```text
Authority: AI — delegated by --auto-design
Eligibility: geometry mechanism inside RD-05's print contract.
Objective: every page fits A3 across both dimensions, including expanded rows.
Decision: uniform per-page scale from width and height; paginate chunks strictly by rowsPerPage.
Evidence: the M1 grid is 1995×1332 design px; A3 inner at 6 mm is 1542×1077; 14 rows need ~0.77 width scale.
Rejected alternatives: scale 1 (clips); height-only (horizontal clipping); fixed 0.72 (breaks expanded rows).
Strongest counterargument: a per-page scale complicates print CSS.
Confidence: High — the dimensions are measured and deterministic.
Hardening: in-context challenge; covered by ST-59/ST-79.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-06 changes the design width, margins or row height.
```

### AR-30 — Create/delete mode and target

```text
Authority: AI — delegated by --auto-design
Eligibility: editability mechanism; RD-04 lists mode last and requires an active layer for create.
Objective: make create/delete obey the same guardrails as move/resize/paint.
Decision: apply the mode matrix to create/delete; create requires the target to equal activeLayerId.
Evidence: RD-04 editability algorithm step 6.
Rejected alternatives: exempt create/delete from mode (inconsistent); allow any target (violates active-layer semantics).
Strongest counterargument: hosts may create on a non-active layer deliberately.
Confidence: High — the RD names active layer for create.
Hardening: in-context challenge; covered by ST-78.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a multi-layer create command.
```

### AR-31 — Hit-index ordering

```text
Authority: AI — delegated by --auto-design
Eligibility: lookup mechanism.
Objective: a deterministic topmost hit across channels.
Decision: sort entries by absolute y, then lane, then x; hitTest returns the last match.
Evidence: background fragments span the row while ribbon fragments occupy lanes; insertion order is not a z-order.
Rejected alternatives: insertion order (backdrop can win); first match (same).
Strongest counterargument: the renderer may use a different z-order.
Confidence: Med — z-order is a renderer concern.
Hardening: in-context challenge; covered by ST-75.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-06 defines explicit z-index tokens.
```

### AR-32 — Partial policy resolution

```text
Authority: AI — delegated by --auto-design
Eligibility: policy algorithm detail.
Objective: combine nested group policies per action.
Decision: resolve each field root → leaf; every defined value overrides the inherited one; layer last.
Evidence: nested groups are supported; AR-9 requires nearest wins.
Rejected alternatives: whole-policy nearest group (drops fields defined farther up); merge with OR.
Strongest counterargument: per-field inheritance can mix permissive and restrictive ancestors.
Confidence: High — matches the per-action policy shape.
Hardening: in-context challenge; covered by ST-67.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement for whole-policy inheritance.
```

### AR-33 — Paint range type

```text
Authority: AI — delegated by --auto-design
Eligibility: API type boundary.
Objective: keep the paint algebra date-only and deterministic.
Decision: paint/erase accept AllDayPeriod; callers project timed ranges first.
Evidence: RD-04 defines the paint command with PlannerPeriod; RD-05 fragments are date-based.
Rejected alternatives: accept PlannerPeriod and project inside (adds an implicit zone); reject timed at runtime (untyped).
Strongest counterargument: RD-08 must remember to project.
Confidence: High — timed projection already exists.
Hardening: in-context challenge; covered by ST-71.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: RD-08 needs a single paint entry point for both period kinds.
```

### AR-34 — Timed highlight targets

```text
Authority: AI — delegated by --auto-design
Eligibility: data-handling boundary inside RD-04's paint contract.
Objective: keep one item one period and avoid converting timed identities to all-day.
Decision: paint/erase affect only all-day highlight items; timed highlight items are skipped and left unchanged.
Evidence: interval subtract operates on DateKeys; RD-04 requires copied periods and one-period items.
Rejected alternatives: project timed targets into all-day residuals (changes the period kind and loses time-of-day); reject the whole command (blocks valid all-day ranges).
Strongest counterargument: a user painting over a timed highlight expects it to change.
Confidence: Med — the RD does not define timed highlights.
Hardening: in-context challenge; add a regression test.
Policy version: 1 · Root invocation ID: yp-m2-2026-11-10T12-37Z
Reopen triggers: a requirement to paint timed highlights or preserve timed residuals.
```

## Resolution notes

- **AR-1 / AR-24** are user decisions, not delegated. The objective named option A and the commit mode.
- All other rows are eligible technical mechanisms inside the confirmed RD-04/RD-05 behavior.
- No row adds a dependency, service, infrastructure, test harness or generalized abstraction; the
  Complexity Escalation Gate is not triggered.
- The renderer-owned acceptance portions of RD-05 remain with RD-06 by AR-1.

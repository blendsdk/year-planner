# Ambiguity Register: RD-07 Interaction Engine, Selection and Keyboard

> **Status**: ✅ GATE PASSED — all 36 items resolved
> **Last Updated**: 2026-11-10 19:32
> **Authority**: `--auto-design` delegated resolutions; scope follows the user objective "deliver RD-07"
> **Policy version**: 1
> **Root invocation ID**: `yp-rd07-2026-11-10T19-32Z`
> **CodeOps Artifact Schema**: 1

## Scope baseline

- **Planning target**: RD-07 — interaction modes, pointer gestures, selection matrix, marquee, move/resize/paint/erase/create/delete, keyboard, touch policy, focus restoration, local undo integration and gesture cancellation.
- **Context artifacts**: RD-03, RD-04, RD-05, RD-06, RD-07, requirements ambiguity register AR #17, #18, #19, #38, #40, #44, #55, M1–M3 plans and implementation, `docs/react-view.md`, `docs/security.md`.
- **Modification set**: new plan documents, `packages/core/src/contracts.ts` plus exports, `packages/react/src/interaction/**`, `packages/react/src/render/**`, `packages/react/src/YearPlanner.tsx`, React/core tests, demo interaction fixture, Storybook interaction stories, E2E tests, API reports, docs, changeset, roadmap.
- **Explicitly out of this plan**: RD-08 rollback/stale-response lifecycle and controlled-host history; RD-09 announcements and full WCAG audit; RD-10 performance/security gate suite; RD-11 publication; RD-12 release; batch multi-move, bulk commands, split/merge reservations, drag between resources/layers, freehand painting, automatic scheduling, RTL pointer behavior, alt+drag subtraction (RD-07 Should Have, disabled by default).

## Register

| # | Category | Ambiguity / Gap | Options Presented | Resolution | Status |
|---|----------|-----------------|-------------------|------------|--------|
| 1 | Scope | Which RD-07 items are in this plan | All Must Haves + selected Should Haves / Must Haves only / pull RD-08 forward | **AI — delegated (AR-1):** implement all RD-07 Must Haves, the `requestUndo`/`requestRedo` Should Have (already present), and configurable double-click. Alt+drag subtraction stays disabled by default; batch/bulk remain deferred per RD-07. | ✅ Resolved |
| 2 | Naming | Plan folder and module names | `m4-interaction-engine` + `interaction/` modules / single `interaction.ts` / core-owned engine | **AI — delegated (AR-2):** plan folder `codeops/features/year-planner/plans/m4-interaction-engine/`; internal React modules under `packages/react/src/interaction/` with `selection.ts`, `gesture.ts`, `pointer.ts`, `preview.ts`, `useInteraction.ts`. | ✅ Resolved |
| 3 | Data & state | RD-07 requires an item focus, but `PlannerSelection` has only `anchorItemId` | Reuse `items.at(-1)` / add `focusItemId?: string` / React-local focus only | **AI — delegated (AR-3):** add additive optional `focusItemId?: string` to the canonical `PlannerSelection`; React `activeItemId` mirrors it. Additive public API, no break. | ✅ Resolved |
| 4 | Technical | Where the selection algebra lives | Core public helpers / React internal module / duplicate in tests | **AI — delegated (AR-4):** pure selection policy lives in internal `packages/react/src/interaction/selection.ts`; only the `focusItemId` field is added to core. No new public exports beyond the field. | ✅ Resolved |
| 5 | Behavioral | Date range normalization rules | Keep raw ranges / merge overlap / merge overlap+adjacent | **AI — delegated (AR-5):** normalize by sorting, merging overlapping and adjacent ranges, dropping empty/reversed ranges; toggling a date removes exactly that date and splits a range. | ✅ Resolved |
| 6 | Behavioral | Item visual order and tie-breaks for Shift ranges and select-all | Fragment order / start date then row/lane / id order | **AI — delegated (AR-6):** visual order = start date ascending, then row index, then lane, then item ID. Only visible items participate. | ✅ Resolved |
| 7 | Technical | Modifier abstraction | Check `ctrlKey` only / `ctrlKey \|\| metaKey` helper / platform sniffing | **AI — delegated (AR-7):** one `isMod(event)` helper using `ctrlKey \|\| metaKey`; never platform sniffing. Ctrl/Cmd+Shift is checked first and ignored without a diagnostic. | ✅ Resolved |
| 8 | Behavioral | Semantics of each interaction mode | Names only / full matrix / auto-only | **AI — delegated (AR-8):** `inspect` selects and inspects; `select` selects dates/items only; `paint`/`erase` drag paints/erases and click selects; `create` drag creates and click selects; `move` item drag moves; `resize` handle drag resizes; `auto` moves/resizes/selects as RD-07 states. No silent paint in `auto`. | ✅ Resolved |
| 9 | Behavioral | Click vs drag boundary | Fire both / threshold only / mode-dependent threshold | **AI — delegated (AR-9):** 4 CSS px Euclidean threshold. Below threshold is a click selection; at/above performs the mode gesture. A completed drag suppresses the following click. Paint/create require a drag; a click never emits a command. | ✅ Resolved |
| 10 | Technical | Pointer event attachment and capture | Per-cell/proxy listeners / grid-root delegation / document listeners | **AI — delegated (AR-10):** pointer listeners are delegated on the grid root; pointer capture is taken on the root with feature detection; host interactive controls (`button, a, input, select, textarea`) inside cells are ignored. Click/keyboard handlers remain for compatibility. | ✅ Resolved |
| 11 | Technical | Pointer-to-date mapping with scroll/zoom/blank slots | DOM rects per cell / prefix-width math / hit index only | **AI — delegated (AR-11):** map client coordinates through viewport rect, scroll, header and zoom using existing prefix-width geometry; reject blank slots and outside rows, holding the last valid date during a gesture. Never invent a date. | ✅ Resolved |
| 12 | Technical | Auto-scroll behavior | None / native scroll only / rAF edge scroll | **AI — delegated (AR-12):** rAF edge auto-scroll with a 32 px activation zone and 12 px maximum per frame; stops on pointerup/cancel/unmount; recomputes the pointer date after each scroll. | ✅ Resolved |
| 13 | Technical | Marquee interpretation and geometry | DOM rectangles / design-unit intersection / date rectangle | **AI — delegated (AR-13):** marquee is a design-unit rectangle intersected with visible fragment bounds; default selects items, `interaction.marquee: "dates"` or the `select` tool selects a chronological date range instead. Hidden, overflow and backdrop fragments never intersect. | ✅ Resolved |
| 14 | UX | How gesture previews render | Mutate items / CSS-only ghost / separate preview layer | **AI — delegated (AR-14):** separate preview fragments clipped per row using `prefixWidths`; `data-yp-part="selection-preview"`/`"gesture-preview"`; marquee is a fixed screen rectangle; previews are `aria-hidden` and never mutate canonical items. | ✅ Resolved |
| 15 | Behavioral | Move/resize semantics and invalid edges | Clamp silently / reject with diagnostic / allow zero-day | **AI — delegated (AR-15):** move preserves calendar duration and grab offset; resize enforces at least one day and start < end. An invalid resize emits `INVALID_COMMAND`, commits nothing and restores the original item and focus. | ✅ Resolved |
| 16 | Behavioral | Paint/erase/create command construction | Inline per gesture / shared builders / host-only | **AI — delegated (AR-16):** shared builders produce RD-04 `paint` commands with the active layer, range, operation, defaults and expected versions, and complete `create` items with stable ID and version 1. All flow through the existing command pipeline. | ✅ Resolved |
| 17 | UX | Missing active layer or create defaults | Silent no-op / diagnostic / fallback layer | **AI — delegated (AR-17):** paint/erase without an active highlight layer emits `INVALID_PAINT_TARGET`; create without `createDefaults.layerId` or `activeLayerId` emits `INVALID_COMMAND`. No fallback to the first highlight layer. | ✅ Resolved |
| 18 | UX | Keyboard ownership | Per-cell only / grid root only / mixed | **AI — delegated (AR-18):** cells own date arrows/Shift extension/Space/Enter/Escape; item proxies own item traversal and Space/Enter; the grid root owns Ctrl/Cmd+A, Escape fallback and Delete. All use the same selection and command helpers. | ✅ Resolved |
| 19 | Behavioral | Focus restoration after commit/hide/repack | Keep DOM focus / restore item / nearest cell | **AI — delegated (AR-19):** restore focus to the logical item when it remains visible; otherwise focus the selection focus date, then the item start, then the first enabled cell. Hidden selected items are pruned from selection. RD-09 owns announcements. | ✅ Resolved |
| 20 | UX | What is the explicit Touch edit toggle | Built-in button / host-controlled prop / gesture-only | **AI — delegated (AR-20):** the existing `interaction.touchEditing` prop is the explicit toggle; the host flips it to `"on"`. `"auto"` behaves as off until then. No new built-in chrome; `touch-action: none` applies only while `"on"`. | ✅ Resolved |
| 21 | Behavioral | When a pointer gesture cancels | Only Escape / pointercancel / every model change | **AI — delegated (AR-21):** cancel on Escape, pointercancel, lost capture, unmount, and any change to layout signature, items identity, visibility, filter or interaction mode during an active or pending gesture. Restore original preview and focus. | ✅ Resolved |
| 22 | Behavioral | Undo/redo integration | New history layer / reuse pipeline / host-only | **AI — delegated (AR-22):** reuse the existing command-pipeline history for uncontrolled move/resize/paint/erase/create/delete; selection changes are not undoable; a new edit clears redo; controlled mode creates no local entry. | ✅ Resolved |
| 23 | Behavioral | Double-click action | None / inspect / host callback | **AI — delegated (AR-23):** add `interaction.doubleClick?: "inspect" \| "none"` defaulting to `"inspect"`; a non-drag double-click on an item selects it and opens the inspector. A drag never triggers it. | ✅ Resolved |
| 24 | Behavioral | Annotation pointer behavior | Drag/edit / inspect only / ignore | **AI — delegated (AR-24):** annotation items remain host-owned; pointer down selects and inspects only, never moves/resizes/deletes or paints them. Commands remain rejected by the pipeline. | ✅ Resolved |
| 25 | Behavioral | Disabled dates | Skip / clamp / allow | **AI — delegated (AR-25):** disabled dates are not selectable, focusable, paintable, movable or resizable; arrow navigation skips them; range operations reject a range containing one. `aria-disabled` stays exposed. | ✅ Resolved |
| 26 | UX | Diagnostic vocabulary | New codes / reuse RD-06 table / silent | **AI — delegated (AR-26):** reuse the RD-06 public codes `READ_ONLY`, `INVALID_COMMAND`, `INVALID_PAINT_TARGET`, `TIMED_EDITING_UNSUPPORTED`, `STALE_REVISION`, `HOST_REJECTED`; no new codes except none. Messages describe the rule, not hidden data. | ✅ Resolved |
| 27 | Data & state | Selection callback timing during drag | Emit per pointermove / emit on pointerup / never | **AI — delegated (AR-27):** drag previews are local; one `onSelectionChange`/controlled update is emitted on pointerup. Clicks and keyboard changes emit immediately. | ✅ Resolved |
| 28 | Testing | Test layers and files | Unit only / jsdom only / pure + jsdom + Playwright | **AI — delegated (AR-28):** pure policy/FSM tests, jsdom pointer/keyboard tests, Playwright pointer/E2E tests, plus the existing full verify. No new test harness or dependency. | ✅ Resolved |
| 29 | Process | Verify and commit mode | `pnpm verify` / `pnpm verify:full` | **AI — delegated (AR-29):** `pnpm verify` after each task, `pnpm verify:full` at each phase and plan completion; signed commit and push after each verified task per `--auto-commit`. | ✅ Resolved |
| 30 | Docs | Storybook coverage for RD-07 | Minimum / broad static story set / skip | **User directive + AI (AR-30):** follow the standing "as many stories as possible" mandate. Add an `Interaction` story file covering modes, selection states, disabled dates, touch policy, read-only, double-click and gesture-adjacent states; drag previews remain E2E because they are ephemeral. | ✅ Resolved |
| 31 | Docs | API report and documentation updates | None / minimal / full | **AI — delegated (AR-31):** update API Extractor reports for `focusItemId` and `doubleClick`, add `docs/interaction.md`, update `docs/react-view.md`, README, test report, changeset and roadmap. | ✅ Resolved |
| 32 | Performance | Pointer move update strategy | Every event / rAF coalescing / throttle | **AI — delegated (AR-32):** coalesce pointer move work into one rAF tick per frame; auto-scroll shares the same loop. No worker, observer or new dependency. | ✅ Resolved |
| 33 | Security | Untrusted pointer geometry and host controls | Trust DOM / clamp and validate / ignore host controls | **AI — delegated (AR-33):** clamp coordinates to valid rows/dates, never synthesize dates from blank slots, ignore host interactive controls, never hit-test hidden items, and pass only typed commands to the pipeline. No HTML/script from pointer data. | ✅ Resolved |
| 34 | Accessibility | RD-09 boundary | Full ARIA/announcements here / minimal semantics / skip | **AI — delegated (AR-34):** RD-07 keeps existing ARIA grid/proxy semantics, marks previews `aria-hidden`, and restores focus. Announcements, full keyboard audit and WCAG conformance remain RD-09. | ✅ Resolved |
| 35 | Compatibility | Existing RD-06 tests and handlers | Rewrite tests / preserve behavior / break APIs | **AI — delegated (AR-35):** preserve RD-06 public props, handle, click selection and arrow-focus behavior; extend handlers with modifiers rather than replacing them. New internal modules only. | ✅ Resolved |
| 36 | Packaging | New dependencies or bundle surface | Pointer library / native Pointer Events / pan library | **AI — delegated (AR-36):** use native Pointer Events, rAF and existing geometry; no dependency. Keep ESM-only package and the 60 kB budget. | ✅ Resolved |

## Delegated resolution provenance

### AR-1 — RD-07 scope

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation sequencing and selection of RD-07 Should Haves inside the confirmed RD.
Objective: deliver every RD-07 Must Have and acceptance criterion without pulling RD-08/09 scope forward.
Decision: implement Must Haves, reuse existing undo/redo handles, and add configurable double-click; leave alt+drag disabled and batch/bulk deferred.
Evidence: RD-07 AC1–AC19; RD-07 explicitly defers batch move and disables alt+drag by default.
Rejected alternatives: implement alt+drag (OS conflicts, optional); implement bulk (RD-07 Won't Have).
Strongest counterargument: double-click is only Should Have and adds config surface.
Confidence: High — the requirement names inspect as the default.
Hardening: default stays `inspect`; `none` disables it; no new dependency.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a host needs alt+drag or bulk move in R1.
```

### AR-2 — Plan and module names

```text
Authority: AI — delegated by --auto-design
Eligibility: file and module naming inside the existing React package.
Objective: keep the 563-line YearPlanner component below the project split threshold and isolate the interaction logic.
Decision: plan `m4-interaction-engine`; internal modules `interaction/selection.ts`, `gesture.ts`, `pointer.ts`, `preview.ts`, `useInteraction.ts`.
Evidence: `packages/react/src/YearPlanner.tsx` is already 563 lines; the standards split threshold is ~700 lines.
Rejected alternatives: one large `interaction.ts` (hard to review); core engine (couples DOM interaction to the pure core).
Strongest counterargument: five internal files for one feature.
Confidence: High — each file owns one concern and remains testable.
Hardening: pure modules have no React/DOM imports; the hook is the only DOM boundary.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: the interaction modules exceed the size or responsibility boundary.
```

### AR-3 — Item focus field

```text
Authority: AI — delegated by --auto-design
Eligibility: additive data-contract completion required by RD-07's focus transitions.
Objective: represent the focused item distinctly from the anchor item.
Decision: add optional `focusItemId` to `PlannerSelection`; React mirrors it in `activeItemId`.
Evidence: RD-07 requires "Shift item range sets the item anchor and focus item"; the contract has only `anchorItemId`.
Rejected alternatives: infer focus from the last array element (ambiguous after marquee); React-only state (controlled hosts cannot see focus).
Strongest counterargument: public API growth.
Confidence: High — optional and additive; no existing consumer breaks.
Hardening: API report and typecheck; controlled hosts may omit it.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-08 revises the selection contract.
```

### AR-4 — Selection policy placement

```text
Authority: AI — delegated by --auto-design
Eligibility: internal architecture and module placement.
Objective: one testable implementation of the modifier and range rules.
Decision: pure functions in internal React `interaction/selection.ts`; only `focusItemId` changes in core.
Evidence: RD-06 already put only the minimal `emptySelection`/`selectionItemIds` helpers in core; the modifier matrix is a view interaction policy.
Rejected alternatives: public core helpers (premature API commitment); duplicating rules in handlers (drift).
Strongest counterargument: hosts may want the algebra.
Confidence: High — the functions stay package-internal and can be promoted later.
Hardening: pure unit tests; no React import.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a host requests public selection helpers.
```

### AR-5 — Date range normalization

```text
Authority: AI — delegated by --auto-design
Eligibility: algorithm and data-structure choice inside the canonical selection contract.
Objective: deterministic, minimal date ranges.
Decision: sort by start, merge overlapping and adjacent half-open ranges, drop empty/reversed; removal splits at the date.
Evidence: RD-07 says dates are normalized/merged and toggling inside a range splits it.
Rejected alternatives: keep raw toggled ranges (non-deterministic equality); merge only overlaps (adjacent ranges represent one continuous selection).
Strongest counterargument: adjacent ranges may be semantically distinct in a host UI.
Confidence: High — the canonical selection is a set of dates, not provenance.
Hardening: property-style table tests for split/merge.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: hosts need multiple disjoint ranges from one gesture.
```

### AR-6 — Visual item order

```text
Authority: AI — delegated by --auto-design
Eligibility: deterministic ordering algorithm.
Objective: stable Shift ranges and select-all.
Decision: visible items sorted by period start, row index, lane, then ID.
Evidence: RD-07 says "visual start order"; fragments carry row/lane and items carry start dates.
Rejected alternatives: DOM order (unstable across rows); ID order (not visual).
Strongest counterargument: ties are rare.
Confidence: High — deterministic and testable.
Hardening: tie-break test with same start/lane.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a different visual sort is specified.
```

### AR-7 — Modifier helper

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation mechanism.
Objective: macOS and Windows/Linux parity.
Decision: `isMod(event) = event.ctrlKey || event.metaKey`; Ctrl/Cmd+Shift is reserved and ignored first.
Evidence: RD-07 explicitly forbids hard-coding `ctrlKey`.
Rejected alternatives: platform detection (fragile, SSR-hostile).
Strongest counterargument: Ctrl on macOS is also a valid modifier.
Confidence: High — the RD names Ctrl/Cmd.
Hardening: tests cover both flags.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a requirement distinguishes Ctrl from Cmd.
```

### AR-8 — Mode matrix

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation of the already-named modes; no new mode is introduced.
Objective: predictable behavior for every `InteractionMode`.
Decision: inspect/select never edit; paint/erase/create edit only above threshold; move edits item bodies; resize edits handles; auto follows RD-07's explicit definition; clicks always select.
Evidence: RD-07 names the modes and defines auto; mode names and ACs constrain the rest.
Rejected alternatives: auto-only implementation (fails modes); paint on click (violates click/drag rule).
Strongest counterargument: mode semantics are product behavior.
Confidence: Med — derived from names and ACs; no contradictory requirement.
Hardening: mode matrix tests; easy to adjust without API change.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: the RD or a host defines different per-mode behavior.
```

### AR-9 — Click/drag threshold

```text
Authority: AI — delegated by --auto-design
Eligibility: pointer event mechanism.
Objective: one gesture never selects and edits.
Decision: 4 CSS px Euclidean threshold; below selects, above runs the gesture; drag suppresses click.
Evidence: RD-07 mandates a default 4 px threshold and exclusive actions.
Rejected alternatives: separate timers (unreliable); always drag (breaks clicks).
Strongest counterargument: 4 px is small on touch.
Confidence: High — RD default.
Hardening: threshold tests at 3 px and 5 px.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a configurable threshold is required.
```

### AR-10 — Pointer delegation

```text
Authority: AI — delegated by --auto-design
Eligibility: DOM event architecture.
Objective: one gesture state machine with minimal listener churn.
Decision: delegate pointer events on the grid root; capture on the root; ignore host interactive controls; keep click/key handlers.
Evidence: cells/proxies already carry data attributes; RD-06 host buttons must remain usable (AC3).
Rejected alternatives: per-fragment listeners (hundreds of handlers); document listeners (leak/other components).
Strongest counterargument: delegation must classify targets carefully.
Confidence: High — data attributes make classification explicit.
Hardening: host-control and nested-proxy tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: shadow DOM or portal hosts need different capture.
```

### AR-11 — Coordinate mapping

```text
Authority: AI — delegated by --auto-design
Eligibility: geometry algorithm.
Objective: correct dates under scroll, zoom, sticky header and resize.
Decision: reuse prefix-width design geometry; map client → design units; reject blank slots; hold last valid date during a drag.
Evidence: RD-07 coordinate mapping and no-phantom-date requirements; RD-06 geometry already has the math.
Rejected alternatives: per-cell `elementFromPoint` (costly, misses captured pointers); rounded rect math (drift).
Strongest counterargument: design-unit math must stay in sync with CSS.
Confidence: High — the grid uses the same prefix widths.
Hardening: pure mapping tests plus Playwright geometry.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: the layout stops using prefix widths.
```

### AR-12 — Auto-scroll

```text
Authority: AI — delegated by --auto-design
Eligibility: performance/implementation mechanism.
Objective: drag beyond the viewport without dropping the gesture.
Decision: 32 px edge zone, up to 12 px per rAF frame, stop on end/cancel/unmount.
Evidence: RD-07 requires edge auto-scroll; rAF is native.
Rejected alternatives: `setInterval` (jank); native scroll only (does not auto-scroll during capture).
Strongest counterargument: rAF timing varies in tests.
Confidence: High — pure delta helper is testable; E2E covers real scroll.
Hardening: fake-rAF unit test and Playwright drag near the edge.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: touch scrolling conflicts with auto-scroll.
```

### AR-13 — Marquee geometry

```text
Authority: AI — delegated by --auto-design
Eligibility: hit-test algorithm.
Objective: select exactly the visible items intersecting the rectangle.
Decision: design-unit rectangle vs visible fragment bounds; default items; `marquee: "dates"`/select tool uses chronological dates.
Evidence: RD-07 says a screen rectangle is never a contiguous date interval and hidden/overflow/backdrop items are not hit-testable.
Rejected alternatives: DOM rect intersection (zoom/scroll fragile); date rectangle (wrong semantics).
Strongest counterargument: design-unit rectangles are less intuitive to debug.
Confidence: High — deterministic and independent of DOM layout.
Hardening: overlap/edge/tie tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: marquee needs lasso or touch semantics.
```

### AR-14 — Preview layer

```text
Authority: AI — delegated by --auto-design
Eligibility: rendering architecture.
Objective: show proposed changes without mutating canonical items.
Decision: per-row clipped preview fragments and a fixed marquee rectangle; `aria-hidden`; separate data attributes.
Evidence: RD-07 says previews are ephemeral and canonical items are not mutated until commit.
Rejected alternatives: mutate items (rollback complexity); CSS transform of the original (loses original context).
Strongest counterargument: an extra overlay layer.
Confidence: High — mirrors the existing fragment geometry.
Hardening: preview-vs-item tests and AC1 two-fragment assertion.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: previews must be animated or portaled.
```

### AR-15 — Move/resize rules

```text
Authority: AI — delegated by --auto-design
Eligibility: algorithm and failure design within RD-07.
Objective: preserve duration and reject invalid geometry safely.
Decision: preserve calendar duration and grab offset; resize keeps at least one day; invalid range emits `INVALID_COMMAND` without a command.
Evidence: RD-07 move/resize and AC7–AC8.
Rejected alternatives: clamp to one day silently (hides user error); commit then rollback (RD-08 scope).
Strongest counterargument: immediate rejection may feel abrupt.
Confidence: High — matches AC8.
Hardening: boundary tests around month/year and one-day minimum.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-08 defines preview-time validation.
```

### AR-16 — Command builders

```text
Authority: AI — delegated by --auto-design
Eligibility: internal API and reuse.
Objective: one source of paint/create command shapes.
Decision: shared pure builders in the interaction module; all commands go through the existing pipeline.
Evidence: RD-06 already has `commandForPaint` in the inspector; duplicating it would drift.
Rejected alternatives: duplicate inspector logic; direct host callbacks (bypasses validation).
Strongest counterargument: extracting the inspector helper is refactoring.
Confidence: High — DRY and pipeline consistency.
Hardening: builder tests and command-shape assertions.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: paint command shape changes in RD-08.
```

### AR-17 — Diagnostic boundary

```text
Authority: AI — delegated by --auto-design
Eligibility: failure design inside the approved diagnostic table.
Objective: actionable errors without new vocabulary.
Decision: `INVALID_PAINT_TARGET` for missing/wrong paint layer; `INVALID_COMMAND` for missing create layer/invalid range; `READ_ONLY`/`TIMED_EDITING_UNSUPPORTED` for editability.
Evidence: RD-06 diagnostic table and RD-07 paint/create ACs.
Rejected alternatives: new codes (unstable); silent no-op (bad UX).
Strongest counterargument: create might deserve its own code.
Confidence: High — reuses the public table.
Hardening: diagnostic assertions in spec tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-08 introduces a create-specific code.
```

### AR-18 — Keyboard ownership

```text
Authority: AI — delegated by --auto-design
Eligibility: event architecture.
Objective: one selection policy for pointer and keyboard.
Decision: cells own date keys; proxies own item keys; grid root owns global Ctrl/Cmd+A, Escape and Delete.
Evidence: existing RD-06 handlers are cell/proxy-scoped; keeping them preserves focus and tests.
Rejected alternatives: all keys on the root (focus routing complexity); all keys on cells (items unreachable).
Strongest counterargument: split ownership can drift.
Confidence: High — all paths call the same helpers.
Hardening: keyboard matrix tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-09 moves to a roving composite widget.
```

### AR-19 — Focus restoration

```text
Authority: AI — delegated by --auto-design
Eligibility: focus algorithm within RD-07.
Objective: focus never falls into the document after an edit.
Decision: item → focus date → item start → first enabled cell; prune hidden selected items.
Evidence: RD-07 focus restoration and hidden-item requirements.
Rejected alternatives: leave focus on a removed element (browser sends it to body).
Strongest counterargument: fallback order is arbitrary.
Confidence: High — deterministic and testable.
Hardening: removal/hide/repack tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-09 defines a different focus order.
```

### AR-20 — Touch toggle

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation of the already-exposed `touchEditing` policy.
Objective: scroll-first touch without adding product chrome.
Decision: `touchEditing` is the explicit host-controlled toggle; `auto` behaves as off; `on` sets `touch-action: none`; no built-in button.
Evidence: RD-06 already exposes the prop; RD-07 does not name a component-owned control.
Rejected alternatives: built-in button (new visible chrome); media query (SSR and test complexity).
Strongest counterargument: standalone users need a visible toggle.
Confidence: Med — minimal interpretation; host chrome is the documented pattern.
Hardening: touch tests toggle the prop; docs state the host responsibility.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-09/RD-11 requires a component-owned touch control.
```

### AR-21 — Cancellation triggers

```text
Authority: AI — delegated by --auto-design
Eligibility: failure/recovery design.
Objective: never commit a stale gesture.
Decision: cancel on Escape, pointercancel, lost capture, unmount, and changes to layout signature, items identity, visibility, filter or mode.
Evidence: RD-07 explicitly lists these triggers.
Rejected alternatives: only pointercancel (stale commits); only mode changes (year changes).
Strongest counterargument: controlled hosts that replace item arrays every render could cancel constantly.
Confidence: High — compare identity/signature, not deep content.
Hardening: cancellation tests per trigger.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: controlled hosts need gesture survival across identity churn.
```

### AR-22 — Undo integration

```text
Authority: AI — delegated by --auto-design
Eligibility: reuse of the existing pipeline.
Objective: no second history implementation.
Decision: reuse the RD-06 pipeline; selection is not undoable; new edits clear redo.
Evidence: RD-07 Should Have `requestUndo`/`requestRedo`; RD-06 already implements snapshots.
Rejected alternatives: selection snapshots (surprising); a new history store (duplicate).
Strongest counterargument: RD-08 owns the full lifecycle.
Confidence: High — RD-08 can replace internals behind the same handle.
Hardening: per-command undo/redo tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-08 changes the history contract.
```

### AR-23 — Double-click

```text
Authority: AI — delegated by --auto-design
Eligibility: optional RD-07 Should Have implemented as a small config.
Objective: configurable inspect gesture.
Decision: `interaction.doubleClick?: "inspect" | "none"`, default inspect; drag suppressed.
Evidence: RD-07 Should Have.
Rejected alternatives: always inspect (not configurable); host callback (new event surface).
Strongest counterargument: adds config for a Should Have.
Confidence: High — small and defaulted.
Hardening: default and `none` tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a host needs a custom double-click action.
```

### AR-24 — Annotation pointer behavior

```text
Authority: AI — delegated by --auto-design
Eligibility: behavior within the existing host-owned annotation decision (RD-06 AR-31).
Objective: inspect annotations without local edit corruption.
Decision: select and inspect only; no drag/delete/paint.
Evidence: RD-06 AR-31 makes annotation edits host-owned; RD-07 hit-test says annotation pointerdown → inspecting.
Rejected alternatives: allow local annotation edits (duplicates host data).
Strongest counterargument: users may expect annotation drag.
Confidence: High — consistent with RD-06.
Hardening: pointer test and command rejection test.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a controlled annotation editing API is specified.
```

### AR-25 — Disabled dates

```text
Authority: AI — delegated by --auto-design
Eligibility: algorithm and validation.
Objective: enforce the host's disabled-date policy everywhere.
Decision: skip in navigation, reject selection/paint/move/resize ranges containing one.
Evidence: RD-07 disabled-date requirement and AC18.
Rejected alternatives: clamp to the nearest enabled date (surprising); allow selection but block edit (inconsistent).
Strongest counterargument: a moved range crossing a holiday may be legitimate.
Confidence: High — RD says disabled dates are not movable.
Hardening: navigation and range tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: disabled dates become non-blocking for moves.
```

### AR-26 — Diagnostics

```text
Authority: AI — delegated by --auto-design
Eligibility: reuse of the approved diagnostic table.
Objective: typed, stable failure codes.
Decision: reuse the RD-06 codes; no new codes in RD-07.
Evidence: RD-06 AR-29 table; RD-07 AC8/AC13/AC10.
Rejected alternatives: new per-gesture codes (API churn).
Strongest counterargument: `INVALID_COMMAND` is broad.
Confidence: High — hosts can branch on the existing table.
Hardening: code assertions.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-08 adds a more specific code.
```

### AR-27 — Selection callback timing

```text
Authority: AI — delegated by --auto-design
Eligibility: callback/event design.
Objective: avoid callback storms while keeping controlled hosts in sync.
Decision: local preview during drag; one selection emission on pointerup; clicks/keyboard emit immediately.
Evidence: RD-07 distinguishes previews from committed changes.
Rejected alternatives: emit per move (noisy); emit only on next click (stale).
Strongest counterargument: a host may want live selection.
Confidence: High — matches "preview" semantics.
Hardening: callback-count test.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a host requires live selection updates.
```

### AR-28 — Test layers

```text
Authority: AI — delegated by --auto-design
Eligibility: testing strategy.
Objective: prove pure algebra, DOM wiring and real browser gestures.
Decision: pure Vitest for selection/FSM/geometry, jsdom for handlers, Playwright for drag/marquee/keyboard/touch.
Evidence: RD-07's high-risk matrix; existing project test stack.
Rejected alternatives: jsdom-only (no layout); E2E-only (slow/fragile).
Strongest counterargument: three layers cost time.
Confidence: High — matches existing project conventions.
Hardening: every AC maps to at least one layer.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: Playwright cannot exercise touch reliably.
```

### AR-29 — Verify/commit

```text
Authority: AI — delegated by --auto-design (process), user objective (commit)
Eligibility: process within the invoked workflow.
Objective: keep CI green with incremental evidence.
Decision: `pnpm verify` per task, `pnpm verify:full` per phase and completion; signed commit + push after each verified task.
Evidence: repo scripts and prior milestone practice; user objective names `--auto-commit`.
Rejected alternatives: one commit at the end (poor recovery).
Strongest counterargument: many commits.
Confidence: High — matches prior slices.
Hardening: CI watch after each push.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: the user changes commit mode.
```

### AR-30 — Storybook

```text
Authority: User directive + AI implementation
Eligibility: documentation surface within the standing mandate.
Objective: keep every meaningful RD-07 state visible.
Decision: add an `Interaction` story file with modes, selections, disabled dates, touch policy, read-only, double-click and item-focus states; ephemeral drag previews stay in E2E.
Evidence: README documentation mandate; RD-11 story list.
Rejected alternatives: no new stories (violates mandate); fake mouse events in stories (no test addon).
Strongest counterargument: static stories cannot show a drag.
Confidence: High — static states plus E2E evidence.
Hardening: story count and static build.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: Storybook gains an interaction test addon.
```

### AR-31 — Documentation/API updates

```text
Authority: AI — delegated by --auto-design
Eligibility: documentation mechanics.
Objective: keep public docs and reports truthful.
Decision: update API reports, `docs/interaction.md`, `docs/react-view.md`, README, test report, changeset and roadmap.
Evidence: project documentation standard and prior milestone closeout.
Rejected alternatives: code-only (stale docs).
Strongest counterargument: docs churn.
Confidence: High.
Hardening: API report check and docs review.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-11 replaces these docs.
```

### AR-32 — Pointer move performance

```text
Authority: AI — delegated by --auto-design
Eligibility: performance mechanism.
Objective: avoid re-rendering on every raw pointer event.
Decision: coalesce preview updates into one rAF tick; auto-scroll shares it.
Evidence: RD-07 complexity L for the pointer adapter; grid can be large.
Rejected alternatives: every event (jank); throttle timer (extra timer).
Strongest counterargument: rAF adds test complexity.
Confidence: High — pure helpers remain testable.
Hardening: fake-rAF impl test and E2E smoothness.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: input latency complaints.
```

### AR-33 — Security

```text
Authority: AI — delegated by --auto-design
Eligibility: security mechanism inside the approved policy.
Objective: pointer data cannot create unauthorized or phantom changes.
Decision: clamp to valid rows/dates, ignore host controls, exclude hidden items, typed commands only, no HTML/script.
Evidence: RD-07 security considerations and RD-06 security docs.
Rejected alternatives: trust DOM attributes (tamperable); render pointer text (injection).
Strongest counterargument: DOM attributes are already host-controlled.
Confidence: High — the pipeline revalidates.
Hardening: negative tests for blank slots, hidden items, host controls.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a new pointer-sourced data path is added.
```

### AR-34 — Accessibility boundary

```text
Authority: AI — delegated by --auto-design
Eligibility: scope boundary against RD-09.
Objective: keep RD-07 behavior accessible without pre-empting the audit.
Decision: preserve grid/proxy semantics, hide previews, restore focus; announcements/WCAG remain RD-09.
Evidence: RD-09 dependency and RD-07 focus requirements.
Rejected alternatives: full audit here (scope creep); ignore focus (fails AC15).
Strongest counterargument: keyboard behavior is accessibility.
Confidence: High — focus is RD-07, announcements are RD-09.
Hardening: focus tests; RD-09 audit later.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: RD-09 finds a missing RD-07 focus contract.
```

### AR-35 — RD-06 compatibility

```text
Authority: AI — delegated by --auto-design
Eligibility: internal refactor compatibility.
Objective: no regression in the shipped RD-06 surface.
Decision: preserve props/handle/click/arrow behavior; extend handlers with modifiers; keep internal modules private.
Evidence: 140 React tests and public API report.
Rejected alternatives: rewrite handlers (regression risk).
Strongest counterargument: legacy click handlers complicate the FSM.
Confidence: High — suppress-click flag isolates drags.
Hardening: full existing suite plus new tests.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: an RD-06 behavior must change for RD-07 correctness.
```

### AR-36 — Dependencies

```text
Authority: AI — delegated by --auto-design
Eligibility: dependency choice.
Objective: no new runtime dependency.
Decision: native Pointer Events, rAF and existing geometry.
Evidence: RD-07 technical requirements; no library is needed.
Rejected alternatives: pointer/gesture library (bundle and API risk).
Strongest counterargument: a library handles edge cases.
Confidence: High — the gesture surface is small and specified.
Hardening: bundle-budget check.
Policy version: 1 · Root invocation ID: yp-rd07-2026-11-10T19-32Z
Reopen triggers: a browser quirk cannot be handled natively.
```

## Resolution notes

- **AR-20** is the only decision with a visible UX trade-off. The host owns
  chrome; the component owns the policy. This keeps the standalone library
  minimal and matches the existing `touchEditing` prop. The plan documents the
  host responsibility and makes the prop change observable in tests.
- **AR-3** is additive and does not break the RD-06 API. The API report will
  show it as a new optional field.
- **AR-8** is derived from the mode names and the explicit `auto` definition.
  It is recorded as Med confidence because per-mode behavior is close to
  product behavior; no requirement contradicts it and the implementation is
  isolated in one matrix.

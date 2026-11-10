# Ambiguity Register: RD-06 React View, Theming and Style Integration

> **Status**: ✅ GATE PASSED — all 29 items resolved
> **Last Updated**: 2026-11-10 14:30
> **Authority**: `--auto-design` delegated resolutions; scope follows the user objective "deliver RD-06"
> **Policy version**: 1
> **Root invocation ID**: `yp-rd06-2026-11-10T14-24Z`
> **CodeOps Artifact Schema**: 1

## Scope baseline

- **Planning target**: RD-06 — React view, items/annotations, slots, inspector, tooltips, theming, controlled visibility/items/selection/filter, localization, print output and framework adapters.
- **Context artifacts**: RD-03, RD-04, RD-05, RD-06, RD-07, RD-08, renderer ADR 0001, M1 and M2 plan/implementation.
- **Modification set**: new plan documents, `packages/core/src/contracts.ts` plus exports, `packages/react/src/**`, React/core tests, React adapters, package exports, demo, Storybook story, E2E tests, API reports, docs, roadmap.
- **Explicitly out of this plan**: pointer gesture engine, marquee, drag/resize previews, keyboard selection matrix (RD-07); full command lifecycle, rollback, stale-response cancel, controlled-host undo (RD-08); full axe/screen-reader conformance (RD-09); performance/security gate suite (RD-10); full Storybook/API docs (RD-11); release (RD-12).

## Register

| # | Category | Ambiguity / Gap | Options Presented | Resolution | Status |
|---|----------|-----------------|-------------------|------------|--------|
| 1 | Scope | RD-06 references selection, commands and undo owned by RD-07/RD-08 | Defer the entire inspector command surface / implement the smallest command+selection contracts now / pull RD-07+RD-08 forward | **AI — delegated (AR-1):** implement all RD-06 ACs, including the smallest command/selection contracts needed by the inspector and public handle. Pointer gestures stay RD-07; rollback/stale-response lifecycle stays RD-08. | ✅ Resolved |
| 2 | Data | RD-04 "shared public contracts" (`PlannerSelection`, `PlannerCommand`, `CommandContext`, `CommandOutcome`, `ValidationResult`) were not delivered by M2 | Define in React / define in core / duplicate | **AI — delegated (AR-2):** define the canonical type-only contracts in `@blendsdk/year-planner-core`, matching RD-04 and RD-08 exactly. | ✅ Resolved |
| 3 | Technical | Selection state helpers and normalization | No helper / minimal helper / full RD-07 algebra | **AI — delegated (AR-3):** add `emptySelection()` and `selectionItemIds()` only. Date-range normalization and the modifier matrix remain RD-07. | ✅ Resolved |
| 4 | Theming | Exact token vocabulary and CSS variable naming | RD-06 list / CSS-in-JS / free-form | **AI — delegated (AR-4):** the 24 RD-06 token names map one-to-one to `--yp-<kebab-name>`; presets are typed; `createTheme` merges over `classic-blue`. | ✅ Resolved |
| 5 | Theming | Provider semantics | Required context / optional context / no context | **AI — delegated (AR-5):** `YearPlannerProvider` is optional; it supplies defaults to descendant planners. Explicit `display.theme`/`cssVars`/`style` win. | ✅ Resolved |
| 6 | Data | Controlled/uncontrolled precedence and warnings | Controlled wins + warn / throw / silent last-write | **AI — delegated (AR-6):** controlled prop wins; supplying both logs one development warning and ignores the default; no production log. | ✅ Resolved |
| 7 | Data | Visibility defaults and model changes | Seed once / reseed every render / ignore defaults | **AI — delegated (AR-7):** uncontrolled visibility is seeded once from `defaultVisibility` + model defaults; later model changes do not silently rewrite host intent. Controlled visibility is authoritative. | ✅ Resolved |
| 8 | Validation | When to validate items | Every render / on identity change / never | **AI — delegated (AR-8):** validate on input identity change, memoized; invalid entities are dropped with diagnostics forwarded to `onDiagnostic`, never blanking the view. | ✅ Resolved |
| 9 | Renderer | SVG shape plane in R1 | HTML only / HTML + internal SVG / public switch | **AI — delegated (AR-9):** HTML/CSS only in R1. ADR 0001 keeps an optional internal SVG plane for a later evidence-backed slice; no public renderer switch, no connector option. | ✅ Resolved |
| 10 | Geometry | Fragment coordinates with zoom | Scale design units / CSS transform / rebase core | **AI — delegated (AR-10):** `buildRibbonLayout` stays design-unit; the React layer multiplies x/width/y/height and row/band sizes by the effective zoom. | ✅ Resolved |
| 11 | Geometry | Zoom outside 0.75–1.5 | Clamp + diagnostic / throw / render | **AI — delegated (AR-11):** clamp to 0.75–1.5 and emit one `INVALID_RANGE` diagnostic through `onDiagnostic`. | ✅ Resolved |
| 12 | View | Scroll container and sticky headers | No container / auto max-height / host-controlled height | **AI — delegated (AR-12):** render an `overflow: auto` viewport with sticky header/footer; height is host-controlled through `style`/CSS, default `max-height: none`. | ✅ Resolved |
| 13 | Localization | Month/weekday/date formatting and zones | Host default locale / explicit defaults / UTC-only | **AI — delegated (AR-13):** `en-US` + `calendar: "gregory"` defaults; month/weekday/date numbers via `Intl`; date keys formatted in UTC to stay SSR-stable; timed tooltips use `displayTimeZone`. | ✅ Resolved |
| 14 | Rendering | Annotation ordering and composition with `getDateMeta` | Replace / overlay / ignore | **AI — delegated (AR-14):** `getDateMeta` supplies the base cell background/text/label; annotations overlay their label/fill; annotation priority orders annotations only. No invented holidays. | ✅ Resolved |
| 15 | Rendering | Tooltip placement | Portal / fixed overlay / inline | **AI — delegated (AR-15):** one fixed-position overlay inside the root, positioned from the focused/hovered element's bounding rect; no portal, no DOM mutation outside the component. | ✅ Resolved |
| 16 | Rendering | Overflow popover behavior | Per-fragment / per-row button / inspector only | **AI — delegated (AR-16):** one button per row with overflow; opens a popover listing deduplicated items in first-fragment order; Escape/outside click closes; hidden items never listed. | ✅ Resolved |
| 17 | State | Inspector open/close semantics | Always open / selection-only / explicit+local | **AI — delegated (AR-17):** rendered when `showInspector !== false`; local `openInspector` opens it; a close button hides it until selection changes or the handle reopens it. | ✅ Resolved |
| 18 | Commands | RD-06 command pipeline depth | Inspector-only local apply / host callbacks + timeout / full RD-08 | **AI — delegated (AR-18):** local editability/version checks → optional `validateChange` → optional `onChangeRequest` with request ID and timeout → local apply in uncontrolled mode. Rollback, stale-response cancellation and controlled undo stay RD-08. | ✅ Resolved |
| 19 | Commands | Delete confirmation | Always confirm / host hook / no confirm | **AI — delegated (AR-19):** call `interaction.confirmChange` when supplied; otherwise use `window.confirm` when available; otherwise reject with `CONFIRMATION_UNAVAILABLE`. | ✅ Resolved |
| 20 | Commands | Undo/redo in RD-06 | Unsupported / uncontrolled snapshot / full history | **AI — delegated (AR-20):** uncontrolled mode keeps a bounded snapshot undo/redo stack for inspector/handle commands; controlled mode rejects with `UNDO_UNAVAILABLE`. RD-08 owns the full lifecycle. | ✅ Resolved |
| 21 | Commands | Inspector action semantics | No default actions / fixed simple transforms / host-only | **AI — delegated (AR-21):** default inspector provides delete, move ±1 week (matching RD-07 AC11), resize end ±1 day, paint/erase using selected dates (or the item period), and create using selected dates (or the focused date). All go through `requestCommand`. | ✅ Resolved |
| 22 | Slots | Structural slot replacement boundary | Replace semantic element / wrap inner content / unsupported | **AI — delegated (AR-22):** structural `components` wrap inner content; the component keeps the outer element, refs, ARIA, `data-yp-part`, focus and hit surface. Render slots are additive inside owned surfaces. | ✅ Resolved |
| 23 | Print | Actual multi-page output | CSS pagination only / hidden print pages from M2 plan / PDF service | **AI — delegated (AR-23):** render a hidden print tree built from `planRibbonPrint`; each page gets its planned uniform scale and a page break. Screen remains one continuous grid. | ✅ Resolved |
| 24 | SSR | Server/client stability | Client-only / explicit defaults / suppress hydration | **AI — delegated (AR-24):** no `window`/`document` during render; effects and observers only after mount; explicit locale/zone defaults; stable `useId`-based IDs. | ✅ Resolved |
| 25 | Security | Untrusted metadata and inline styles | Trust metadata / allow style attributes / sanitize | **AI — delegated (AR-25):** only typed host presentation inputs (`style`, `cssVars`, theme tokens, `getDateMeta`, item `style`/`className`/colors) may supply CSS; item style passes an allowlist and `url()`/`expression()`/`javascript:` values are dropped. `metadata` is never interpreted, rendered as HTML or used for URLs. CSP documentation covers `style-src-attr 'unsafe-inline'`. | ✅ Resolved |
| 26 | Process | Verify and commit mode | `pnpm verify` / `pnpm verify:full` | **AI — delegated (AR-26):** `pnpm verify` per task, `pnpm verify:full` at phase and plan completion; `git commit -s` and push after each verified task per the user objective. | ✅ Resolved |
| 27 | Testing | AC3 requires actual Fluent/MUI Buttons, but the repo has no Fluent/MUI dependency | Add dev dependencies / slot fixture + adapters / skip AC3 | **AI — delegated (AR-27):** verify the structural contract with host `<button>` fixtures in `renderCell`/`renderInspector` and the adapter mappings; actual Fluent/MUI example components remain RD-11 (Should Have) because adding those packages would add a large dev-only dependency outside RD-06. AC3 is recorded as partially evidenced, not fully claimed. | ✅ Resolved |
| 28 | API | Existing `YearPlannerTheme` is a preset string; RD-06 redefines it as a token object and drops `units` | Break without note / keep aliases / new names | **AI — delegated (AR-28):** follow RD-06 (`YearPlannerTheme` = token object, `YearPlannerThemeName` = preset). Keep `YearPlannerDisplay`/`YearPlannerPrint` aliases and the additive `units` prop for compatibility; document the pre-1.0 break and migration in `README.md` and a changeset. | ✅ Resolved |
| 29 | Diagnostics | Added codes were scattered and RD-08 names differ | Scattered lists / one table / reuse core codes | **AI — delegated (AR-29):** one diagnostic table owns every RD-06 code and its core-to-public mapping; `READ_ONLY`, `STALE_REVISION`, `INVALID_PAINT_TARGET`, `INVALID_COMMAND`, `CONFIRMATION_UNAVAILABLE`, `COMMAND_TIMEOUT`, `HOST_REJECTED`, `VALIDATION_ERROR`, `UNDO_UNAVAILABLE`, `INVALID_LOCALE`, `TIMED_EDITING_UNSUPPORTED` are RD-06 public codes. Core `NOT_EDITABLE`/`STALE_VERSION`/`INVALID_PAINT_CHANNEL` map to them at the React boundary. | ✅ Resolved |

## Delegated resolution provenance

### AR-1 — RD-06 boundary against RD-07/RD-08

```text
Authority: AI — delegated by --auto-design
Eligibility: implementation boundary inside the confirmed RD-06 requirement.
Objective: deliver every RD-06 acceptance criterion without pre-empting the interaction and full command slices.
Decision: implement selection/command contracts and the inspector request pipeline; keep pointer gestures, marquee, drag previews, rollback and stale-response lifecycle in RD-07/RD-08.
Evidence: RD-06 AC14–AC17 require controlled items, inspector actions and a shared read-only pipeline; RD-07/RD-08 own gestures and lifecycle.
Rejected alternatives: defer all commands (fails AC15–AC17); pull RD-07/RD-08 forward (scope expansion and rework).
Strongest counterargument: a minimal pipeline risks diverging from RD-08.
Confidence: Med — the pipeline is shaped from RD-08's contract so RD-08 can extend it.
Hardening: contract-first types and tests; RD-08 replaces the internals without changing props.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-08 defines an incompatible command lifecycle or RD-07 needs a different selection contract.
```

### AR-2 — Canonical contracts in core

```text
Authority: AI — delegated by --auto-design
Eligibility: module placement of already-specified public types.
Objective: one canonical definition of selection and command types.
Decision: type-only `contracts.ts` in core, re-exported from the core barrel; React imports types only.
Evidence: RD-04 says these types are canonical there; M2 omitted them; RD-07/RD-08 consume the same shapes.
Rejected alternatives: React-local types (breaks RD-04); duplicate definitions (drift).
Strongest counterargument: core grows without runtime behavior.
Confidence: High — type-only, no dependency or renderer coupling.
Hardening: API report and typecheck; no runtime import from React.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: a requirement puts contracts in a separate package.
```

### AR-4 — Theme token contract

```text
Authority: AI — delegated by --auto-design
Eligibility: internal token naming and preset values.
Objective: stable CSS-variable theming with typed presets.
Decision: 24 RD-06 token names map one-to-one to `--yp-<kebab>`; presets are complete token sets; `createTheme` merges over classic-blue.
Evidence: RD-06 names the tokens and requires CSS variables plus five presets.
Rejected alternatives: free-form token map (weak typing); CSS-in-JS (runtime dependency).
Strongest counterargument: 24 tokens may be more than R1 needs.
Confidence: High — mirrors the RD-06 list exactly.
Hardening: unit tests assert every token renders as a variable and presets keep geometry identical.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-11 needs additional documented tokens.
```

### AR-7 — Visibility seeding

```text
Authority: AI — delegated by --auto-design
Eligibility: state-initialization mechanism inside RD-04 precedence.
Objective: predictable controlled/uncontrolled behavior.
Decision: uncontrolled visibility is seeded once from the preset plus model defaults; controlled state is authoritative.
Evidence: RD-04 visibility is presentation state; silently reseeding would discard host intent.
Rejected alternatives: reseed every render (loses toggles); ignore model defaults (breaks RD-04 Should Have).
Strongest counterargument: new layers with defaultVisible false will not be hidden after mount.
Confidence: High — matches React controlled-state norms.
Hardening: tests pin first-render behavior and controlled precedence.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: a requirement to auto-apply defaults on every data change.
```

### AR-9 — HTML-only R1 renderer

```text
Authority: AI — delegated by --auto-design
Eligibility: renderer mechanism already gated by ADR 0001.
Objective: ship the canonical renderer without exposing unstable geometry.
Decision: HTML/CSS grid; no public switch; no SVG plane or connectors in this slice.
Evidence: ADR 0001 selects HTML as canonical and keeps SVG optional; RD-06 forbids a public renderer switch.
Rejected alternatives: internal SVG now (adds untested geometry); public switch (unstable API).
Strongest counterargument: cross-row ribbons are sharper in SVG.
Confidence: High — HTML is the accepted baseline.
Hardening: screenshot/print tests; SVG can be added behind an internal flag later.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: an RD-06 revision requires the SVG plane.
```

### AR-10 — Zoom mapping

```text
Authority: AI — delegated by --auto-design
Eligibility: coordinate-transform mechanism.
Objective: hit-testing and visuals stay aligned at every zoom.
Decision: scale design-unit geometry by the effective zoom in React; core descriptors stay unscaled.
Evidence: M2 hit tests use design coordinates; CSS transform would desynchronize pointer math.
Rejected alternatives: CSS transform only (breaks pointer mapping); core zoom parameter (leaks renderer concern).
Strongest counterargument: recomputing scaled fragments adds React work.
Confidence: High — one transform function, tested at 0.75/1.0/1.5.
Hardening: hit-point unit tests at each zoom.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-07 introduces a canvas transform.
```

### AR-18 — Command pipeline depth

```text
Authority: AI — delegated by --auto-design
Eligibility: lifecycle subset required by RD-06 AC15–AC17.
Objective: inspector and handle commands behave like a real host-controlled pipeline.
Decision: local checks → host validation → host request (request ID + timeout) → apply in uncontrolled mode. No rollback state machine or stale-response cancellation.
Evidence: RD-06 AC17 explicitly requires a shared validation/read-only pipeline; RD-08 will add rollback/cancel.
Rejected alternatives: local-only mutations (bypass host validation); full RD-08 now (scope).
Strongest counterargument: partial lifecycle can mislead hosts.
Confidence: Med — callbacks and diagnostics are explicit; RD-08 extends rather than replaces.
Hardening: contract tests for accepted, rejected, timeout and read-only paths.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-08 changes callback signatures or rejection semantics.
```

### AR-23 — Print tree

```text
Authority: AI — delegated by --auto-design
Eligibility: rendering mechanism inside RD-05 print planning.
Objective: produce real 1/2/3-page A3 output that matches the core plan.
Decision: hidden print tree with one page per `PrintPage`, per-page scale, page breaks.
Evidence: M2 `planRibbonPrint` returns page rows and scale; CSS pagination alone cannot apply per-page scales.
Rejected alternatives: browser pagination only (scale mismatch); PDF service (dependency).
Strongest counterargument: duplicated DOM increases render cost.
Confidence: High — deterministic from the existing plan.
Hardening: Chromium PDF page-count/size tests for 14/24/36 months.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-10 moves print to a dedicated exporter.
```

### AR-25 — Style trust boundary

```text
Authority: AI — delegated by --auto-design
Eligibility: security mechanism inside RD-06's security section.
Objective: no CSS/HTML injection from item metadata.
Decision: only typed host props and theme tokens produce inline styles; metadata is never rendered.
Evidence: RD-06 forbids raw HTML and untrusted style/URL values.
Rejected alternatives: allow metadata.style (injection); sanitize free-form CSS (fragile).
Strongest counterargument: hosts may want per-item styling from metadata.
Confidence: High — explicit security requirement.
Hardening: tests assert metadata strings never reach the DOM as HTML or CSS.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: a sanitizer contract is added.
```

### AR-27 — AC3 evidence boundary

```text
Authority: AI — delegated by --auto-design
Eligibility: test-evidence mechanism, not product behavior.
Objective: prove host design-system buttons can render without breaking the proxy contract without adding large dependencies.
Decision: use host <button> fixtures in renderCell/renderInspector and adapter mapping tests; actual Fluent/MUI package components stay RD-11 examples.
Evidence: RD-06 forbids mandatory Fluent/MUI dependencies; the repo has neither package; AC3's structural risk is nested interactive controls.
Rejected alternatives: install Fluent/MUI (large dev-only dependency); skip AC3 silently (dishonest).
Strongest counterargument: a plain button is not a Fluent Button.
Confidence: Med — structural contract is proven; library-specific rendering is not.
Hardening: explicit partial-claim note in the test report; RD-11 owns examples.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-11 adds the example stories/packages.
```

### AR-28 — Pre-1.0 API migration

```text
Authority: AI — delegated by --auto-design
Eligibility: API naming/compatibility mechanism.
Objective: follow RD-06's theme shape without silently breaking existing consumers.
Decision: YearPlannerTheme becomes the token object; presets use YearPlannerThemeName; keep Display/Print aliases and the additive units prop.
Evidence: current API exposes a preset string and ClassicYearLayoutOptions.units; RD-06 redefines the theme.
Rejected alternatives: silent break (hostile); keep the old meaning (contradicts RD-06).
Strongest counterargument: two names for presets adds ceremony.
Confidence: High — pre-1.0 and documented.
Hardening: changeset + README migration note + API report review.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: a 1.0 compatibility policy is adopted.
```

### AR-29 — Diagnostic name mapping

```text
Authority: AI — delegated by --auto-design
Eligibility: public error vocabulary.
Objective: one stable public code per failure class while reusing M2 helpers.
Decision: map core NOT_EDITABLE/STALE_VERSION/INVALID_PAINT_CHANNEL/UNKNOWN_REFERENCE/INVALID_RANGE to public READ_ONLY/STALE_REVISION/INVALID_PAINT_TARGET/INVALID_COMMAND at the React boundary.
Evidence: RD-08 names STALE_REVISION and READ_ONLY-like failures; M2 already emits typed core codes.
Rejected alternatives: expose core codes (confusing API); rename core codes (breaks M2).
Strongest counterargument: two vocabularies require a mapping table.
Confidence: High — mapping is explicit and tested.
Hardening: table in 03-04 and a test per mapped code.
Policy version: 1 · Root invocation ID: yp-rd06-2026-11-10T14-24Z
Reopen triggers: RD-08 collapses the vocabularies.
```

## Resolution notes

- All rows are eligible technical mechanisms inside the confirmed RD-06 behavior; no row expands product scope. AR-27 records the one reduced evidence claim (actual Fluent/MUI package components) and AR-28 records the intentional pre-1.0 API break.
- No new dependency, service, infrastructure or generalized framework is added. Fluent/MUI adapters are pure mapping functions with optional peers.
- RD-07/RD-08 retain pointer gestures, selection algebra, rollback and full command lifecycle.

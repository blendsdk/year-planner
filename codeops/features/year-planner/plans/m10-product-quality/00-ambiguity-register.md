# Ambiguity Register: Product Quality — Fit, Performance and Interaction Polish

> **Status**: ✅ GATE PASSED — 39 resolved, 0 open
> **Last Updated**: 2026-11-13 00:20
> **Policy**: `--auto-design` active — eligible technical decisions delegated; product scope, priorities, acceptance criteria and release timing remain user-owned

| # | Category | Ambiguity / Gap | Options Presented | Decision | Status |
|---|----------|-----------------|-------------------|----------|--------|
| AR-1 | Scope | Which work this plan covers | RD-13 only / RD-13 plus new planning features / release as-is | **RD-13 only.** Fit, performance, typography, host-owned context menus and demos. No recurrence, dependencies, RTL, milestones or other planning capability. | ✅ Resolved — user approved six-phase scope |
| AR-2 | Data & state | Which version is published first | Publish `0.2.0` now / publish `0.3.0` after this milestone / skip publication | **`0.3.0` is the first published version.** `0.2.0` remains unpublished history. `0.3.1` is the first provenance-signed release through OIDC. | ✅ Resolved — user approved six-phase scope |
| AR-3 | Non-functional | Supported performance data size and metric definitions | 500 / 2,000 / 10,000 items; frame delta vs input delay vs work time | **2,000 items supported; 10,000 is a documented stress case.** Unthrottled gate: 500-item initial render p95 ≤150 ms, 2,000-item drag **main-thread work per frame ≤8 ms** with input-delay p95 ≤16.7 ms, click-to-select **work** p95 ≤50 ms. 4× CPU-throttled numbers are diagnostics, not the gate. Phase 0 measured input delay at ~16 ms; the work metric is the primary gate. | ✅ Resolved — user scope + technical metric clarification |
| AR-4 | Technical unknowns | Renderer strategy | Optimize React / imperative renderer / vanilla rewrite / canvas | **Keep React; optimize algorithmically; use imperative refs for transient drag previews only.** A rewrite does not fix the superlinear algorithmic cost and risks accessibility/print. | ✅ Resolved — user approved "no rewrite" |
| AR-5 | UX & presentation | How the grid fits a host region | CSS transform scale / one uniform scale / two-dimensional fit / auto-reduce months | **Two-dimensional fit: horizontal column scale plus a vertical lane budget, with 24 px cells and 24 px item proxies.** At the smallest region the budget is one visible lane and the rest go to overflow. No transform scale; no silent month reduction. | ✅ Resolved — user scope + technical correction |
| AR-6 | UX & presentation | Default fit behavior | `none` / `contain` | **`contain` is the default.** The component is expected to work embedded; hosts can opt out. | ✅ Resolved — user approved six-phase scope |
| AR-7 | Behavioral | What happens when the minimum readable size still does not fit | Clip / shrink below 24 px / scroll | **Scroll inside the component viewport.** Never clip and never drop below 24 px. | ✅ Resolved — user approved six-phase scope |
| AR-8 | Technical unknowns | Scaling mechanism | `transform: scale` / unit recomputation / CSS zoom | **Unit recomputation.** Text stays crisp and hit targets stay measurable. CSS `zoom` is not used because it behaves differently across engines. | ✅ Resolved — delegated |
| AR-9 | Naming & terminology | Fit prop name and values | `fit` / `fitToContainer` / `autoFit` | **`display.fit: "none" \| "contain"`.** Short, explicit and consistent with `DisplayConfig`. | ✅ Resolved — delegated |
| AR-10 | Data & state | Unit-profile values | Several candidate scales | **Lane height is 24 px in every profile** (the interactive floor). Start from comfortable 55/40/70/90, compact 34/28/48/64, dense 26/24/36/51; lane tops 18/16/14. The dense profile shows one lane at 1280 x 800. Tune in Phase 2. | ✅ Resolved — delegated (preflight correction) |
| AR-11 | UX & presentation | Typography scope | Full redesign / header-only / no change | **Header-only polish plus tokens.** The user finds cell text acceptable; month/year labels and day names are the complaint. | ✅ Resolved — user approved six-phase scope |
| AR-12 | Naming & terminology | Typography token names | Per-element variables / a single scale | **Per-element variables**: `--yp-font-size-heading`, `--yp-font-size-month`, `--yp-font-size-day`, `--yp-font-size-cell-label`, plus line-height tokens. | ✅ Resolved — delegated |
| AR-13 | Integration points | Context-menu ownership | Built-in menu / host-owned callback / no menu | **Host-owned callback.** The component raises a request; Fluent and MUI render their own menus. No new design-system dependency. | ✅ Resolved — user approved six-phase scope |
| AR-14 | Naming & terminology | Context-menu prop name | `onContextMenu` / `onContextMenuRequest` / `onItemContextMenu` | **`onContextMenuRequest`.** It avoids colliding with React's DOM handler and states that the host owns the menu. | ✅ Resolved — delegated |
| AR-15 | Behavioral | Keyboard context-menu trigger | Shift+F10 only / Shift+F10 + ContextMenu key / none | **Shift+F10 and the ContextMenu key** raise the same request with `source: "keyboard"` and the focused element's rect. | ✅ Resolved — delegated |
| AR-16 | Behavioral | Right-click selection semantics | Select item first / leave selection unchanged | **Select an unselected item first, then raise the request; no gesture starts.** This matches desktop convention and gives the host a stable selection. | ✅ Resolved — delegated |
| AR-17 | Behavioral | Native menu fallback | Always prevent default / prevent only with handler | **Prevent default only when `onContextMenuRequest` is provided.** Without a handler the browser menu remains available. | ✅ Resolved — delegated |
| AR-18 | UX & presentation | Storybook structure | Replace the catalogue / add Demos and keep the existing catalogue / retitle to Reference/API | **Add a Demos section first and keep the existing `Year Planner/NN` catalogue as the Reference surface.** Retitling is not required because it would break the RD-11 required-story contract; the deviation is recorded in RD-13 and the plan. | ✅ Resolved — user scope + technical correction |
| AR-19 | UX & presentation | How demos make interaction visible | Static args / `play` functions / event log | **`play` functions plus an event-log playground.** The log makes every callback visible, which directly fixes "I click and nothing happens". | ✅ Resolved — delegated |
| AR-20 | UX & presentation | Story descriptions | Only demos / every story | **Every story gets a one-line description.** Redundant variants may be merged only when the state remains represented. | ✅ Resolved — user approved six-phase scope |
| AR-21 | Integration points | Demo layout | Full-page planner / bounded app shell | **Bounded app shell** with header, sidebar and footer; the planner scrolls inside its region. | ✅ Resolved — delegated |
| AR-22 | Technical unknowns | Performance measurement protocol | Dev server / production build / both | **Production build with 4× CPU throttling**, five fresh loads for initial render, frame deltas during drag, and a click-to-select metric. The dev project remains a report-only comparison. | ✅ Resolved — delegated |
| AR-23 | Technical unknowns | Click-to-select metric definition | Pointerdown to handler / pointerdown to next paint | **Pointerdown timestamp to two animation frames after pointer-up**, computed in the page. It approximates perceived click-to-paint latency. | ✅ Resolved — delegated |
| AR-24 | UX & presentation | Visual baseline sizes | One size / three sizes | **1280 × 800, 1440 × 900 and 1024 × 768.** These cover the embedded laptop, large laptop and small laptop cases. | ✅ Resolved — delegated |
| AR-25 | Scope | Issue #4 auto-fit | Resolve now / defer / close as won't-have | **Resolve through the `fit` contract.** The issue's expected outcome is the container-aware fit behavior; close it when the plan closes. | ✅ Resolved — user approved six-phase scope |
| AR-26 | Security & compliance | Manual NVDA/VoiceOver audit | Run now / keep parked | **Keep parked.** No AT host is available; no WCAG conformance claim is made. | ✅ Resolved — prior user decision |
| AR-27 | Data & state | Release-document updates | Leave `0.2.0` text / update to `0.3.0` | **Update `docs/releasing.md`, `docs/migration.md` and `docs/test-report.md`** to the `0.3.0` bootstrap and `0.3.1` provenance sequence. | ✅ Resolved — delegated |
| AR-28 | Data & state | Changelog handling for unpublished `0.2.0` | Rewrite history / keep the section / merge into initial release | **Keep the `0.2.0` section as unpublished history; `0.3.0` adds the quality changes.** No history rewrite. | ✅ Resolved — delegated |
| AR-29 | Dependencies | New dependencies | Add a menu library / add a measurement library / none | **No new runtime dependency.** Fluent UI and MUI are added as **dev-only** dependencies of the private Storybook app for the context-menu examples; the library package stays dependency-free. | ✅ Resolved — delegated (preflight correction) |
| AR-30 | Behavioral | Fit effect on print | Apply fit to print / leave print unchanged | **Print is unchanged.** Fit is a screen concern; A3 pagination keeps its own geometry. | ✅ Resolved — delegated |
| AR-31 | Behavioral | Interaction between `fit` and `zoom` | Fit wins / zoom wins / compose on both axes | **In fit mode `zoom` multiplies the horizontal column scale only**, clamped to the 24 px column floor; vertical geometry is fit-driven. In `fit: "none"`, `zoom` keeps its current two-axis behavior. | ✅ Resolved — delegated (preflight correction) |
| AR-32 | UX & presentation | What happens to the 174 existing stories | Delete / keep / curate | **Keep the catalogue; curate only redundant variants that duplicate a represented state.** | ✅ Resolved — delegated |
| AR-33 | Integration points | Where baseline evidence lives | Plan folder / `docs/benchmarks` / temporary only | **`docs/benchmarks/rd13-baseline.md` plus JSON results and three screenshots**; temporary profiler output stays in `$CODEOPS_TMPDIR`. | ✅ Resolved — delegated |

| AR-34 | Integration points | Where the context-menu listener lives | Grid root / item overlay / component root | **The component root (`.yp-root`)** resolves targets inside the grid and overlay. A listener on `.yp-grid` cannot see item proxies because the overlay is a sibling. | ✅ Resolved — delegated (preflight correction) |
| AR-35 | Behavioral | Item/annotation request date and annotation kind | Fragment start / pointer day / optional | **The date is the day under the pointer.** Annotation fragments are resolved before item proxies (or via the existing `classifyTarget`) so `kind: "annotation"` is reachable. | ✅ Resolved — delegated (preflight correction) |
| AR-36 | UX & presentation | Story description helper and existing contract | Helper without annotation / helper with `: Story` / literals | **Keep `export const X: Story = story(...)`**, deep-merge `parameters.docs`, and update the contract parser to recognize the helper's story-level description. | ✅ Resolved — delegated (preflight correction) |
| AR-37 | Non-functional | How new performance targets are gated | Status-only / explicit strict assertions / baseline ratio | **Add explicit `PERF_STRICT=1` assertions for the new absolute targets** in addition to recorded status. Report mode stays evidence-only. | ✅ Resolved — delegated (preflight correction) |
| AR-38 | UX & presentation | Existing visual baselines after the default fit | Ignore / rebaseline / pin `fit:"none"` | **Rebaseline the existing Playwright visual suite**, update the zoom assertion to the composed scale, and pin the benchmark route to `fit:"none"` so before/after performance is comparable. | ✅ Resolved — delegated (preflight correction) |
| AR-39 | Data & state | Proving `0.2.0` was never published | Offline assertion / manual registry attestation / skip | **Record a manual `npm view` attestation in the test report and mark RD-13 AC8 `partial` until the owner runs it.** No network call is added to the suite. | ✅ Resolved — delegated (preflight correction) |

## Resolution Notes

### Authority summary

- AR-1, AR-2, AR-3, AR-5, AR-6, AR-7, AR-11, AR-13, AR-18, AR-20 and AR-25 are
  **user-owned product scope, priority and acceptance decisions**, approved
  through the six-phase scope and the "no rewrite" decision.
- AR-4 is the user's explicit renderer decision: keep React, allow imperative
  drag previews, reject vanilla/canvas rewrites.
- AR-26 repeats the prior user decision that the manual assistive-technology
  audit stays parked.
- AR-8 through AR-10, AR-12, AR-14 through AR-17, AR-19, AR-21 through AR-24
  and AR-27 through AR-33 are **eligible technical decisions** inside RD-13.
  They add no product capability, no runtime dependency and no paid service.

### Delegated provenance

```text
Authority: AI — delegated by --auto-design
Eligibility: fit algorithm, unit profiles, typography tokens, context-menu interface,
  story-demo structure, measurement protocol, baseline artifact layout and release-document
  updates inside RD-13
Objective: make the planner fit real application regions, feel responsive at the supported
  data size, look polished, expose host-owned context menus and demonstrate itself — without
  a renderer rewrite or a new runtime dependency
Evidence: RD-13; RD-03, RD-06, RD-07, RD-09, RD-10, RD-11 and RD-12; packages/core/src/layout/
  classic-year.ts:146-152 (default units); packages/react/src/geometry.ts:13-20 (zoom 0.75-1.5);
  packages/react/src/theme.ts:49-53 (units); packages/react/src/styles.css:159-168 (14 px and
  18 px header sizes); packages/react/src/render/MonthRow.tsx:123 (uncentred label); no
  contextmenu handler in packages/react/src; 174 stories, 4 play functions, 1 component description and 1 story description;
  docs/performance.md:12-21 (414 ms at 500 items, 50,458 ms at 10,000); tests/perf/bench.spec.ts
  (existing production harness); docs/benchmarks/rd10-baseline.json
Rejected alternatives: named per row above
Strongest counterargument: a vanilla or canvas renderer could make the drag hot path faster
  and might simplify the React tree. But the measured curve is superlinear in item count, which
  a renderer swap does not fix, and the product's accessibility and print contract depends on
  semantic HTML. The chosen path fixes the algorithm first and keeps the imperative escape hatch
  for the one genuinely hot path.
Confidence: High — every target is measurable with the existing harness; the product decisions
  are user-approved; the technical choices reuse existing tokens, props and tests
Hardening: two independent preflight auditors will re-check the performance curve, the fit
  arithmetic, the 24 px floor, the context-menu contract and the Storybook mandate against the
  repository before execution
Policy version: 1
Root invocation ID: rd13-product-quality-2026-11-12
Reopen triggers: the Phase 0 profile shows React reconciliation dominating the superlinear cost;
  the 1280 x 800 fit target requires cells below 24 px; a second maintainer asks for a built-in
  menu; npm trusted publishing becomes available for new packages before the first release
```

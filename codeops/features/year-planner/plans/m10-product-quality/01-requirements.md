# Requirements: Product Quality

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-13](../../requirements/RD-13-product-quality.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-13 Must Have — host-region fit with a horizontal column scale and a
  vertical lane budget, 24 px cells and item proxies, one visible lane at the
  smallest region, centred header typography with tokens, production
  performance targets, host-owned context-menu contract, Storybook demos and
  event log, and the intended `0.3.0` first publication.
- RD-13 Should Have — three Playwright visual baselines, a CPU-throttle
  diagnostic profile, a work-time click metric and a bounded app-shell demo.
- RD-13 acceptance criteria 1–10.
- Issue #4 (auto-fit) is resolved by the `fit` contract and closed in Phase 5
  with the evidence link.

### Deferred / out of this plan

- Vanilla, canvas, WebGL or Web Component renderer — rejected by the user and
  by the arithmetic in `02-current-state.md`.
- Cells below 24 px, non-uniform scaling or CSS `transform: scale`.
- Automatic month-window reduction; the host chooses the visible range.
- A built-in context menu or a new design-system dependency.
- 10,000-item 60 fps support; it remains a documented stress case.
- New planning features and the manual NVDA/VoiceOver audit.
- Publishing `0.2.0` or any pre-release tag.

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| Fit prop | `display.fit: "none" \| "contain"`, default `contain` | AR-5, AR-6, AR-9 |
| Fit mechanism | Horizontal column scale + vertical lane budget; no transform scale | AR-5, AR-8 |
| Unit profiles | Lane 24 px in all profiles; comfortable 55/40/70/90, compact 34/28/48/64, dense 26/24/36/51 | AR-10 |
| Typography scope | Header and day-name polish; cell text unchanged; two-digit year in the band | AR-11 |
| Type tokens | Per-element `--yp-font-*` variables declared once in the theme root | AR-12 |
| Context-menu prop | `onContextMenuRequest` with `restoreFocus` | AR-14 |
| Context-menu listener | Component root, annotation first, pointer-day date | AR-34, AR-35 |
| Keyboard path | Shift+F10 and ContextMenu key, one deduped request | AR-15 |
| Right-click selection | Select item first; no gesture | AR-16 |
| Native fallback | `preventDefault` only with a handler; touch long-press ignored | AR-17, AR-34 |
| Storybook structure | Demos first; existing `Year Planner/NN` catalogue as Reference | AR-18, AR-32, AR-36 |
| Story dependencies | Fluent/MUI dev-only in the private Storybook app | AR-29 |
| Demo interaction | `play` functions plus an event log | AR-19 |
| Measurement | Production build; unthrottled gate, 4× CPU-throttle diagnostics | AR-22 |
| Drag metric | Input delay p95 (pointer event → handler) | AR-3 |
| Click metric | Pointer-down to selection commit (work time) | AR-23 |
| Visual sizes | 1280 × 800, 1440 × 900, 1024 × 768 | AR-24 |
| Baseline location | `docs/benchmarks/rd13-baseline.md` | AR-33 |
| First release | Intended `0.3.0`, then `0.3.1` provenance; AC8 partial until the registry attestation | AR-2, AR-27, AR-39 |

## Acceptance Criteria

RD-13 owns its acceptance criteria. This plan adds no plan-local ACs; every
RD-13 AC maps to a spec-test case in
[07-testing-strategy.md](07-testing-strategy.md) and to a row in
`00-traceability.md` during Phase 5. AC8 is expected to be `partial` because
“0.2.0 was never published” is a release-time registry fact.

## Security scope

| Concern | This plan |
| ------- | --------- |
| Authentication | N/A — client-side component; no backend or credentials. |
| Authorization | Visibility remains presentation, not authorization. Hidden items stay absent from the DOM and from context-menu requests. |
| Secrets | None. No new environment variable or token. |
| Injection | Context-menu requests are typed callbacks, not HTML strings. No new `dangerouslySetInnerHTML` or CSS injection path. |
| Data exposure | The request carries only an item/annotation identifier, a date key, coordinates and a rect — never item content or hidden fields. |
| Dependencies | No new runtime dependency; the measurement harness uses the existing Playwright installation. |
| Existing gates | `pnpm verify:full` and the security E2E suite remain required. |

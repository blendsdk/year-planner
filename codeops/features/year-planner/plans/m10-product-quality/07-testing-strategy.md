# Testing Strategy: Product Quality

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Fit arithmetic and profile selection | Every branch: profile choice, scale clamp, floor, zero-size container |
| Typography | Every header variable and the centred label geometry |
| Context menu | Every target kind, pointer and keyboard, native fallback, hidden items |
| Performance | Every target metric recorded with raw samples and a status |
| Storybook | Every story described; every demo has a play function |
| Release | `0.3.0` metadata, `0.3.1` provenance narrative, dry run |
| Existing product code | Unchanged thresholds; no regressions |

- Test names state behavior and repeat the `RD-13-AC-NN` ID where the test
  proves an acceptance criterion.
- Specification tests derive from RD-13 and the component documents, never from
  the implementation.
- Performance targets are phase proofs run by the Playwright harness, not
  Vitest assertions; the harness records raw samples so a result is auditable.
- No production behavior changes to make a test pass.

## Test Slices & Groups

The existing `codeops/test-map.json` owns the files:

| Slice | Tier | Test Files | Sources | Gate |
| ----- | ---- | ---------- | ------- | ---- |
| `react` | task | `packages/react/src/fit.spec.test.tsx`, `context-menu.spec.test.tsx`, existing React suites | `packages/react/src/**` | task |
| `verification` | task | `tests/quality/fit-contract.spec.test.ts`, `storybook-contract.spec.test.ts`, release contracts | `tests/quality/**` | task |
| `verification` | release | `tests/e2e/fit.spec.ts` (new, added to `e2e.visual`) | `packages/react/src/styles.css`, `render/**`, `theme.ts` | release |
| `verification` | release | `tests/e2e/interaction.spec.ts`, `commands.spec.ts` | `interaction/**`, `commands/**` | release |
| `verification` | release | `tests/perf/bench.spec.ts` | `YearPlanner.tsx`, `render/**`, `interaction/**` | release |

Task verification for fit, typography and interaction work runs `pnpm verify`
plus the affected release group (`e2e.visual`, `e2e.interaction` or
`perf.bench`), because styles and render changes are release-tier sources.
Phase gates run `pnpm verify:full`; the plan gate is `pnpm verify:full`.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-13 and the component documents. They are the
> oracle. If an artifact does not match, the artifact is wrong.

### Fit and typography

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | `fit="contain"`, host region 1280 × 800, 14 months | The grid fits with no page or `.yp-viewport` scroll; one visible ribbon lane is rendered; every cell and item proxy is at least 24 × 24 CSS px | RD-13 AC1; AR-5 |
| ST-2 | `fit="contain"`, host region 1024 × 768, 12 months | The grid fits (dense profile) or scrolls inside `.yp-viewport`; no cell or proxy is below 24 × 24 and no content is clipped | RD-13 AC2; AR-5, AR-7 |
| ST-3 | `fit="contain"`, host region 600 px wide, 12 months | The dense profile is used; the horizontal scale stops at the 24 px column floor; `.yp-viewport` scrolls horizontally | RD-13 AC2; AR-7 |
| ST-4 | `fit="none"` | Layout units and two-axis zoom behave exactly as today; no host-region measurement is applied | RD-13 AC1; AR-5 |
| ST-5 | `fit="contain"` + `zoom=0.75` | Zoom multiplies only the horizontal column scale and never makes a column or proxy smaller than 24 px; vertical geometry is fit-driven | RD-13 AC1; AR-31 |
| ST-6 | Host region reports width/height 0 (hidden tab) | The initial geometry is comfortable at scale 1; after the first valid observation the last valid geometry is kept; no crash and no NaN style | RD-13 AC1; AR-5 |
| ST-7 | Month band rendered at any profile | The month/year label's bounding box is centred within the band within 1 px on both axes, and `scrollWidth <= clientWidth` for the short month + two-digit year | RD-13 AC4; AR-11 |
| ST-8 | Default theme | `.yp-heading` and `.yp-month` computed font sizes equal the `--yp-font-size-heading` and `--yp-font-size-month` values | RD-13 AC4; AR-12 |
| ST-9 | Theme root and `styles.css` | The font tokens are declared once; no hard-coded header or band `font-size` remains in the header/band selectors | RD-13 AC4; AR-12 |
| ST-10 | Print A3, `fit="contain"` | Print page count and geometry equal the `fit="none"` output | RD-13 AC1; AR-30 |

### Performance

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-11 | Production build, **unthrottled**, 500 items, 14 months | Initial render p95 is ≤150 ms over five fresh loads; the 4×-throttled result is recorded as a diagnostic | RD-13 AC3; AR-3, AR-22 |
| ST-12 | Production build, **unthrottled**, 2,000 items, drag | Input-delay p95 (pointer event → handler) is ≤8 ms over at least 30 samples; the frame p95 stays within the 16.7 ms cadence budget | RD-13 AC3; AR-3 |
| ST-13 | Production build, 500 and 2,000 items, click | Pointer-down → selection commit p95 is ≤50 ms over five samples; the paint time is reported separately | RD-13 AC3; AR-23 |
| ST-14 | Baseline run | `docs/benchmarks/rd13-baseline.json` records raw samples, p50, p95, max, DOM nodes, fit mode and a status for every scenario, including 4× diagnostics | RD-13 AC3; AR-33 |
| ST-15 | Repository source | No canvas, WebGL, Web Component or vanilla renderer package is introduced; React remains the renderer; no `transform: scale`; 37 columns remain; no automatic month reduction | RD-13 AC10; AR-4, AR-5 |

### Context menu

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-16 | Right-click a date cell with a handler | One request with `target.kind="date"`, the cell date, the pointer coordinates, the cell rect and `source="pointer"` | RD-13 AC5; AR-13 |
| ST-17 | Right-click an unselected item proxy on a multi-day item | The item is selected first; one request with `target.kind="item"`, its ID and the **day under the pointer**; no gesture starts | RD-13 AC5; AR-16, AR-35 |
| ST-18 | Right-click an annotation proxy | One request with `target.kind="annotation"` and the annotation ID; the item branch does not win | RD-13 AC5; AR-35 |
| ST-19 | Right-click with no handler; touch long-press | No request; `preventDefault` is not called for the no-handler case; a touch-originated contextmenu is ignored | RD-13 AC5; AR-17, AR-34 |
| ST-20 | `Shift+F10` on a focused cell | Exactly one request with `source="keyboard"` and the focused cell's rect | RD-13 AC5; AR-15 |
| ST-21 | `ContextMenu` key on a focused item | Exactly one request with `source="keyboard"` and the item's rect; the browser contextmenu event is suppressed | RD-13 AC5; AR-15 |
| ST-22 | Right-click empty grid chrome | No request and no `preventDefault` | RD-13 AC5; AR-13 |
| ST-23 | Right-click a hidden item's former position | No item target is produced; a date target may be produced if a cell is under the pointer | RD-13 AC5; AR-13 |
| ST-24 | Inspect the request payload | It contains identifiers, a date, coordinates, a rect, the source and `restoreFocus` only; no title, content, hidden field or host data | RD-13 AC5; AR-13 |
| ST-25 | Right-click an item and move the pointer before release | The item does not move or resize; only the selection and request occur | RD-13 AC5; AR-16 |

### Storybook and release

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-26 | Demos group | At least six interaction stories plus the event log, each with a `play` function and an instruction line | RD-13 AC7; AR-19 |
| ST-27 | Every story export | Has a non-empty **story-level** description (literal or helper argument); component descriptions do not count | RD-13 AC7; AR-20, AR-36 |
| ST-28 | Event-log playground | Records selection, change request, committed/rejected change and context events with type, target and timestamp; no `onCommandOutcome` | RD-13 AC7; AR-19 |
| ST-29 | Context-menu stories | Fluent and MUI examples open a menu from a request and return focus on close | RD-13 AC6; AR-13 |
| ST-30 | Existing required stories | Every RD-11 required story still exists with its title and export | RD-13 AC7; AR-32 |
| ST-31 | Package manifests and changelogs | Both packages are `0.3.0`; the `0.3.0` bootstrap is the intended first publication. The “0.2.0 never published” fact is a manual registry attestation (AC8 `partial`) | RD-13 AC8; AR-2, AR-39 |
| ST-32 | `docs/releasing.md`, `docs/migration.md`, `docs/test-report.md`, `release-workflow.spec.test.ts` | Describe the `0.3.0` bootstrap and `0.3.1` provenance release; the release contract asserts `0.3.1`, not `0.2.1` | RD-13 AC8; AR-27 |
| ST-33 | `pnpm release:check` and `pnpm release:publish --dry-run` | Both pass; the tarballs contain `0.3.0` and the exact core dependency | RD-13 AC8; AR-2 |
| ST-34 | `package.json` | No new runtime dependency is added | RD-13 AC10; AR-29 |
| ST-35 | `pnpm verify:full` | Passes all existing and new suites | RD-13 AC9 |
| ST-36 | Playwright visual snapshots | Three sizes exist as `toHaveScreenshot` assertions and match the approved Phase 2 prototype; the docs images are evidence only | RD-13 AC1, AC4; AR-24, AR-38 |
| ST-37 | Natural-size model | The fitted height uses the actual ribbon row heights and the 1 px grid border, not `rows × rowHeight`; the model equals the rendered `.yp-grid` height within 1 px | RD-13 AC1; AR-5 |
| ST-38 | Issue #4 closure | The issue is linked to the fit contract and the closure evidence; the roadmap/traceability record it | RD-13 Must Have; AR-25 |
| ST-39 | Won’t-Have constraints | No `transform: scale` in fit code; no built-in menu dependency; no automatic month reduction; 37 columns unchanged | RD-13 AC10; AR-4, AR-5, AR-13 |

## Test Categories

### Specification Tests

| Test File | ST Cases Covered | Component |
| --------- | ---------------- | --------- |
| `packages/react/src/fit.spec.test.tsx` | ST-1–ST-6, ST-37 | Fit algorithm and component wiring |
| `packages/react/src/context-menu.spec.test.tsx` | ST-16–ST-25 | Context-menu contract |
| `tests/quality/fit-contract.spec.test.ts` | ST-7–ST-9, ST-39 | Typography tokens, CSS and Won’t-Have constraints |
| `tests/quality/storybook-contract.spec.test.ts` | ST-26–ST-30 | Storybook demos and descriptions |
| `tests/quality/release-metadata.spec.test.ts` | ST-31, ST-34 | Version and dependencies |
| `tests/quality/release-governance.spec.test.ts`, `release-workflow.spec.test.ts` | ST-32 | Release documents and the release contract |
| `tests/quality/release-pack.spec.test.ts` | ST-33 | Tarball and dry run |

### Implementation Tests

| Test File | Description | Priority |
| --------- | ----------- | -------- |
| `packages/react/src/fit.impl.test.tsx` | Profile edge cases, resize storms, invalid units, zoom composition | High |
| `packages/react/src/context-menu.impl.test.tsx` | Target resolution edge cases, handler errors, focus retention | High |
| `tests/quality/fit-contract.spec.test.ts` | CSS variable fallbacks, no hard-coded header sizes | Medium |

### Browser and Performance Proofs (not Vitest)

| Command | ST Cases | When |
| ------- | -------- | ---- |
| `pnpm exec playwright test tests/e2e/fit.spec.ts` | ST-1–ST-3, ST-7, ST-36 | Phase 2 and Phase 5 |
| `pnpm exec playwright test tests/e2e/print-matrix.spec.ts` | ST-10 | Phase 2 |
| `PERF_STRICT=1 pnpm test:perf` | ST-11–ST-13 | Phase 1 and Phase 5 |
| `pnpm bench --enforce` | ST-14 | Phase 1 and Phase 5 |
| `pnpm storybook:build` | ST-26–ST-29 | Phase 4 |
| `pnpm release:check` | ST-33 | Phase 5 |
| `pnpm release:publish --dry-run --allow-dirty` | ST-33 | Phase 5 |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| -------- | ----- | --------------- |
| Fit at 1280 × 800 | Open the demo at 1280 × 800, 14 months | No page or component scroll; one lane; cells and proxies ≥24 px |
| Fit at 1024 × 768 | Open at 1024 × 768, 12 months | Fit or internal scroll; cells and proxies ≥24 px |
| Context menu | Right-click a cell and an item | Request logged; no gesture |
| Keyboard menu | Focus a cell, press Shift+F10 | Keyboard request logged |
| Demos | Open each Demos story | Play function completes; event log visible |

## Test Data

### Fixtures Needed

- The shared `fixtures.ts` items, layers and groups for demos.
- The deterministic `scripts/bench-data.mjs` model at 500 and 2,000 items.
- Temporary `ResizeObserver` mocks in React tests; no browser required.
- Three screenshot sizes at 1280 × 800, 1440 × 900 and 1024 × 768.

### Mock Requirements

- `ResizeObserver` is mocked in JSDOM component tests; the browser E2E uses the
  real implementation.
- `getBoundingClientRect` is stubbed for keyboard context-menu tests.
- No npm or GitHub network call is added to the test suites.

## Verification Checklist

- [ ] All ST cases defined with concrete input/output pairs
- [ ] Every ST case traces to RD-13, a component doc or an AR entry
- [ ] Specification tests written before implementation
- [ ] Specification tests verified to fail before implementation
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover the fit and context-menu edge cases
- [ ] `pnpm verify` passes per phase; `pnpm verify:full` passes at plan completion
- [ ] Performance evidence is recorded in `docs/benchmarks/rd13-baseline.md`
- [ ] Visual baselines are recorded and approved
- [ ] No regressions in the existing suites

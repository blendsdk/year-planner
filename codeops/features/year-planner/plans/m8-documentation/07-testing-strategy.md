# Testing Strategy: Documentation, Storybook and API Reference

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Documentation contracts | Every RD-11 topic, required heading, link, claim and deferred item |
| Storybook contracts | Every RD-11 named state, PRT-01 story, wrapper story and viewport config |
| API contracts | Every public report entry, release tag, API-report gate and entry-point example |
| Docs-site contracts | Script, workflow, permissions, guard and relative-URL resolution |
| Docs-site checker | Happy path plus missing-artifact, broken-link and wrong-root failures |
| Existing product code | Unchanged thresholds; no product behavior changes |

- Test names state behavior and repeat the `RD-11-AC-NN` ID where the test proves
  an acceptance criterion.
- Specification tests derive from RD-11 and the plan documents, never from the
  implementation.
- Real-artifact proofs (`docs:site`, `storybook:build`) run as phase and CI
  commands, not inside the 30-second pre-build quality project.
- No production behavior is changed to make a test pass.

## Test Slices & Groups

The project map `codeops/test-map.json` owns all `tests/quality/**` files through
the `verification` slice. The new files need no map edit.

| Slice | Tier | Test Files | Sources | Depends On | Gate |
| ----- | ---- | ---------- | ------- | ---------- | ---- |
| `verification` | task | `tests/quality/docs-contract.spec.test.ts` | `README.md`, `DEFERRED.md`, `docs/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/demo-contract.spec.test.ts` | `apps/demo/**`, `docs/test-report.md` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/storybook-contract.spec.test.ts` | `apps/storybook/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/tsdoc-contract.spec.test.ts` | `packages/*/src/**`, `packages/*/etc/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/docs-site-contract.spec.test.ts` | `scripts/build-docs-site.mjs`, workflows | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/docs-contract.impl.test.ts`, `docs-site.impl.test.ts` | test helpers | `core.unit`, `react.unit` | task |
| `verification` | release | existing demo E2E tests | `apps/demo/**` | task groups | release |

`apps/**`, `scripts/**`, `package.json`, lockfiles, TypeDoc configs, API
Extractor configs and `packages/*/etc/**` are full-on paths in the map, so
Phases 2–5 task verification runs the full gate (AR-30). The plan states that
instead of claiming a fast slice.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-11, the plan specs and the ambiguity register. They
> are the oracle. If an artifact does not match, the artifact is wrong.

### Guide set

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | `docs/README.md` topic map | Has exactly the fourteen RD-11 topics; every mapped page exists with one H1 and the required H2 headings from `03-01` | RD-11 Must Have; AR-4 |
| ST-2 | Every relative markdown link in `README.md`, `DEFERRED.md` and `docs/**` | Resolves to an existing file or anchor | RD-11 AC7; AR-4 |
| ST-3 | `README.md` quickstart | One fenced `tsx` block imports the component and CSS, defines static 14-month items, holds selection and visibility in state, wires both callbacks, prints, and carries the honest packed-install note | RD-11 AC7; AR-5, AR-26 |
| ST-4 | `DEFERRED.md` | Lists all 23 deferred capabilities; no guide outside `DEFERRED.md`/`limitations.md` describes one as implemented | RD-11 AC9; AR-13 |
| ST-5 | Accessibility and performance pages | Normalized `Conformance claim: none` is present; the denylist (`is compliant`, `meets WCAG`, `conforms to`, `certified`) is absent; `targets WCAG 2.2 AA` and truthful negations are allowed | RD-11 AC10; AR-14 |
| ST-6 | `docs/performance.md` | Names the measured status and the initial-render and 10k-overflow misses; links `docs/test-report.md` | RD-11 AC10; AR-20 |
| ST-7 | Story count in `README.md`, `docs/getting-started.md`, `docs/test-report.md` | All three equal the parsed `export const ...: Story` count | RD-11 Must Have; AR-19 |
| ST-8 | Published docs and app assets | No `_reference/` path is published; every committed binary is in the documented allowlist | RD-11 AC12; AR-29 |

### Storybook

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-9 | Required story manifest in `03-02` | Every listed title/export pair exists; titles are unique | RD-11 AC2, AC11; AR-6 |
| ST-10 | `Year Planner/06 Print Planning/Prt01TwoThousandSeventeen` | Year 2017, `classic-yellow`, PRT-01 fixture, A3 paginate | RD-11 AC11; AR-6 |
| ST-11 | `Adapters` stories | `FluentWrapper` and `MuiWrapper` render `YearPlannerProvider` around a `YearPlanner` that receives the adapter `cssVars` | RD-11 AC2; AR-27 |
| ST-12 | `.storybook/preview.ts` | Named `parameters.viewport` entries exist; no `@storybook/addon-viewport` dependency | RD-11 Must Have; AR-23 |

### API reference

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-13 | Both checked-in API reports | Zero `(undocumented)` entries | RD-11 AC3; AR-10 |
| ST-14 | Every exported declaration in the reports | Carries `@public`, `@beta`, `@alpha` or `@internal` | RD-11 AC3; AR-10 |
| ST-15 | Both `api-extractor.json` files | `ae-missing-release-tag` is not `none` | RD-11 AC3; AR-10 |
| ST-16 | Both TypeDoc configs | `validation.notDocumented` and `treatValidationWarningsAsErrors` are enabled | RD-11 AC1, AC3; AR-10 |
| ST-17 | Named public entry points | A TypeScript-AST check binds `@example` to `YearPlanner`, `YearPlannerProvider` and `buildClassicYearLayout`; `createTheme` and `buildRibbonLayout` are verified | RD-11 AC3; AR-11, AR-12 |
| ST-18 | `pnpm verify` and the checked-in reports | `api-report:ci` runs in `verify`; both `.api.md` files exist | RD-11 AC4; AR-10 |

### Docs site

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-19 | `package.json` and `scripts/` | `docs:site` exists, targets the build script, and the script supports `--root`/`--check-only` | RD-11 AC1, AC6; AR-8 |
| ST-20 | `.github/workflows/pages.yml` | Uses the three Pages actions; least-privilege permissions; deploy guarded by manual dispatch, `deploy` input and `refs/heads/main`; no `pull_request_target` | RD-11 AC6; AR-9 |
| ST-21 | `.github/workflows/ci.yml` | A `docs-site` PR job runs `pnpm docs:site` and `--check-only` | RD-11 AC6; AR-9 |
| ST-22 | `pnpm docs:site -- --check-only` on a built artifact | Storybook index and API landing/core/react pages exist; every relative asset and landing link resolves on disk | RD-11 AC5, AC6; AR-8, AR-25 |
| ST-23 | `pnpm storybook:build` on a clean tree | Succeeds after `pnpm build`; relative `./` asset URLs resolve; no absolute base override | RD-11 AC1; AR-7, AR-24 |

### Demo and evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-24 | Demo routes | A shared navigation is rendered on the overview, commands, interaction, AC3, security and print routes | RD-11 AC8; AR-15 |
| ST-25 | README and getting-started | Document the demonstration routes, including `?security=1` | RD-11 AC8; AR-15 |
| ST-26 | `00-traceability.md`, checker and CLI | Thirteen RD-11 rows reach `proven`; checker and CLI default through RD-11 | Project traceability contract; AR-16, AR-31 |
| ST-27 | `docs/test-report.md` | Contains an RD-11 evidence section with commands, results and named gaps | RD-11 AC1, AC10; AR-20 |
| ST-28 | Fenced code blocks in the guides | No `dangerouslySetInnerHTML`, `innerHTML` or `__html` usage; fixtures are synthetic | RD-11 AC13; AR-29 |
| ST-29 | Asset provenance | No source photos or `_reference/` paths; generated Storybook/TypeDoc assets are allowlisted | RD-11 AC12; AR-29 |

## Test Categories

### Specification Tests (from ST-cases above)

| Test File | ST Cases Covered | Component |
| --------- | ---------------- | --------- |
| `tests/quality/docs-contract.spec.test.ts` | ST-1–ST-8, ST-28, ST-29 | Guide set, assets and example security |
| `tests/quality/demo-contract.spec.test.ts` | ST-24, ST-25, ST-27 | Demo routes and evidence report |
| `tests/quality/storybook-contract.spec.test.ts` | ST-9–ST-12 | Storybook |
| `tests/quality/tsdoc-contract.spec.test.ts` | ST-13–ST-18 | API reference |
| `tests/quality/docs-site-contract.spec.test.ts` | ST-19–ST-21 | Docs site and workflows |
| `tests/quality/traceability.spec.test.ts` | ST-26 | Traceability |

### Phase and CI proofs (not Vitest)

| Command | ST Cases | When |
| ------- | -------- | ---- |
| `pnpm storybook:build` | ST-23 | Phase 2 and `verify` |
| `pnpm docs:site` + `pnpm docs:site -- --check-only` | ST-22 | Phase 4, the PR `docs-site` job and the Pages build |

### Implementation Tests (edge cases, internals)

| Test File | Description | Priority |
| --------- | ----------- | -------- |
| `tests/quality/docs-contract.impl.test.ts` | Link extractor handles fences, anchors, external URLs and `DEFERRED.md` | High |
| `tests/quality/docs-site.impl.test.ts` | `--check-only --root` rejects a missing API tree, a wrong root and a broken landing link | High |
| `tests/quality/traceability.impl.test.ts` | Existing malformed/duplicate matrix cases; partial-to-proven transition | Medium |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| -------- | ----- | --------------- |
| Controlled demo rejection | Open `?commands=1`, select reject, move an item | Item keeps its source period; rejection is announced |
| Demo selection | Open the default route, select a date | Selection renders |
| Demo visibility | Open `?security=1` | Hidden item is absent from DOM, ARIA and the inspector |

These already exist in `tests/e2e/commands.spec.ts`,
`tests/e2e/interaction.spec.ts`, `tests/e2e/accessibility.spec.ts` (dynamic
hiding) and `tests/e2e/security.spec.ts` (the `?security=1` route); only the title
annotation changes.

## Test Data

### Fixtures Needed

- `prt01Items` in `apps/storybook/stories/fixtures.ts`, mirroring the demo
  PRT-01 booking and annotation.
- Temporary directories for the docs-site failure cases; no checked-in fixture.

### Mock Requirements

None. The contracts read real files, the real reports and the real build output.

## Verification Checklist

- [ ] All ST cases defined with concrete input/output pairs
- [ ] Every ST case traces to a requirement, spec doc or AR entry
- [ ] Specification tests written BEFORE implementation
- [ ] Specification tests verified to FAIL before implementation (except the
      explicitly-labeled regression guards ST-8 and ST-29, which need a negative
      fixture to prove they can fail)
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover the docs-site failure modes
- [ ] `pnpm verify` passes; `pnpm verify:full` passes at plan completion
- [ ] `pnpm docs:site` produces and verifies the artifact
- [ ] No regressions in the existing suites

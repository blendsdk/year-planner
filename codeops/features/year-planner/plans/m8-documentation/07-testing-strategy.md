# Testing Strategy: Documentation, Storybook and API Reference

> **Document**: 07-testing-strategy.md
> **Parent**: [Index](00-index.md)

## Testing Overview

### Coverage Goals

| Code type | Target |
| --------- | ------ |
| Documentation contracts | Every RD-11 topic, link, claim and deferred item |
| Storybook contracts | Every RD-11 named state, addon and base path |
| API contracts | Every public report entry, release tag and entry-point example |
| Docs-site script | Happy path plus missing-artifact, bad-base and broken-link failures |
| Existing product code | Unchanged thresholds; no product behavior changes |

- Test names state behavior and repeat the `RD-11-AC-NN` ID where the test proves
  an acceptance criterion.
- Specification tests derive from RD-11 and the plan documents, never from the
  implementation.
- Implementation tests cover the docs-site script's failure modes with temporary
  directories.
- No production behavior is changed to make a test pass.

## Test Slices & Groups

The project map `codeops/test-map.json` owns all three new files through the
`verification` slice:

| Slice | Tier | Test Files | Sources | Depends On | Gate |
| ----- | ---- | ---------- | ------- | ---------- | ---- |
| `verification` | task | `tests/quality/docs-contract.spec.test.ts` | `README.md`, `DEFERRED.md`, `docs/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/storybook-contract.spec.test.ts` | `apps/storybook/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/tsdoc-contract.spec.test.ts` | `packages/*/src/**` | `core.unit`, `react.unit` | task |
| `verification` | task | `tests/quality/docs-site.impl.test.ts` | `scripts/build-docs-site.mjs` | `core.unit`, `react.unit` | task |
| `verification` | release | existing E2E demo tests | `apps/demo/**` | task groups | release |

`tests/quality/**` is already owned by `quality.contracts`, so the new files need
no map edit. The E2E demo proof stays in the existing release groups.

## 🚨 Specification Test Cases (MANDATORY — NON-NEGOTIABLE)

> These cases derive from RD-11, the plan specs and the ambiguity register. They
> are the oracle. If an artifact does not match, the artifact is wrong.

### Guide set

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-1 | `docs/README.md` topic map | Has exactly the fourteen RD-11 topics; every mapped page exists with one H1 | RD-11 Must Have; AR-4 |
| ST-2 | Every relative markdown link in `README.md` and `docs/**` | Resolves to an existing file or anchor | RD-11 AC7; AR-4 |
| ST-3 | `README.md` quickstart | Imports the component and CSS, defines static items, holds selection and visibility in state, wires both callbacks and prints | RD-11 AC7; AR-5 |
| ST-4 | `DEFERRED.md` | Lists all 23 deferred capabilities; no guide describes one as implemented | RD-11 AC9; AR-13 |
| ST-5 | `docs/accessibility.md` | States `Conformance claim: none`; no forbidden conformance phrase appears in any guide | RD-11 AC10; AR-14 |
| ST-6 | `docs/performance.md` | Names the measured status and the initial-render and 10k-overflow misses; links `docs/test-report.md` | RD-11 AC10; AR-20 |
| ST-7 | Story count in `docs/getting-started.md` | Equals the parsed `export const ...: Story` count | RD-11 Must Have; AR-19 |
| ST-8 | Docs and app assets | No source photo or unlicensed binary asset is published | RD-11 AC12; existing repo contract |

### Storybook

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-9 | Story titles and exports | Every RD-11 named state has a story; titles are unique | RD-11 AC2, AC11; AR-6 |
| ST-10 | `Print/Prt01TwoThousandSeventeen` | Year 2017, `classic-yellow`, PRT-01 fixture, A3 paginate | RD-11 AC11; AR-6 |
| ST-11 | `.storybook/main.ts` | Registers `@storybook/addon-viewport` | RD-11 Must Have; AR-6 |
| ST-12 | `.storybook/main.ts` | Reads `STORYBOOK_BASE` with a `/` default | RD-11 AC6; AR-7 |

### API reference

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-13 | Both checked-in API reports | Zero `(undocumented)` entries | RD-11 AC3; AR-10 |
| ST-14 | Every exported declaration in the reports | Carries `@public`, `@beta`, `@alpha` or `@internal` | RD-11 AC3; AR-10 |
| ST-15 | Both `api-extractor.json` files | `ae-missing-release-tag` is not `none` | RD-11 AC3; AR-10 |
| ST-16 | Both TypeDoc configs | `validation.notDocumented` is enabled | RD-11 AC1, AC3; AR-10 |
| ST-17 | Named public entry points | `@example` is present on `YearPlanner`, `YearPlannerProvider`, `createTheme`, `buildClassicYearLayout` and `buildRibbonLayout` | RD-11 AC3; AR-12 |

### Docs site

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-18 | `package.json` and `scripts/` | `docs:site` exists and targets the build script | RD-11 AC1, AC6; AR-8 |
| ST-19 | `.github/workflows/pages.yml` | Uses the three Pages actions; least-privilege permissions; deploy guarded by manual dispatch and `deploy` input; no `pull_request_target` | RD-11 AC6; AR-9 |
| ST-20 | `docs:site` build | `storybook-static/index.html` asset URLs start with `/year-planner/` | RD-11 AC5, AC6; AR-7 |
| ST-21 | `docs:site --check-only` | API landing, core and react pages exist and the landing links resolve | RD-11 AC5, AC6; AR-8 |
| ST-22 | Local Storybook build | Base defaults to `/` and the build stays green | RD-11 AC1; AR-7 |

### Demo and evidence

| # | Input / Scenario | Expected Output / Behavior | Source |
|---|------------------|----------------------------|--------|
| ST-23 | Demo navigation | Links to the commands, interaction, AC3 and PRT-01 routes | RD-11 AC8; AR-15 |
| ST-24 | README and getting-started | Document the demonstration routes | RD-11 AC8; AR-15 |
| ST-25 | `00-traceability.md` and checker | Thirteen RD-11 rows; checker passes through RD-11 | RD-11 AC2, AC4; AR-16 |
| ST-26 | `docs/test-report.md` | Contains an RD-11 evidence section with commands, results and named gaps | RD-11 AC1, AC10; AR-20 |

## Test Categories

### Specification Tests (from ST-cases above)

| Test File | ST Cases Covered | Component |
| --------- | ---------------- | --------- |
| `tests/quality/docs-contract.spec.test.ts` | ST-1–ST-8, ST-23, ST-24, ST-26 | Guide set, demo docs and report |
| `tests/quality/storybook-contract.spec.test.ts` | ST-9–ST-12 | Storybook |
| `tests/quality/tsdoc-contract.spec.test.ts` | ST-13–ST-17 | API reference |
| `tests/quality/docs-site-contract.spec.test.ts` | ST-18–ST-20 | Docs site and workflow |
| `tests/quality/traceability.spec.test.ts` | ST-25 | Traceability |

### Implementation Tests (edge cases, internals)

| Test File | Description | Priority |
| --------- | ----------- | -------- |
| `tests/quality/docs-site.impl.test.ts` | `--check-only` rejects a missing API tree, a wrong base path and a broken landing link | High |
| `tests/quality/traceability.impl.test.ts` | Existing malformed/duplicate matrix cases; extend only if the RD-11 rows expose a parser edge | Medium |

### End-to-End Tests

| Scenario | Steps | Expected Result |
| -------- | ----- | --------------- |
| Controlled demo rejection | Open `?commands=1`, select reject, move an item | Item keeps its source period; rejection is announced |
| Demo selection and visibility | Open the default route, select a date, hide a layer | Selection renders; hidden items are absent |

These already exist in `tests/e2e/commands.spec.ts` and
`tests/e2e/interaction.spec.ts`; only the title annotation changes.

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
- [ ] Specification tests verified to FAIL before implementation
- [ ] All specification tests pass after implementation
- [ ] Implementation tests cover the docs-site failure modes
- [ ] `pnpm verify` passes; `pnpm verify:full` passes at plan completion
- [ ] `pnpm docs:site` produces and verifies the artifact
- [ ] No regressions in the existing suites

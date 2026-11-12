# Current State: Documentation, Storybook and API Reference

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The repository already carries most of the raw material RD-11 asks for:

- Four user guides: `docs/react-view.md` (186 lines, twelve sections), `docs/commands.md`,
  `docs/interaction.md` and `docs/accessibility.md`.
- Evidence documents: `docs/test-report.md`, `docs/security.md`,
  `docs/benchmarks/*`, the ADR and the red-phase records.
- Storybook 10.6.6 with `@storybook/addon-docs`, `@storybook/addon-a11y` and
  `@storybook/addon-themes`; 12 story files and 171 stories.
- TypeDoc 0.28.20 configured for both packages, a `docs:build` script and a
  hand-written `docs/api-index.html` landing page. `docs/api/` is generated and
  gitignored.
- API Extractor 7.60.1 with checked-in reports for both packages and an
  `api-report:ci` gate inside `pnpm verify`.
- A private demo with routes for commands, interaction, AC3 design-system
  buttons, PRT-01 print and security probes.
- RD-10 evidence, the clean-consumer check and the quality-test project.

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `README.md` | Project overview and usage | Complete quickstart; doc links; corrected story count |
| `docs/react-view.md` | Twelve sections: install, usage, data/state, theming, items, slots, interaction, inspector, print, SSR, Storybook, ESM | Split with a section map; file removed |
| `docs/commands.md` | Controlled command lifecycle | Cross-link the new controlled-API page |
| `docs/interaction.md` | Modes, selection, pointer, keyboard | Keep as the selection/keyboard owner; add topic-map links |
| `docs/accessibility.md` | Semantics, keyboard, contrast, evidence | Keep; link limitations and the parked audit |
| `docs/README.md` | Guide index | New |
| `docs/getting-started.md`, `controlled-api.md`, `visibility.md`, `theming.md`, `customization.md`, `inspector-tooltip.md`, `dynamic-months.md`, `print.md`, `performance.md`, `limitations.md`, `migration.md`, `faq.md`, `architecture.md` | Topic guides and architecture diagram | New |
| `DEFERRED.md` | Deferred capability list | New |
| `apps/storybook/stories/Print.stories.tsx` | Print states | Add the exact PRT-01 2017-yellow story |
| `apps/storybook/stories/fixtures.ts` | Shared fixtures | Add the PRT-01 fixture |
| `apps/storybook/.storybook/main.ts` | Storybook config | Keep relative asset URLs; no base override |
| `apps/storybook/package.json` | Storybook build output | Write to the repo-root `storybook-static/` |
| `packages/core/src/**` | Core public surface | TSDoc on 55 report entries (52 members, 2 aliases, 1 const) |
| `packages/react/src/**` | React public surface | TSDoc on 57 report entries and entry-point examples |
| `packages/*/api-extractor.json` | API report policy | Enable `ae-missing-release-tag` |
| `typedoc.core.json`, `typedoc.react.json` | API HTML | Enable validation and fatal validation warnings |
| `scripts/build-docs-site.mjs` | Pages artifact | New |
| `.github/workflows/pages.yml` | Docs site CI | New |
| `package.json` | Scripts | Add `docs:site` |
| `apps/demo/src/App.tsx` | Demo routes | Add visible navigation |
| `codeops/features/year-planner/requirements/00-traceability.md` | AC matrix | Add RD-11 rows |
| `tests/quality/docs-contract.spec.test.ts`, `storybook-contract.spec.test.ts`, `tsdoc-contract.spec.test.ts` | Contract tests | New |
| `docs/test-report.md` | Evidence record | Add RD-11 section and correct counts |

### Code Analysis

**Guide coverage.** Mapping the RD's fourteen topics to today's files:

| RD-11 topic | Current owner | Gap |
| ----------- | ------------- | --- |
| Getting started | `README.md` Usage, `docs/react-view.md` | Fragment only; no controlled state or print |
| Controlled API | `docs/react-view.md` Data and state | Prop pairs are a four-row table; command lifecycle lives elsewhere |
| Visibility semantics | `docs/react-view.md` one line | No precedence or hidden-data detail |
| Selection and keyboard | `docs/interaction.md`, `docs/accessibility.md` | Covered; needs navigation |
| Theming | `docs/react-view.md` Theming | Covered; no dedicated page |
| Customization and holidays | `docs/react-view.md` Slots | Covered; no holiday recipe |
| Inspector and tooltip | `docs/react-view.md` Inspector, Slots tooltip | Covered; no dedicated page |
| Dynamic months | `docs/react-view.md` Basic usage | Thin |
| Print | `docs/react-view.md` Print | Covered; no dedicated page |
| Accessibility status | `docs/accessibility.md` | Covered |
| Performance status | `docs/test-report.md`, `docs/benchmarks/` | No guide page |
| Limitations | `README.md` Explicitly deferred | No `DEFERRED.md` |
| Migration | `README.md` Migrating the pre-RD-06 preview | No versioning policy |
| FAQ | — | Missing |

**Storybook.** The 171 stories cover windows (12/14/18/24/36), ribbons, overflow,
visibility, interaction modes, marquee, paint/erase, move/resize, inspector,
tooltip, themes, high contrast, unstyled, token adapters, empty state and print
pagination/fit. Missing against RD-11: the exact PRT-01 2017-yellow print story
and provider-level Fluent/MUI wrapper stories. Storybook 10 already provides the
viewport and emits relative asset URLs, so the standalone viewport addon and an
absolute base path are not needed. The counts in `README.md` (157) and
`docs/react-view.md` (144 across ten files) are stale; `docs/test-report.md`
records 171.

**API surface.** `packages/core/etc/year-planner-core.api.md` contains 55
`(undocumented)` entries: 52 interface members, two type aliases
(`ClassicYearLayoutResult`, `DateParseResult`) and one const (`MS_PER_DAY`).
`packages/react/etc/react-year-planner.api.md` contains 57 interface members.
Both `api-extractor.json` files set `ae-missing-release-tag` to `none`.
`createTheme` and `buildRibbonLayout` already have `@example`; `YearPlanner`,
`YearPlannerProvider` and `buildClassicYearLayout` do not.

**Docs site.** No script assembles Storybook plus TypeDoc, and no workflow uses
the Pages actions. `pnpm storybook:build` writes
`apps/storybook/storybook-static/`, not a repo-root directory, and `docs/api/` is
gitignored, so the artifact must be built in CI. Storybook's relative asset URLs
already work under a subpath.

**Demo.** `apps/demo/src/App.tsx` supports `?commands=1`, `?interaction=1`,
`?ac3=1`, `?print=prt01`, `?security=1` and `?bench=1`, but the default page
offers no navigation to those routes. The command route demonstrates controlled
items, mock validation rejection and rollback; the default route demonstrates
selection; `?security=1` demonstrates hidden-item visibility. The sub-routes
replace the page that would hold a nav, so the nav must be shared.

**Traceability.** `scripts/check-traceability.mjs` checks RD-01 through RD-10
(157 matrix rows). RD-11 has no rows and no annotated test titles. The test map
(`codeops/test-map.json`) owns `tests/quality/**` through `quality.contracts`, so
new contract files are covered without a map change.

## Gaps Identified

### Gap 1: No single documentation entry point

**Current Behavior:** Guides are reachable only from scattered README links;
`react-view.md` mixes several topics.
**Required Behavior:** `docs/README.md` maps all fourteen RD topics to owning
pages; each topic has a focused page.
**Fix Required:** Split `react-view.md`, add the missing pages, add the index.

### Gap 2: Quickstart is not runnable

**Current Behavior:** The README example imports CSS but references undefined
`items` and `layers` and shows no state, selection, visibility or print wiring.
Packages are unpublished, so an npm install instruction would be false.
**Required Behavior:** A copy-paste example that installs, renders a 14-month
view from static data, imports CSS, controls selection and visibility, and prints.
**Fix Required:** Rewrite the README Usage section and add
`docs/getting-started.md`.

### Gap 3: Storybook misses RD-named states

**Current Behavior:** No PRT-01 2017-yellow print story, no provider wrapper
stories and no named viewport configuration.
**Required Behavior:** The exact PRT-01 print story, Fluent/MUI provider wrappers,
named viewports, and relative URLs that work under `/year-planner/`.
**Fix Required:** Add the story and fixture, add the wrapper stories, configure
the built-in viewport.

### Gap 4: Public TSDoc is incomplete

**Current Behavior:** 112 `(undocumented)` report entries (55 core + 57 React);
the release-tag rule is disabled; three main entry points lack examples.
**Required Behavior:** Every public interface member documented, release tags
reported, examples on the named entry points.
**Fix Required:** Document the members, enable the rule, add examples, rebuild
the reports.

### Gap 5: No reproducible docs-site artifact

**Current Behavior:** Storybook and TypeDoc build separately; nothing copies the
API tree into the site or checks the composition.
**Required Behavior:** One command produces `storybook-static/` with the API at
`/api/`, and CI uploads it for a guarded release deployment.
**Fix Required:** Add the build script, `docs:site`, and the Pages workflow.

### Gap 6: Deferred scope is scattered

**Current Behavior:** The deferred list is a README paragraph and omits several
RD-11 items.
**Required Behavior:** `DEFERRED.md` lists every deferred capability and no
deferred feature is described as implemented.
**Fix Required:** Add `DEFERRED.md` and link it from the README and limitations.

## Dependencies

### Internal Dependencies

- RD-06 through RD-10 behavior, evidence and story fixtures.
- The existing quality-test project, API Extractor reports and TypeDoc config.
- The existing demo routes and Playwright coverage.

### External Dependencies

- Storybook 10.6.6, including its built-in `storybook/viewport` module (no addon package).
- TypeDoc 0.28.20, API Extractor 7.60.1 and the TypeScript compiler API.
- GitHub Actions Pages actions (`configure-pages`, `upload-pages-artifact`,
  `deploy-pages`) — workflow-only, no package dependency.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| TSDoc volume hides a wrong description | Med | Med | Describe the declared type and behavior, not imagined behavior; review each file group |
| TypeDoc validation surfaces unrelated warnings | Med | Low | Make validation fatal in the API phase and fix or narrow with a documented reason |
| A Storybook base override breaks relative URLs | Low | Med | Keep Storybook 10 relative `./` URLs; no base override |
| Pages deploy runs before release | Low | High | Deploy only on manual dispatch with `deploy: true`; build job has no write permission |
| Docs drift from the real story count | Med | Low | Contract computes the count and compares it with the docs |
| Performance status overstates the evidence | Low | High | Cite `docs/test-report.md` and name the known misses; contract forbids claims |

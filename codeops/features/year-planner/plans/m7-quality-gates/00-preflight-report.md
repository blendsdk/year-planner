# Preflight Report: Quality Gates, Performance, Security and Browsers

> **CodeOps Artifact Schema**: 1
> **Audit target**: `codeops/features/year-planner/plans/m7-quality-gates/` (11 plan documents)
> **Context**: `codeops/features/year-planner/requirements/RD-10-quality-gates.md`, RD-01..RD-09,
> `00-traceability.md`, the roadmap, package manifests, Playwright/Vitest configs, CI workflow,
> renderers, scripts and tests
> **Content hash**: `86082110fa68f48fdb9e7a0241180defb7322c1702e7158e96ec1a2697bdb243` (plan documents, excluding this report)
> **Iterations**: 1 clustered scan (5 independent auditors) + deterministic checks + author re-scan
> **Verdict**: ✅ **PREFLIGHT PASSED WITH NOTES** — 37 findings resolved, 2 accepted scope/coverage notes (PF-023, PF-028)

---

## ⚠️ Same-session review

The plan was authored and reconciled in this session. Five independent general-purpose auditors
scanned it read-only against the real repository, but they share the authoring model. The findings
below were verified against the code and the plan text; a fresh-session audit is still the strongest
independence check before execution.

---

## Codebase context summary

| Area | Verified fact |
| ---- | ------------- |
| Plan target | RD-10 plus issue #3; RD-11/RD-12 and issue #4 are out of scope |
| Baseline | RD-09 complete: 207 core, 474 React, 108 Playwright passed / 25 skipped |
| Bundle | `scripts/check-size.mjs` sums core + React + adapters + CSS at 63.36 kB / 65 kB; React entry+CSS is 40.55 kB |
| Toolchain | Node 24.21.0, pnpm 12.9.1, Vite 7.3.8, Vitest 3.2.7, Playwright 1.65.0, React 19.3.1 |
| Audit | `pnpm audit` reports 2 critical `tinypool` advisories through Vitest 3.2.7 and 5 moderate advisories |
| Render path | `YearPlanner` re-renders the full tree on every preview; `MonthRow`/`ItemOverlay` map full preview lists; `components` is a fresh `{}`; `PrintPages` and `ItemList` rebuild during gestures |
| Tests | Visual baselines cover 2016/2017/2027 and one print page; print covers 14/24/36; no 12/18, mobile WebKit, timezone, benchmark, audit or license gate |
| CI | `verify`, `browsers` and `dco` jobs; no artifact upload, no performance/security/timezone job |
| Locale | `options.ts` defaults to `en-US`; `locale.ts` never reads `navigator.language` |
| Security | Hidden data is filtered from fragments/proxies/tooltips/inspector; no print/network/audit gate yet |
| Licenses | `pnpm licenses list --prod --json` at the root is `{}`; `pnpm -r licenses list --prod --json` returns the demo runtime deps; `pnpm licenses list --dev --json` returns 228 packages |

---

## Deterministic checks

| Check | Result |
| ----- | ------ |
| Required documents | 00-index, 00-ambiguity-register, 01-requirements, 02-current-state, 03-01..03-05, 07-testing-strategy, 99-execution-plan |
| Index `Implements` line | `year-planner/RD-10` on one line |
| Internal links | All resolve |
| Task count | 92 task checkboxes; 19+13+9+13+11+14+13 = 92 |
| Progress header | 0/92 (0%) |
| Spec-first ordering | Every phase has spec tests → red → implementation → green → impl tests → verify |
| Ambiguity register | 29 rows, 29 resolved, 0 open |
| Raw git commands | None |
| Placeholder text | None (`TODO`, `TBD`, "we'll assume") |
| Traceability scope | RD-01..RD-09 in Phase 1; RD-10 in Phase 7; RD-11/12 explicitly out of this milestone |

---

## Findings and resolutions

| ID | Severity | Finding | Resolution |
| -- | -------- | ------- | ---------- |
| PF-001 | 🔴 CRITICAL | Phase 1 could not go green for RD-01: the checker requires a title for every AC but no task created the repository/process tests. | Added `tests/quality/repo-contract.spec.test.ts` (tasks 1.1.4, 1.2.2) covering RD-01 AC1–AC11. |
| PF-002 | 🔴 CRITICAL | No task created `test:perf`, `bench` or `test:environment` before phases used them. | Added task 4.1.3 (bench config, `test:perf`, `bench`) and 7.2.1 (`test:environment`). |
| PF-003 | 🔴 CRITICAL | Performance evidence could pass with one sample, idle rAF frames, buffered long tasks and no sample-count check. | 03-03 now uses 5 initial/overflow repeats, one pointer move per rAF, 55-sample minimum, input-delay capture, `buffered: false` and 30 Node iterations. |
| PF-004 | 🔴 CRITICAL | The hidden-data test could pass with zero rendered items because the fixture had no `year`/layer/visibility prop. | 03-04 now renders `year={2027}`, valid layers, a visible control and `defaultVisibility`; the test asserts grid/proxy/print presence before leak checks. Task 6.1.5 adds the `?security=1` hidden fixture. |
| PF-005 | 🟠 MAJOR | The plan treated the 63.36 kB total as the RD-10 React package size, but the React entry+CSS is 40.55 kB and AC12 is met. | AR-2 and all budget sections now report React entry+CSS against 60 kB and the total against 65 kB. No 60 kB deviation is claimed. |
| PF-006 | 🟠 MAJOR | The clean consumer did not verify packed types or tree-shaking. | Added the consumer `tsc --noEmit` and tree-shake marker to 03-01, ST-43 and task 7.2.5. |
| PF-007 | 🟠 MAJOR | `vi.spyOn(navigator, "sendBeacon")` throws in jsdom where the method is absent. | 03-04 uses `Object.defineProperty` with a `vi.fn()` stub instead. |
| PF-008 | 🟠 MAJOR | `pnpm licenses list --prod --json` at the root returns `{}` and cannot produce the promised report. | 03-04 uses `pnpm -r licenses list --prod --json` for runtime and `pnpm licenses list --dev --json` for tooling. |
| PF-009 | 🟠 MAJOR | Task 3.2.2 changed production locale behavior based on a stale assumption; the component already ignores `navigator.language`. | AR-20 and task 3.2.2 are test-only; production changes only if the test fails. |
| PF-010 | 🟠 MAJOR | `test:timezones` was not run in CI. | CI `verify` now runs `pnpm test:timezones`; the CI contract test asserts it. |
| PF-011 | 🟠 MAJOR | The plan said `test:perf` both fails and only reports RD budget misses. | Split: `test:perf` reports and fails at 2×; `PERF_STRICT=1 pnpm test:perf` asserts the issue #3 oracle. |
| PF-012 | 🟠 MAJOR | Issue #3 had no numeric improvement oracle. | ST-36 and 03-03 require after p95 ≤0.9× baseline or ≤16.7 ms, three repeats, no long-task/input-delay regression. |
| PF-013 | 🟠 MAJOR | AC16's least-privilege/no-secrets half had no test. | 03-04 and ST-26 require `contents: read`, no `secrets.*`, no `pull_request_target`, no `write-all`; `ci-contract` asserts it. |
| PF-014 | 🟠 MAJOR | AC7 manual AT and AC12 60 kB were mapped as fully covered. | AC7 is `partial` with the parked manual audit recorded; AC12 is `proven` by the 40.55 kB React measurement. |
| PF-015 | 🟠 MAJOR | The traceability checker could false-green: optional file/title columns, zero ACs accepted, fixture strings counted. | Checker now requires status, existing proving file, exact title, rejects zero ACs, skipped/todo titles and fixture-only IDs; negative fixtures added. |
| PF-016 | 🟠 MAJOR | ST-38/ST-39 were authored as implementation tests, contradicting the spec-test oracle. | ST-38 moved to `bench-data.spec.test.ts`; ST-39 to `preview.spec.test.tsx`; impl files keep edge cases. |
| PF-017 | 🟠 MAJOR | The optimization omitted `PrintPages` and `ItemList`, which rebuild during gestures. | Task 5.2.3 memoizes `PrintPages` and `ItemList` with stable props; 02/03 name the cost. |
| PF-018 | 🟠 MAJOR | The preview comparator compared object identity, so every row re-rendered. | 03-03 compares `previewKey`, validity and layer identity and reuses unchanged preview objects. |
| PF-019 | 🟠 MAJOR | Print tests asserted only page count/size, not clipping or PDF content. | 03-02/ST-17 add row-bounds checks, weekend assertions and `pdftotext` content. |
| PF-020 | 🟠 MAJOR | The Vitest upgrade named only some manifests, leaving peer conflicts and the tinypool path. | 03-04/6.2.1 upgrade root, core and React manifests, regenerate the lockfile and run `pnpm why tinypool`. |
| PF-021 | 🟠 MAJOR | The Node benchmark used Node 24 TypeScript support while `engines` allows Node 20.19. | The benchmark and data generator are plain `.mjs`; no Node 24-only language feature is required. |
| PF-022 | 🟠 MAJOR | CI artifacts/report evidence were incomplete (no timezone, audit log, profile separation or parsed report). | CI now has timezone/security/performance steps, audit and profile artifacts, and a report-contract test. |
| PF-023 | 🟡 MINOR/Scope | AC2 says “every RD”; RD-11/RD-12 are not implemented. | **Accepted scope note**: RD-10 is the confirmed milestone; RD-11/12 join the matrix when their plans execute. No implemented RD is waived. |
| PF-024 | 🟠 MAJOR | Red-phase tasks did not run the exact new specs in several phases. | Phase 2/3/4/5/6 red commands now include the React, E2E, quality and bench sets. |
| PF-025 | 🟠 MAJOR | Phase 3 green did not run the React SSR/hydration tests. | Added `pnpm --filter @blendsdk/react-year-planner test` to 3.1.3/3.3.1. |
| PF-026 | 🟠 MAJOR | Phase 6 green did not run E2E security, audit or licenses. | 6.3.1 now runs all four commands. |
| PF-027 | 🟠 MAJOR | The E2E hidden-data test had no hidden fixture. | Task 6.1.5 adds a hidden sentinel and visible control to `?security=1`. |
| PF-028 | 🟡 MINOR/Accepted | RD-10 wording says “latest two stable” browsers; the plan runs one Playwright-bundled version per engine. | **Accepted known gap**: exact versions are recorded, Edge/Safari are proxies, and no claim is made beyond measured versions. The binding AC4 only requires Chromium/Firefox/WebKit, which the plan runs. |
| PF-029 | 🟠 MAJOR | Matrix file/title columns were optional and unchecked. | Checker requires an existing file and exact title; matrix has `Status` and `Evidence/Deviation`. |
| PF-030 | 🟡 MINOR | `trace: on-first-retry` records nothing with zero retries. | Changed to `trace: "retain-on-failure"`. |
| PF-031 | 🟡 MINOR | Reference memory said 24 GB; the host has 14 GiB. | Corrected to 14 GiB total / 5.7 GiB available. |
| PF-032 | 🟡 MINOR | RD-10's parser fuzz requirement had no coverage. | Added deterministic `packages/core/src/fuzz.spec.test.ts` and ST-49. |
| PF-033 | 🟡 MINOR | New TypeScript tests/configs and the demo were outside typecheck. | Added `tsconfig.tools.json`, demo `tsconfig.json` and `typecheck:tools` (task 1.2.9). |
| PF-034 | 🟡 MINOR | CPU profiles used one path, so the after run overwrote the baseline. | Profiles now use `${runLabel}` under `test-results/bench/profiles`. |
| PF-035 | 🟡 MINOR | License docs mixed production-only and all-dependency output. | Aligned on runtime + development-tooling sections. |
| PF-036 | 🟡 MINOR | The E2E request log rejected `data:`/`blob:` URLs it claimed to allow. | The snippet checks protocols before the origin. |
| PF-037 | 🟡 MINOR | Network assertions omitted `EventSource`, `Image` and CSS URL sinks. | Added to the unit source scan and Playwright allowlist. |
| PF-038 | 🟡 MINOR | Report fields were prose-only. | The CI/report contract test parses `docs/test-report.md` for the required fields. |
| PF-039 | 🟡 MINOR | The `test:environment` script was declared but no task created it. | Task 7.2.1 creates it. |

---

## Accepted notes

| Note | Reason |
| ---- | ------ |
| PF-028 browser two-version matrix | Not feasible with one Playwright bundle on Linux; exact versions recorded, known gap stated, no claim beyond measured engines. AC4 is satisfied. |
| Manual NVDA/VoiceOver audit | Inherited RD-09 park decision; not an RD-10 finding. No WCAG conformance claim. |
| RD-11/RD-12 traceability | Not implemented in this milestone; confirmed scope boundary. |
| Same-session review | Five independent auditor dispatches were used, but they share the authoring model; a fresh session is advised before execution. |

---

## Iteration 2 (fix verification)

The author re-scanned all 13 dimensions after the fixes:

- Task count and phase table match (92).
- Every phase has spec → red → implementation → green → impl → verify.
- `test:perf` has one policy: report + 2× plus strict issue #3 oracle.
- Bundle is measured two ways with no 60 kB deviation.
- Timezone, audit, license, security artifact and report contract are wired into CI.
- Traceability has status/file/title validation and RD-01/RD-10 proving files.
- No raw git commands, no placeholders, all links resolve.

**Final verdict: ✅ PREFLIGHT PASSED WITH NOTES** — all critical and major findings are resolved;
the accepted items are the confirmed RD-11/RD-12 scope boundary (PF-023) and the documented browser
two-version coverage gap (PF-028). No issue blocks execution.

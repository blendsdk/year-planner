# Quality Gates, Performance, Security and Browsers Implementation Plan

> **Feature**: Measured R1 quality contract — traceability, coverage, browser/print/timezone/SSR matrices, performance budgets, issue #3 profiling, security/privacy gates and CI-published evidence
> **Status**: Execution Complete
> **Created**: 2026-11-11 14:51
> **Implements**: year-planner/RD-10
> **CodeOps Artifact Schema**: 1

## Overview

RD-10 turns the existing green test suite into a measured quality contract. The repository already
has unit, component, E2E, visual, print and axe coverage, plus a working size check, clean-consumer
install and SSR hydration test. What it does not have is a complete acceptance-criterion
traceability contract, a timezone matrix, a mobile smoke matrix, full window/density visual
baselines, a repeatable performance harness, an issue #3 optimization baseline, a full security
suite, a clean dependency audit, or CI-published evidence.

This plan closes those gaps without changing product behavior. The renderer, public props,
interaction model and command pipeline stay as delivered by RD-01 through RD-09. The work is
confined to tests, benchmark fixtures, small React render optimizations, scripts and CI.

The plan also records two inherited decisions: the React package entry+CSS is measured against the
RD-10 60 kB target while the existing core+React+adapters+CSS total keeps the user-approved RD-09
65 kB guard, and the manual NVDA/VoiceOver audit stays parked with no WCAG conformance claim.

## Minimum-Sufficient Baseline

**Original goal:** deliver RD-10's measurable quality gates and close issue #3 with a reproducible
profile and a measurable interaction improvement.

**Smallest viable design:** extend the existing Vitest, Playwright, `pdfinfo`, axe and size-check
stack with a small quality-test project, a timezone shell script, a demo benchmark route, a
Playwright benchmark config, a traceability checker and CI artifact upload. Optimize the render
only after profiling, using React memoization and stable props.

**Excluded machinery:** no new test framework, no paid visual-regression service, no external
performance dashboard, no virtualization, no external gesture store, no new runtime dependency,
and no real Edge/Safari runner on Linux. The only dependency change is the Vitest 4.1.12 upgrade
that removes the critical `tinypool` advisories.

**Approved complexity:** None beyond the RD-mandated harness and the existing project agents. The
benchmark and traceability checker reuse the existing Vitest/Playwright stack and add no package.

## Document Index

| #   | Document                                                        | Description                                      |
| --- | --------------------------------------------------------------- | ------------------------------------------------ |
| AR  | [Ambiguity Register](00-ambiguity-register.md)                  | Zero-Ambiguity Gate decisions (audit trail)      |
| PF  | [Preflight Report](00-preflight-report.md)                     | Independent audit, findings and resolutions      |
| 00  | [Index](00-index.md)                                            | This document — overview and navigation          |
| 01  | [Requirements](01-requirements.md)                              | RD-10 delta view and plan-local decisions        |
| 02  | [Current State](02-current-state.md)                            | Existing evidence, gaps and baseline facts       |
| 03  | [Traceability and Public API](03-01-traceability-api.md)        | AC matrix, title IDs, coverage and export smoke  |
| 04  | [Test Matrix](03-02-test-matrix.md)                             | Browser, mobile, visual, print, timezone and SSR |
| 05  | [Performance](03-03-performance.md)                             | Benchmark harness, budgets, profiling, issue #3  |
| 06  | [Security and Privacy](03-04-security-privacy.md)               | Hidden data, XSS, network, audit and licenses    |
| 07  | [CI and Evidence](03-05-ci-evidence.md)                         | CI jobs, artifacts, report and flaky policy      |
| 08  | [Testing Strategy](07-testing-strategy.md)                      | ST-cases and verification                        |
| 99  | [Execution Plan](99-execution-plan.md)                          | Phases, sessions and task checklist              |

## Quick Reference

### Commands added or changed

```bash
pnpm typecheck:tools    # typecheck the quality/benchmark configs and tests
pnpm test:quality       # traceability, public API, CI and license contract checks
pnpm test:timezones     # date-only suite under UTC, Pacific/Kiritimati and America/Los_Angeles
pnpm test:audit         # pnpm audit --audit-level high
pnpm test:licenses      # regenerate/check THIRD_PARTY_NOTICES.md
pnpm test:a11y          #axe Playwright spec
pnpm test:perf          # RD budget report plus the 2x regression ceiling
PERF_STRICT=1 pnpm test:perf # issue #3 oracle (Phase 5 red/green)
pnpm test:environment   # Node/pnpm/Playwright/browser version capture
pnpm bench              # core + browser benchmark, JSON/Markdown/CPU profiles
pnpm test:flaky         # repeat-each=3 triage run, never a CI default
```

`pnpm verify` gains `test:quality` (which includes traceability), `test:licenses` and the existing
checks. `pnpm verify:full` gains `test:timezones`, `test:audit`, `test:perf` and `pnpm bench`.

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Scope | RD-10 plus issue #3; RD-11/RD-12 and issue #4 out | AR-1 |
| Bundle budget | React entry+CSS 60 kB target; 65 kB total installed guard | AR-2 |
| Traceability | Annotate titles and enforce with `test:quality` | AR-3 |
| Coverage | Keep 95% core / 80% React; add public-export smoke | AR-4 |
| Timezones | One shell script, reused by CI | AR-5 |
| Browsers | Chromium/Firefox/WebKit; Edge/Safari proxies; named versions | AR-6 |
| Mobile | Pixel 5 Chromium + iPhone 13 WebKit | AR-7 |
| Visual | 12/14/18/24/36, overflow, high contrast, print | AR-8 |
| Print | 12/14/18/24/36 + PRT-01 with `pdfinfo` | AR-9 |
| Performance | Node layout + production Playwright harness | AR-10 |
| Optimization | Memoize rows/cells/items and isolate previews | AR-14 |
| Audit | Upgrade Vitest 4.1.12; high/critical block | AR-15, AR-16 |
| CI | Checked-in report plus uploaded raw artifacts | AR-21 |
| Flaky policy | Zero retries; explicit triage command | AR-22 |
| Manual AT | Parked; no conformance claim | AR-25 |

## Specialist Agents

| Role | Kind | Use | AR Ref |
| ---- | ---- | --- | ------ |
| `security-auditor` | reviewer | Phase 6 (security/privacy gates) and final RD-10 review | AR-15, AR-16, AR-19 |
| `performance-auditor` | reviewer | Phase 4 (harness) and Phase 5 (optimization) | AR-10–AR-14, AR-28 |
| `correctness-reviewer` | reviewer | Every executed phase; final behavioral review | AR-3, AR-9, AR-20 |

_Detection evidence: the repository already contains generated project agents at
`.opencode/agents/security-auditor.md` and `.opencode/agents/performance-auditor.md`, and
`codeops/codeops.json` sets `strict` quality with independent review. RD-10 adds a dependency audit,
XSS/hidden-data suite, production drag profiling and row-level render changes, so the existing
security and performance reviewers have a concrete use. No new specialist is proposed; candidate
creation is reserved authority and is not needed._

## Related Files

| File | Role |
| ---- | ---- |
| `codeops/features/year-planner/requirements/RD-10-quality-gates.md` | Owning requirements |
| `codeops/features/year-planner/requirements/00-traceability.md` | AC-to-test matrix |
| `tests/quality/*.spec.test.ts` | New cross-cutting quality checks, including RD-01 repo contract |
| `tests/perf/*.spec.ts` | New performance budget assertions |
| `tests/e2e/quality-visual.spec.ts` | New window/density/theme visual baselines |
| `tests/e2e/print-matrix.spec.ts` | 12/18/24/36 and PRT-01 print evidence |
| `tests/e2e/mobile.spec.ts` | Mobile Chromium/WebKit smoke |
| `scripts/bench-data.mjs` | Deterministic benchmark generator (Node 20-compatible) |
| `apps/demo/src/BenchDemo.tsx` | Deterministic benchmark fixture |
| `apps/demo/src/App.tsx` | Window options and benchmark route |
| `playwright.config.ts` | Mobile projects, zero retries, aliases |
| `playwright.bench.config.ts` | Production-preview benchmark runner |
| `scripts/bench-layout.mjs` | Node core layout/ribbon benchmark |
| `scripts/bench.mjs` | Node layout + browser benchmark orchestration |
| `scripts/test-timezones.sh` | Three-timezone date suite |
| `scripts/write-licenses.mjs` | `THIRD_PARTY_NOTICES.md` generator/check |
| `scripts/ci-environment.mjs` | Browser/OS/Node version capture |
| `scripts/check-size.mjs` | React-package 60 kB measurement plus the 65 kB total guard |
| `scripts/clean-consumer.sh` | Packed install, types, CSS and tree-shake consumer proof |
| `packages/react/src/render/MonthRow.tsx` | Memoized row rendering |
| `packages/react/src/render/CellLayer.tsx` | Memoized cell rendering |
| `packages/react/src/render/ItemOverlay.tsx` | Per-row gesture preview isolation |
| `packages/react/src/render/ItemLayer.tsx` | Memoized item fragments |
| `packages/react/src/YearPlanner.tsx` | Stable `components`/callback identities |
| `package.json` | New scripts and Vitest 4 upgrade |
| `.github/workflows/ci.yml` | Quality, timezone, browser, performance and report jobs |
| `docs/test-report.md` | Final counts, versions, budgets and known gaps |
| `docs/security.md` | Audit result, accepted moderate risk and limitations |
| `THIRD_PARTY_NOTICES.md` | Runtime and development-tooling licenses |

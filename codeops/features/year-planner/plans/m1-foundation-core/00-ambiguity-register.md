# Ambiguity Register: M1 Foundation and Core

> **Status**: ✅ GATE PASSED — all 14 items resolved
> **Last Updated**: 2026-11-10 09:26
> **Bulk acceptance note**: The user directed “proceed” after the requirements
> preflight and the M1 plan scope was presented. The technical defaults below are
> recorded as the accepted resolution.
> **CodeOps Artifact Schema**: 1

| # | Category | Ambiguity / Gap | Options Presented | User Decision | Status |
|---|----------|-----------------|-------------------|---------------|--------|
| 1 | Scope | Which RDs this plan implements | RD-01 only / RD-01–03 / full R1 | **RD-01, RD-02, RD-03 plus a minimal React grid enabler.** | ✅ Resolved |
| 2 | Scope | Minimal React grid | Defer view / minimal grid / full view | **Minimal 14×37 grid, themes, date/week labels, print; no ribbons/interactions.** | ✅ Resolved |
| 3 | Technical | Package manager and workspace | pnpm / npm / yarn | **pnpm + Turbo, per RD-01.** | ✅ Resolved |
| 4 | Technical | Verify command | `pnpm verify` / `pnpm verify:full` | **`pnpm verify` fast, `pnpm verify:full` release; M1 uses both.** | ✅ Resolved |
| 5 | Technical | TypeScript version | TS7 / TS6 | **TS 6.0.3; TS7 canary only.** | ✅ Resolved |
| 6 | Technical | Test naming and ordering | Impl-first / spec-first | **Spec tests first: `*.spec.test.ts`, then red, implement, green, impl tests.** | ✅ Resolved |
| 7 | Scope | Storybook scope in M1 | None / minimal grid stories / full catalog | **Minimal grid/theme/print stories; full catalog later.** | ✅ Resolved |
| 8 | Scope | Deferred from this plan | Include / defer | **RD-04–RD-12 behavior (ribbons, interactions, commands, a11y audit, docs site) deferred to later plans.** | ✅ Resolved |
| 9 | Process | Commit mode | Ask / auto / none | **Ask after each verified task (exec-plan default).** | ✅ Resolved |
| 10 | Technical | Renderer decision | HTML/SVG/hybrid now | **M0 spike runs in this plan for evidence; M1 minimal grid uses HTML/CSS Grid; no public renderer switch.** | ✅ Resolved |
| 11 | Behavior | `highlightYear` default | Start month / preset year | **`year` preset → `highlightYear = year`; explicit range → start month's year.** | ✅ Resolved |
| 12 | Behavior | `contextMonths` bounds | Any integers / 0–12 and total 12–36 | **before/after integers 0–12; total 12–36; else `INVALID_CONTEXT_MONTHS`.** | ✅ Resolved |
| 13 | Quality | CI scope in M1 | Narrow / full RD-01 matrix | **Include browser matrix, e2e/visual/print/pack-check/Storybook; a11y/bench incremental.** | ✅ Resolved |
| 14 | Quality | Print/36-month coverage | Defer / include | **Include 2016 blue + 2017 yellow print and 36-month keyboard/print checks.** | ✅ Resolved |

## Resolution notes

- **AR-1/2:** The minimal React grid is an enabler for RD-01 AC5 (clean consumer)
  and RD-03 visual verification. It is not a claim that RD-06 is complete.
- **AR-4:** `pnpm verify` will be created by this plan; `verify:full` may be
  wired incrementally as E2E/visual/a11y suites are added.
- **AR-10:** The spike report is an evidence artifact; the minimal grid uses the
  HTML renderer so the spike can compare against a real implementation.

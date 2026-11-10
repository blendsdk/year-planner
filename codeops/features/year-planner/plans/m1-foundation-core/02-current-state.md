# Current State: M1 Foundation and Core

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

- Git repository `blendsdk/year-planner` with MIT license, governance files and
  CodeOps nested layout.
- Requirements set `codeops/features/year-planner/requirements/` (12 RDs,
  ambiguity register, traceability, preflight report).
- Handoff source material at `/home/gevik/workdir/planing-engine/universal-planning-engine-handoff/`
  (external, read-only; not part of the package).
- No `package.json`, no TypeScript source, no tests, no build.

### Relevant Files

| File | Purpose | Changes Needed |
|---|---|---|
| `README.md` | Project overview | Update quickstart when packages exist |
| `codeops/.../requirements/` | Requirements | Read-only input |
| `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` | Governance | Keep; add package metadata |
| `codeops/.codeops.yml` | Layout marker | No change |

### Code Analysis

Greenfield. No existing patterns to preserve beyond the CodeOps standards:
strict TypeScript, TSDoc on public APIs, spec-first tests, no dead code,
workspace hygiene.

## Gaps Identified

### Gap 1: No workspace or packages

**Current Behavior:** No build or package structure.
**Required Behavior:** pnpm workspace with core/react packages and apps.
**Fix Required:** Create manifests, tsconfigs, Vite/Vitest/Turbo config.

### Gap 2: No temporal core

**Current Behavior:** No date/interval implementation.
**Required Behavior:** RD-02 date math, ISO weeks, half-open intervals.
**Fix Required:** Implement `date.ts`, `period.ts`, `interval.ts` with spec tests.

### Gap 3: No classic layout

**Current Behavior:** No geometry.
**Required Behavior:** RD-03 12–36 month layout and 37-column mapping.
**Fix Required:** Implement `layout/classic-year.ts` with spec tests.

### Gap 4: No React grid

**Current Behavior:** No view.
**Required Behavior:** Minimal HTML grid with themes and print.
**Fix Required:** Implement `YearPlanner.tsx`, `styles.css`, demo/story.

### Gap 5: No toolchain/CI

**Current Behavior:** No build/test/docs/release.
**Required Behavior:** RD-01 scripts, CI, API report, Storybook, clean consumer.
**Fix Required:** Configure toolchain and workflows.

## Dependencies

### Internal Dependencies

- Requirements RD-01–RD-03 (read-only).
- CodeOps coding/testing standards.

### External Dependencies

- Node 24, pnpm 12.9, TypeScript 6.0.3, Vite 7.3.8/Vitest 3.2.7 fallback
  (Vite 8/Vitest 5 target), Storybook 10, Playwright 1.65, Turbo 2.11,
  Biome 2.6, Changesets 3, API Extractor 7.60, TypeDoc 0.28.20+, React 19 dev
  / peer ^19.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Toolchain version incompatibility | Medium | High | M0 spike; pin known-compatible versions |
| Date math timezone drift | Low | High | No local Date; TZ test matrix |
| Dynamic month boundary | Medium | Medium | Boundary spec tests |
| Scope creep into ribbons/interactions | Medium | High | M1 delta explicitly excludes them |
| Storybook/TS6/TypeDoc mismatch | Medium | Medium | Spike + fallback pins |

# RD-01: Foundation, Packages and Toolchain

> **Document**: RD-01-foundation.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: —
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Establishes the repository, two-package public surface, build/test/documentation
toolchain and release baseline for the Year Planner component. This RD owns the
project setup so later RDs can focus on behavior rather than infrastructure.

The repository is an open-source MIT project under the `blendsdk` GitHub
organization. It is separate from the main BlendSDK SDK so server consumers do
not inherit a React peer dependency.

---

## Functional Requirements

### Must Have

- [ ] Monorepo with `packages/core`, `packages/react`, `apps/storybook`,
  `apps/demo`, `tests/e2e`, `docs/` and `.github/workflows/`.
- [ ] `@blendsdk/year-planner-core` is pure TypeScript and imports no React or
  DOM APIs.
- [ ] `@blendsdk/react-year-planner` declares React 18.2+ and 19 as peers and
  imports the core package through its public API only.
- [ ] ESM-only builds with generated `.d.ts`, declaration maps and source maps.
- [ ] Public exports map for the core and React packages, a `styles.css` export
  and no deep-import contract.
- [ ] Strict TypeScript 6.0.3 build; a TS7 canary typecheck job that does not
  gate release.
- [ ] Vite 8 build, Vitest 5 tests, Storybook 10, Playwright, Turbo, pnpm,
  Changesets and Biome configured and documented.
- [ ] `pnpm verify` runs typecheck, lint, unit/component tests, build, API
  report, Storybook build and package validation.
- [ ] CI runs on Node 24 with React 18.2 and React 19 matrices; browser tests
  run Chromium, Firefox and WebKit.
- [ ] DCO check on every commit; MIT license; `CONTRIBUTING`, `CODE_OF_CONDUCT`,
  `SECURITY`, issue/PR templates and `CODEOWNERS`.
- [ ] `publint` and `@arethetypeswrong/cli` pass on both packs.
- [ ] A clean-consumer test installs both packed tarballs into a fresh Vite app
  and imports the component, core helpers and CSS successfully.

### Should Have

- [ ] Turbo remote caching disabled by default; local cache only.
- [ ] Bundle-size check for the React package with a documented budget.
- [ ] Renovate or Dependabot configuration for dependency updates.

### Won't Have (Out of Scope)

- CJS, UMD, AMD or multi-framework adapters — R1 is ESM-only React.
- A mandatory design system, Redux or a runtime CSS-in-JS dependency.
- A backend, database, authentication or persistence layer.
- Commercial licensing, CLA or a proprietary package.

---

## Technical Requirements

### Repository layout

```text
year-planner/
  packages/
    core/
    react/
  apps/
    demo/
    storybook/
  tests/
    e2e/
  docs/
  codeops/
  .github/workflows/
  turbo.json
  pnpm-workspace.yaml
  package.json
```

### Package contracts

| Package | Runtime | Peer dependencies | Public subpaths |
|---|---|---|---|
| `@blendsdk/year-planner-core` | Pure TypeScript | None | `.` |
| `@blendsdk/react-year-planner` | React | `react`, `react-dom` 18.2+/19 | `.`, `./styles.css`, `./adapters/fluent`, `./adapters/mui` |

### Scripts

| Script | Behavior |
|---|---|
| `pnpm dev` | Runs the demo app |
| `pnpm storybook` | Runs Storybook |
| `pnpm typecheck` | `tsc --noEmit` across packages |
| `pnpm lint` | Biome check |
| `pnpm test` | Vitest unit/component tests |
| `pnpm test:e2e` | Playwright |
| `pnpm build` | Builds both packages |
| `pnpm api-report` | API Extractor report |
| `pnpm docs` | TypeDoc + Storybook build |
| `pnpm pack:check` | `publint` + `attw` |
| `pnpm verify` | Aggregate gate |

### Toolchain versions

| Tool | Version |
|---|---|
| Node | 24 LTS |
| pnpm | 12.9.x |
| TypeScript | 6.0.3 |
| Vite | 8.3.x |
| Vitest | 5.1.x |
| Storybook | 10.6.x |
| Playwright | 1.65.x |
| Turbo | 2.11.x |
| Changesets | 3.0.x |
| Biome | 2.6.x |
| API Extractor | 7.60.x |
| TypeDoc | 0.28.x |

---

## Integration Points

- RD-02 through RD-12 consume the package and test scaffolding.
- RD-11 owns the public documentation site built on this toolchain.
- RD-12 owns lockstep versioning, provenance and publishing.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| License | Commercial, open core, MIT | MIT + DCO | Open-source decision; no licensing business | AR #1 |
| Package family | One package, two packages | Core + React | Enforces framework-neutral core and React adapter | AR #2 |
| Repository | BlendSDK monorepo, separate | Separate | Independent release cadence; no React peer for server users | AR #3 |
| Module format | ESM/CJS, ESM-only, UMD | ESM-only | Modern React tooling; lower packaging complexity | AR #26 |
| TypeScript | TS7, TS6 | TS6.0.3, TS7 canary | Storybook/TypeDoc/API Extractor need the TS6 API | AR #4 |
| Versioning | Independent, lockstep | Lockstep | Two tightly coupled packages | AR #27 |

---

## Security Considerations

- **Data sensitivity**: None; the package ships code and sample fixtures only.
- **Input validation**: Build inputs are repository files; CI must not execute
  untrusted fork code with release credentials.
- **Authentication & authorization**: N/A — no runtime service.
- **Injection risks**: No `eval`, no raw HTML, no shell interpolation in runtime
  code. Custom renderers return React nodes.
- **Encryption needs**: N/A — no data at rest or in transit.
- **Rate limiting**: N/A — no network endpoints.
- **Infrastructure**: npm publishing uses GitHub OIDC trusted publishing; no
  long-lived npm tokens. CI secrets are minimal and scoped.

---

## Acceptance Criteria

1. [ ] `pnpm install --frozen-lockfile` succeeds from a clean checkout on Node 24.
2. [ ] `pnpm typecheck` succeeds with `strict: true` and no `any` in public types.
3. [ ] `pnpm build` emits ESM, `.d.ts`, declaration maps and source maps for both packages.
4. [ ] `pnpm pack:check` reports no `publint` or `attw` errors for both packages.
5. [ ] A fresh Vite app installs both packed tarballs and renders `<YearPlanner />`
   without importing internal paths.
6. [ ] CI passes on React 18.2 and React 19; the TS7 canary may fail without
   blocking the release job.
7. [ ] The DCO check rejects a commit without `Signed-off-by`.
8. [ ] `LICENSE` is MIT and the package manifests declare `"license": "MIT"`.
9. [ ] No secrets, tokens or private keys are present in the repository or CI logs.
10. [ ] Security requirements verified: no raw HTML, no `eval`, no runtime shell,
    no hidden data logging.

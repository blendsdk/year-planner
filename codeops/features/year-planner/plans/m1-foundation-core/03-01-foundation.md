# Foundation and Toolchain: M1

> **Document**: 03-01-foundation.md
> **Parent**: [Index](00-index.md)

## Overview

Creates the pnpm workspace, two ESM packages, build/test/docs/release toolchain
and governance required by RD-01. No runtime behavior beyond package exports.

## Architecture

### Proposed Changes

```text
package.json                 root manifest + packageManager
pnpm-workspace.yaml          packages/*, apps/*
turbo.json                   build/test/typecheck/lint/docs pipelines
tsconfig.base.json           strict shared compiler options
packages/core/               @blendsdk/year-planner-core
packages/react/              @blendsdk/react-year-planner
apps/demo/                   Vite consumer
apps/storybook/              Storybook 10
tests/e2e/                   Playwright
.github/workflows/ci.yml     CI
.github/workflows/release.yml OIDC release placeholder
```

### Package contracts

| Package | Exports | Peers |
|---|---|---|
| core | `.` | none |
| react | `.`, `./styles.css` | react/react-dom ^19 |

### Scripts

`dev`, `storybook`, `storybook:build`, `typecheck`, `lint`, `test`, `test:e2e`,
`test:visual`, `test:a11y`, `test:print`, `test:size`, `bench`, `build`,
`api-report`, `docs`, `pack:check`, `verify`, `verify:full`.

`verify` = typecheck + lint + unit + build + api-report + storybook:build +
pack:check + test:size. `verify:full` adds e2e + visual + print; a11y and bench
are wired incrementally as their suites appear.

## Implementation Details

### Root manifest

- `"packageManager": "pnpm@12.9.1"`, `"private": true`, workspaces.
- `"engines": { "node": ">=20.19" }` for tooling; CI uses Node 24.
- Scripts delegate to `turbo run`.

### TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`, `moduleResolution: bundler`.
- TS 6.0.3; a separate `tsc7-canary` CI job uses TS7 `--noEmit` and is allowed
  to fail.

### Build

- Core: `tsc -p tsconfig.build.json` for ESM + `.d.ts` + declaration maps.
- React: Vite library mode for JS/CSS + `tsc` declarations.
- `exports` map with types/import; `sideEffects` only CSS.
- `publint` + `attw` in `pack:check`.

### CI

- Node 24, pnpm cache, `pnpm install --frozen-lockfile`.
- Jobs: typecheck, lint, unit, build, api-report, storybook build, e2e,
  visual, a11y, print, size, pack-check, DCO.
- React 19 smoke tests (React 18 is out of scope).
- Separate `tsc7-canary` job (TS7 `--noEmit`) allowed to fail without blocking
  release.

### Governance

- MIT license, DCO sign-off, CODE_OF_CONDUCT, SECURITY, issue/PR templates,
  CODEOWNERS.
- No CLA, no commercial license, no secrets.

## Code Examples

```json
{
  "name": "@blendsdk/year-planner-core",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist", "README.md", "LICENSE"]
}
```

## Error Handling

| Error Case | Handling Strategy | AR Ref |
|---|---|---|
| Missing package export | `publint`/`attw` fail | AR #4 |
| TS7 toolchain break | canary job fails, release unaffected | AR #5 |
| Dirty publish contents | `files` allowlist + pack dry-run | AR #4 |
| DCO missing | CI blocks merge | AR #9 |

## Testing Requirements

- `pnpm verify` on a clean checkout.
- Clean-consumer Vitest/Playwright installs packed tarballs.
- `publint` and `attw` pass.

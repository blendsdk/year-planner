# Year Planner for React — Agent Guidance

Year Planner for React is an ESM-only pnpm monorepo. The pure temporal, layout,
model and ribbon logic lives in `packages/core`; the React component, interaction
engine, command pipeline, renderer and design-system adapters live in
`packages/react`. The demo and Storybook are private apps.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm verify          # fast gate: typecheck, lint, unit/component coverage, quality contracts, build, API report, size, Storybook, TypeDoc, pack
pnpm verify:full     # release gate: adds Playwright, timezones, audit, performance, benchmarks and the packed consumer
```

## Verification policy (non-negotiable)

**Never run the full test suite unless it is absolutely necessary.** This rule
overrides any general "run everything before finishing" habit. Run only the
checks that the change actually needs, and say which checks you ran.

- Run the package tests for the packages you changed, for example
  `pnpm --filter @blendsdk/react-year-planner test`.
- Run a single test file when that is enough, for example
  `pnpm --filter @blendsdk/react-year-planner exec vitest run src/locale.spec.test.ts`.
- Run `pnpm typecheck`, `pnpm lint`, a package build, `pnpm test:size` or
  `pnpm api-report:ci` only when the change touches types, style, build output,
  bundle size or the public API.
- Run Playwright only for the affected spec file and project. Prefer
  `pnpm test:e2e:affected`, which selects affected units and reuses a passing
  result when its inputs are unchanged. Do not run the whole browser matrix for
  a local change.
- Inspect the plan with `pnpm browser:plan` and the local cache with
  `pnpm test:e2e:status`. CI distributes the same plan across browser shards.
- Run `pnpm verify` or `pnpm verify:full` only when a change crosses the
  toolchain, lockfile, CI, release or packaging boundaries, when the user asks
  for it, or when preparing a release. A feature implementation alone does not
  justify the full gate.
- The full gate is always the release and CI responsibility, not the default
  local workflow.

The test map is opt-in for local task and phase work. CI keeps the full
`verify` job as the authoritative gate. The selector CLI is provided by the
CodeOps runtime through `$CODEOPS_PLUGIN_ROOT`; it is not a project dependency.

Exec-plan passes the phase baseline with `--baseline <tree>` and the plan's
declared specification file with `--include <path>`. A changed path that the map
does not own selects the full command; an unowned spec file does the same.

The task and phase gates run task-tier groups only. Browser and performance
specs are release-tier: when changing `tests/e2e/**` or `tests/perf/**`, run the
release gate or `pnpm verify:full`. Run the map check after editing the map.

<!-- CODEOPS-PROJECT:START -->
## Testing

<!-- CODEOPS-TESTING:START -->
- Test map: `codeops/test-map.json` (15 groups, 4 slices)
- Task verify: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD`
- Phase verify: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate phase --baseline <phase-tree>`
- Gate verify: `pnpm verify:full`
- Map check: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" check --strict`
- Browser plan: `pnpm browser:plan --gate pr --json`
- Browser affected: `pnpm test:e2e:affected --paths <a,b>`
- Last map check: 2026-11-13 22:13
<!-- CODEOPS-TESTING:END -->
<!-- CODEOPS-PROJECT:END -->

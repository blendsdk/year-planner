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
- Test map: `codeops/test-map.json` (10 groups, 3 slices)
- Task verify: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate task --baseline HEAD`
- Phase verify: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" run --gate phase --baseline <phase-tree>`
- Gate verify: `pnpm verify:full`
- Map check: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" check --strict`
- Last map check: 2026-11-12 12:17
<!-- CODEOPS-TESTING:END -->
<!-- CODEOPS-PROJECT:END -->

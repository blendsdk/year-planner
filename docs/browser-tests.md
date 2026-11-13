# Browser tests

The browser suite contains 249 test executions across 15 spec files and six
browser projects. Running all of them on one machine takes about 16 minutes, and
most changes affect only a few of them. Two mechanisms reduce that cost without
weakening the release gate:

- **Affected selection** runs only the spec files whose sources changed.
- **Sharding** spreads the selected work across independent CI jobs.

A local **result ledger** adds a third saving: a spec and browser pair that
already passed with exactly the same inputs is not executed again.

The full suite still runs on the release gate and in CI. A cached local pass is
local evidence, never a release signal.

## Groups

The test map keeps one group per behaviour, not one group per folder:

| Group | Spec files |
| --- | --- |
| `e2e.grid` | `classic-year.spec.ts`, `i18n.spec.ts` |
| `e2e.visual` | `quality-visual.spec.ts`, `fit.spec.ts` |
| `e2e.print` | `print-matrix.spec.ts` |
| `e2e.interaction` | `interaction.spec.ts`, `context-menu.spec.ts` |
| `e2e.touch` | `interaction-touch.spec.ts` |
| `e2e.mobile` | `mobile.spec.ts` |
| `e2e.commands` | `commands.spec.ts` |
| `e2e.accessibility` | `accessibility.spec.ts` |
| `e2e.security` | `security.spec.ts` |
| `e2e.docs` | `storybook.spec.ts`, `site.spec.ts`, `full-demo.spec.ts` |

Each group declares the production sources that can change its behaviour.
`codeops/browser-plan.json` adds the Playwright projects, the estimated
duration and the browser download needed for each group.

## Commands

```bash
pnpm test:e2e:affected              # local: affected units, ledger reuse
pnpm test:e2e:affected --dry-run    # show cached and pending units
pnpm test:e2e:status                # ledger summary
pnpm browser:plan                   # text plan
pnpm browser:plan --gate pr --json  # full plan and GitHub matrix
```

`test:e2e:affected` compares the working tree with `origin/main` by default.
Pass `--baseline HEAD` to look only at uncommitted work, or `--paths a,b` to
simulate a change set.

When the selected work includes the documentation group, the command rebuilds
Storybook and VitePress first, because those specs serve built artifacts rather
than the development server. `--no-build` skips that step when the artifacts are
known to be current.

The plan output names every shard, its browser download, its estimated seconds
and the specs it contains.

## Selection rules

The planner reads the same test map as the CodeOps selector:

1. A change to a `fullOnPaths` entry, such as `package.json` or `scripts/**`,
   selects every browser group.
2. Paths listed in `ignorePaths`, such as `docs/**`, select nothing.
3. A group is selected when a changed path matches one of its `sources` or
   `tests` globs.
4. A changed path that no group owns selects every group. This is deliberate:
   a new file may change behaviour the map does not describe yet.
5. At the pull-request gate the `prSmoke` groups are added.

A browser group is selected even when the change would otherwise be deferred as
release-tier work. The browser plan is the only consumer that needs that
distinction.

## Shards

`scripts/browser-shards.mjs plan` packs units with a longest-processing-time
greedy pass:

- Chromium units are balanced across two shards by default.
- Firefox and WebKit each get one shard.
- Touch and mobile projects share one small shard.

The plan produces five jobs. A local verification against the built artifacts
produced these results:

| Shard | Passed | Failed | Skipped | Duration |
| --- | ---: | ---: | ---: | ---: |
| `chromium-1` | 36 | 0 | 0 | 147 s |
| `chromium-2` | 44 | 0 | 1 | 124 s |
| `firefox` | 39 | 0 | 16 | 127 s |
| `webkit` | 39 | 0 | 16 | 104 s |
| `mobile` | 3 | 0 | 0 | 7 s |

The whole matrix therefore takes about **2.5 minutes of wall-clock time in
parallel**, against about **16 minutes** for the single serial job.

Groups that generate PDFs pin one worker on the browser that generates them.
Chromium's PDF pipeline is not safe when two print tests write at the same time,
so `e2e.grid` declares `"workersByProject": { "chromium": 1 }` and `e2e.print`
declares `"workers": 1`. A shard inherits the strictest limit of the units it
contains, so Firefox and WebKit keep two workers.

## Port isolation

CI runners are isolated and use ports 4173, 4176 and 4177. A developer machine
can host another project on one of those ports, so `browser-shards.mjs run`
assigns each shard its own block starting at 4300 (`PLAYWRIGHT_CI_PORT_BASE`).
`playwright.ci.config.ts` and the Storybook and docs specs read the same three
port variables. `test:e2e:affected` uses 4310/4313/4314 for the development
servers. This is what allowed all five shards to be verified locally while
another project held 4173.

CI builds the demo, Storybook and documentation once in `browser-build`, then
each shard serves that static output through `playwright.ci.config.ts`.

## The ledger

The ledger lives at `.cache/browser-ledger.json` and is ignored by Git. It
stores one entry per spec, project and group.

An entry is reused only when its fingerprint matches. The fingerprint covers:

- the spec file and its relative helper imports;
- the spec's snapshot files;
- the source globs of the owning group;
- the test map, browser plan and Playwright configuration;
- the lockfile and package manifest;
- the operating system, architecture, Node version, Playwright version and
  installed browser revisions.

Changing a source file invalidates the affected units. Touching a file without
changing its content does not, because hashing is content-based.

Only a genuine pass is recorded. A failed, timed-out, interrupted or
all-skipped unit is never cached, and a failure removes any previous entry. The
next run therefore cannot reuse a stale success.

## Adding a browser test

1. Add the spec to a group in `codeops/test-map.json`, or create a group with
   its sources.
2. Add the group to `codeops/browser-plan.json` with its projects and duration.
3. Run `pnpm browser:plan --paths <a source file>` and confirm the new spec
   appears in exactly one shard.
4. Run `pnpm test:e2e:affected --paths <the same file>`.
5. Run the map check: `node "$CODEOPS_PLUGIN_ROOT/bin/codeops-test.mjs" check --strict`.

The quality tests in `tests/quality/browser-plan.*.test.ts` fail when selection,
packing or ledger reuse stops following these rules.

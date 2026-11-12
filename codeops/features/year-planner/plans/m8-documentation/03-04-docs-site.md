# Docs Site: Documentation, Storybook and API Reference

> **Document**: 03-04-docs-site.md
> **Parent**: [Index](00-index.md)

## Overview

RD-11 publishes Storybook at `/` and TypeDoc at `/api/`. The repository is
private first, so the plan builds and verifies the artifact on every relevant CI
run, uploads it, and keeps a manual `main`-only deploy job. Actual publication
waits for the public-release step.

## Architecture

### Current Architecture

`pnpm storybook:build` builds Storybook inside the app and writes
`apps/storybook/storybook-static/` (gitignored). `pnpm docs:build` writes
`docs/api/` (gitignored) and copies `docs/api-index.html` to
`docs/api/index.html`. Storybook 10 emits relative `./` asset URLs, which already
work under a repository subpath. Nothing combines the two outputs, and no
workflow uses the GitHub Pages actions.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Build packages and assemble/verify the artifact | `scripts/build-docs-site.mjs` |
| Type declarations for the script | `scripts/build-docs-site.d.mts` |
| Expose the command | `package.json` `docs:site` |
| Build Storybook into the repo root | `apps/storybook/package.json` |
| Build on push, upload, guarded deploy | `.github/workflows/pages.yml` |
| Build and verify on pull requests | `.github/workflows/ci.yml` |
| Document the release-time enable step | `docs/README.md` |

## Implementation Details

### Artifact layout

```text
storybook-static/            # repo root, built by storybook:build
├── index.html               # Storybook manager, relative ./ asset URLs
├── iframe.html              # Storybook preview
├── ...                      # manager, addons and story assets
└── api/
    ├── index.html           # docs/api-index.html landing page
    ├── core/**              # TypeDoc for @blendsdk/year-planner-core
    └── react/**             # TypeDoc for @blendsdk/react-year-planner
```

`apps/storybook/package.json` changes its build script to
`storybook build -o ../../storybook-static`, so `pnpm storybook:build` and
`docs:site` share one canonical output path. The app-local `storybook-static/`
is no longer produced.

### `scripts/build-docs-site.mjs`

1. Resolve the repository root from the script URL; import `node:fs`,
   `node:path`, `node:url` and `node:child_process`.
2. Parse `--root <dir>` (default: repository root) and `--check-only`.
3. In build mode, remove `<root>/storybook-static/` and run `pnpm build` first:
   the workspace packages export `dist/`, which is gitignored, so a clean
   checkout cannot build Storybook or TypeDoc without it.
4. Run `pnpm storybook:build` (outputs `<root>/storybook-static/`).
5. Run `pnpm docs:build`, then copy `docs/api/` to
   `<root>/storybook-static/api/`.
6. Verify:
   - `<root>/storybook-static/index.html` exists;
   - every relative `src`/`href` in `index.html` and `iframe.html` resolves to an
     existing file; external, `data:` and anchor URLs are skipped;
   - `api/index.html`, `api/core/index.html` and `api/react/index.html` exist;
   - every relative link on the API landing page resolves on disk;
   - a bounded crawl of the generated TypeDoc pages finds no broken relative
     link.
7. Print a one-line summary with the file count and the artifact root; exit
   non-zero on any failure.

`--check-only` runs only step 6 against an existing artifact and never deletes
or rebuilds anything. `--root` lets the implementation test point the checker at
a temporary fixture.

### `.github/workflows/pages.yml`

```yaml
name: Docs site
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy:
        description: Deploy the built site to GitHub Pages
        type: boolean
        default: false
permissions:
  contents: read
```

- `build` job: checkout, pnpm, Node 24, `pnpm install --frozen-lockfile`,
  `pnpm docs:site`, `actions/upload-pages-artifact` with
  `path: storybook-static`.
- `deploy` job: `needs: build`,
  `if: github.event_name == 'workflow_dispatch' && inputs.deploy && github.ref == 'refs/heads/main'`,
  `environment: github-pages`, job-level `pages: write` and
  `id-token: write`, `actions/configure-pages` then `actions/deploy-pages`.
- No hardcoded base path: the relative Storybook URLs work under the Pages path
  returned by `configure-pages`.
- Never use `pull_request_target`; never expose secrets; no `write-all`.

### Pull-request job

`ci.yml` gains a `docs-site` job that runs `pnpm build && pnpm docs:site && pnpm docs:site -- --check-only`
and uploads `storybook-static/` as an artifact. It is independent of the fast
`verify` job and does not remove or weaken any existing job.

### Enabling Pages at release

`docs/README.md` documents the one-time release step: enable Pages with
"GitHub Actions" as the source, confirm the plan supports Pages for the
repository, then run the Docs site workflow on `main` with `deploy: true`.
Until then every push builds and uploads the artifact but publishes nothing.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| The workspace build fails | Script exits non-zero with the failing command | AR-8 |
| Storybook or TypeDoc fails | Script exits non-zero with the failing command | AR-8 |
| The API tree is missing | Script fails and names `docs/api/index.html` | AR-8 |
| A relative asset or link is broken | Script resolves it on disk and fails with the path | AR-8, AR-25 |
| `--check-only` sees no artifact | Script reports "artifact missing"; it never deletes first | AR-8 |
| The deploy job runs before release or off `main` | It is manual-only, `deploy: true`, and `refs/heads/main` | AR-2, AR-9 |
| Pages is not enabled | Only the manual deploy job can fail; the build and PR jobs stay green | AR-9 |

> **Traceability:** every publication decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/docs-site-contract.spec.test.ts` owns the fast ST-19 through
  ST-21 assertions (script and workflow configuration).
- `tests/quality/docs-site.impl.test.ts` owns the checker failure modes with
  `--root` temporary directories.
- `pnpm docs:site` and `pnpm docs:site -- --check-only` are the real-artifact
  proofs; they run in Phase 4 and in the PR `docs-site` job, not in the 30-second
  quality project.
- No browser server is added; the checks are filesystem and HTML assertions.

# Docs Site: Documentation, Storybook and API Reference

> **Document**: 03-04-docs-site.md
> **Parent**: [Index](00-index.md)

## Overview

RD-11 publishes Storybook at `/` and TypeDoc at `/api/` under the repository base
path. The repository is private first, so the plan builds and uploads the
artifact in CI, keeps a guarded manual deploy job, and leaves the actual
publication to the public-release step.

## Architecture

### Current Architecture

`pnpm storybook:build` writes `storybook-static/` (gitignored).
`pnpm docs:build` runs TypeDoc into `docs/api/` (gitignored) and copies
`docs/api-index.html` to `docs/api/index.html`. Nothing combines the two, and no
workflow uses the GitHub Pages actions.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Build and verify the combined artifact | `scripts/build-docs-site.mjs` |
| Expose the command | `package.json` `docs:site` |
| Build on push, upload, guarded deploy | `.github/workflows/pages.yml` |
| Document the release-time enable step | `docs/README.md` |

## Implementation Details

### Artifact layout

```text
storybook-static/
├── index.html            # Storybook manager, asset URLs under /year-planner/
├── ...                   # Storybook frames, assets and stories
└── api/
    ├── index.html        # docs/api-index.html landing page
    ├── core/**           # TypeDoc for @blendsdk/year-planner-core
    └── react/**          # TypeDoc for @blendsdk/react-year-planner
```

### `scripts/build-docs-site.mjs`

1. Resolve the repository root from the script URL; use `node:child_process` and
   `node:fs` only.
2. Remove the previous `storybook-static/`.
3. Build Storybook with `STORYBOOK_BASE=/year-planner/` (forwarded to the child
   process).
4. Build TypeDoc with `pnpm docs:build`.
5. Copy `docs/api/` to `storybook-static/api/`.
6. Verify:
   - `storybook-static/index.html` exists and every `src`/`href` asset URL that
     points into the bundle starts with `/year-planner/`;
   - `storybook-static/api/index.html`, `api/core/index.html` and
     `api/react/index.html` exist;
   - the three landing links resolve on disk;
   - a sample of generated TypeDoc links resolves on disk.
7. Print a one-line summary with the file count and base path; exit non-zero on
   any failure.

The script accepts `--check-only` to verify an existing artifact without
rebuilding, so a reviewer can inspect a downloaded CI artifact.

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
- `deploy` job: `needs: build`, `if: github.event_name == 'workflow_dispatch' &&
  inputs.deploy`, `environment: github-pages`, job-level `pages: write` and
  `id-token: write`, `actions/configure-pages` then `actions/deploy-pages`.
- Never use `pull_request_target`; never expose secrets; no `write-all`.

The base path `/year-planner/` matches the repository name
(`github.com/blendsdk/year-planner`). If the repository is renamed, the constant
in the script and the Storybook build must change together.

### Enabling Pages at release

`docs/README.md` documents the one-time release step: enable Pages with
"GitHub Actions" as the source, confirm the plan supports Pages for the
repository, then run the Docs site workflow with `deploy: true`. Until then every
push builds and uploads the artifact but publishes nothing.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Storybook or TypeDoc fails | Script exits non-zero with the failing command | AR-8 |
| The API tree is missing | Script fails and names `docs/api/index.html` | AR-8 |
| An asset URL ignores the base path | Script fails and prints the offending URL | AR-7 |
| A landing link is broken | Script resolves it on disk and fails with the path | AR-8 |
| The deploy job runs before release | It is manual-only and guarded by `deploy: true` | AR-2, AR-9 |
| Pages is not enabled | Only the manual deploy job can fail; the build job stays green | AR-9 |

> **Traceability:** every publication decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/docs-site-contract.spec.test.ts` owns ST-18 through ST-22.
- `pnpm docs:site -- --check-only` runs after the build in the pages workflow and
  is the composition proof.
- No browser server is added; the checks are filesystem and HTML assertions.

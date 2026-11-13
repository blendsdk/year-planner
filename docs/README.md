# Documentation

Year Planner for React is an open-source React component for long-range annual
planning. This page is the entry point for the developer guides.

## Documentation map

| Topic | Page |
| ----- | ---- |
| Getting started | [getting-started.md](getting-started.md) |
| Controlled API | [controlled-api.md](controlled-api.md) |
| Visibility semantics | [visibility.md](visibility.md) |
| Selection and keyboard | [interaction.md](interaction.md) (keyboard map: [accessibility.md](accessibility.md)) |
| Theming | [theming.md](theming.md#css-variables) |
| Customization and holidays | [customization.md](customization.md) |
| Inspector and tooltip | [inspector-tooltip.md](inspector-tooltip.md) |
| Dynamic months | [dynamic-months.md](dynamic-months.md) |
| Print | [print.md](print.md) |
| Accessibility status | [accessibility.md](accessibility.md) |
| Performance status | [performance.md](performance.md) |
| Limitations | [limitations.md](limitations.md) |
| Migration | [migration.md](migration.md) |
| FAQ | [faq.md](faq.md) |

## Reference and evidence

- [Controlled command lifecycle](commands.md) — validation, outcomes, retries and rollback.
- [Architecture](architecture.md) — the package and documentation pipeline.
- [Security notes](security.md) — XSS, CSP, hidden data, dependencies and accepted risk.
- [Test report](test-report.md) — commands, counts, browser matrix and known gaps.
- [Benchmarks](benchmarks/rd10-after.md) — measured layout and browser performance.
- [ADR 0001](adr/0001-renderer-strategy.md) — the HTML/CSS renderer decision.
- [Deferred capabilities](https://github.com/blendsdk/year-planner/blob/main/DEFERRED.md) — what R1 does not implement.

## Published sites

The documentation site is one GitHub Pages artifact:

| Path | Content |
| --- | --- |
| `/year-planner/` | VitePress home, guide, tutorials, how-tos and examples |
| `/year-planner/storybook/` | The static Storybook catalogue |
| `/year-planner/api/` | The generated TypeDoc reference |

This is a project site, so the base path is `/year-planner/`. There is no
custom domain. The build accepts `DOCS_BASE_PATH=/` when one is added later.

## Publishing the site

The docs-site workflow builds the combined artifact and publishes only through
a manual `workflow_dispatch` run with `deploy: true` from `main`. Before the
first release:

1. Make the repository public, or confirm the plan supports Pages on a private
   repository.
2. Enable GitHub Pages with **GitHub Actions** as the source.
3. Run the **Docs site** workflow on `main` with `deploy: true`.

The build does not depend on a stored secret; the deploy job uses the GitHub
OIDC token and the `github-pages` environment. The uploaded artifact is
`docs/.vitepress/dist`.

## Building the site locally

```bash
pnpm docs:dev                  # VitePress at /year-planner/
pnpm docs:site                 # packages, Storybook, TypeDoc, VitePress, copy, verify
pnpm docs:site -- --check-only # verify the last build without rebuilding
pnpm docs:preview              # preview the last VitePress build
```

The VitePress dev server proxies `/year-planner/storybook` to a Storybook dev
server on `http://localhost:6006`, so the live examples work while you edit
either side. Run `pnpm storybook` in another terminal.

## Package status

The packages are not published to a public registry yet. Use the packed-tarball
consumer path in [getting-started.md](getting-started.md) until the release
milestone publishes them.

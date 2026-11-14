# Documentation

Year Planner for React is a source-available React component for long-range annual
planning. This page is the entry point for the developer guides.

## Documentation map

| Topic | Page |
| ----- | ---- |
| Getting started | [getting-started.md](getting-started.md) |
| Classic year layout | [classic-year-layout.md](classic-year-layout.md) |
| Controlled API | [controlled-api.md](controlled-api.md) |
| Visibility semantics | [visibility.md](visibility.md) |
| Selection and keyboard | [interaction.md](interaction.md) (keyboard map: [accessibility.md](accessibility.md)) |
| Theming | [theming.md](theming.md#css-variables) |
| Localization | [localization.md](localization.md) |
| Customization and holidays | [customization.md](customization.md) |
| Inspector and tooltip | [inspector-tooltip.md](inspector-tooltip.md) |
| Dynamic months | [dynamic-months.md](dynamic-months.md) |
| Print | [print.md](print.md) |
| Accessibility status | [accessibility.md](accessibility.md) |
| Browser test selection and sharding | [browser-tests.md](browser-tests.md) |
| Performance status | [performance.md](performance.md) |
| Limitations | [limitations.md](limitations.md) |
| Migration | [migration.md](migration.md) |
| FAQ | [faq.md](faq.md) |
| Licence and permitted uses | [licensing.md](licensing.md) |

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
| `/year-planner/localization.html` | Languages and message overrides |

This is a project site, so the base path is `/year-planner/`. There is no
custom domain. The repository is public, Pages is enabled with **GitHub
Actions**, and the site is live at
`https://blendsdk.github.io/year-planner/`. The build accepts `DOCS_BASE_PATH=/`
when a custom domain is added later.

## Publishing the site

The docs-site workflow builds the combined artifact. Pushing to `main` builds
and uploads it; publication stays a manual `workflow_dispatch` run with
`deploy: true` from `main`. The one-time setup is complete: the repository is
public, Pages uses **GitHub Actions**, and the `github-pages` environment is
configured. The build does not depend on a stored secret; the deploy job uses
the GitHub OIDC token. The uploaded artifact is `docs/.vitepress/dist`.

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

The packages are published to npm at `0.3.2` with provenance. `0.3.0` was the
unprovenanced bootstrap that created the package names. Install the component
with `pnpm add @blendsdk/react-year-planner`; see
[getting-started.md](getting-started.md).

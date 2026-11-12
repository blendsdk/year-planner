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
- [Deferred capabilities](../DEFERRED.md) — what R1 does not implement.

## Published sites

The Storybook site is the published component catalogue; the generated TypeDoc
reference is served at `/api/`. Both are built from this repository when the
release pipeline enables the docs site. The markdown guides on this page are the
repository documentation and are not copied into the published artifact.

## Publishing the site

The docs-site workflow, added with the release pipeline, builds and uploads
`storybook-static/` and publishes only through a manual `workflow_dispatch` run
with `deploy: true` from `main`. Before the first release:

1. Open the repository settings and enable GitHub Pages with **GitHub Actions**
   as the source.
2. Confirm the repository plan supports Pages.
3. Run the **Docs site** workflow on `main` with `deploy: true` once it is added.

The build does not depend on a stored secret; the deploy job uses the GitHub
OIDC token and the `github-pages` environment.

## Package status

The packages are not published to a public registry yet. Use the packed-tarball
consumer path in [getting-started.md](getting-started.md) until the release
milestone publishes them.

# Migration and Versioning

> **Scope**: migrating the early preview, the ESM-only boundary and the
> versioning policy for future releases.

## Early preview

The early preview used a different theme shape. The current package keeps the
following compatibility rules:

- `YearPlannerTheme` is the token object returned by `createTheme`; preset strings
  use `YearPlannerThemeName`.
- `display.theme` still accepts a preset string or a host theme name.
- `YearPlannerDisplay` and `YearPlannerPrint` remain aliases for `DisplayConfig`
  and `PrintConfig`.
- The additive `units` prop remains and wins over theme geometry.

The `0.3.0` release changes the default geometry: `display.fit` defaults to
`"contain"`, so the planner fits its bounded host region instead of rendering at
the fixed 55/40/70/90 design units. Give the planner a bounded parent, or set
`display={{ fit: "none" }}` to keep the previous explicit-size behaviour. The
previous behaviour is otherwise unchanged; print still uses the A3 matrix.

A host migrating from the preview should replace a hand-built theme object with
`createTheme({ ... })`, move geometry into theme tokens or `units`, and import the
stylesheet from `@blendsdk/react-year-planner/styles.css`.

## ESM-only

The packages are `"type": "module"`, expose only `import` conditions, and build
`formats: ["es"]`. There is no CommonJS or UMD entry. A CommonJS host must use a
dynamic `import()` or bundle the component with an ESM-aware tool.

## Semver

The first public release is the `0.3.x` line. `0.3.0` is the bootstrap
publication that creates the npm packages; `0.3.1` is the first
provenance-signed release. `0.2.0` is never published. Both `0.3.x` releases
share the same API.

Once the packages are published, they follow semantic versioning:

- **patch** — fixes and documentation, no public API change;
- **minor** — additive API, new stories or new optional props;
- **major** — a breaking public API change, including a removed or renamed export.

Before 1.0, a minor release may include a breaking change when the change is
recorded in a changeset and the API report diff is reviewed. The changelog and the
changeset are the release notes; the checked-in API report is the review record.

## API reports

`packages/core/etc/year-planner-core.api.md` and
`packages/react/etc/react-year-planner.api.md` are checked in. `pnpm api-report`
regenerates them locally; `pnpm api-report:ci` compares them and fails on an
unreviewed change. A public API change therefore requires an explicit report diff
in the same change.

```bash
pnpm api-report      # review the diff locally
pnpm api-report:ci   # the CI comparison
```

## Deprecation

A deprecated export stays in the report with a `@deprecated` note for at least one
minor release before removal. The note names the replacement and the first release
that will remove it. There is no silent alias removal.

## Upgrading the documentation

The guides live in the repository. When a release changes a public prop, update
the owning guide and the Storybook state in the same change; a stale guide is a
defect, not a follow-up.

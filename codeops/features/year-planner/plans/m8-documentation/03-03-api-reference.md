# API Reference: Documentation, Storybook and API Reference

> **Document**: 03-03-api-reference.md
> **Parent**: [Index](00-index.md)

## Overview

TSDoc is the single source of truth for the public surface. API Extractor turns it
into checked-in reports and fails CI on an unreviewed API change; TypeDoc turns it
into the `/api` HTML. RD-11 requires TSDoc on every public class, interface, type,
function, hook and component prop, no missing release tags, and `@example` on the
public entry points.

## Architecture

### Current Architecture

- Both packages build declarations, then run API Extractor against
  `packages/<pkg>/etc/*.api.md`.
- `pnpm api-report:ci` compares the report and fails on a change.
- Both `api-extractor.json` files set `ae-missing-release-tag` to `none`.
- TypeDoc builds `docs/api/core` and `docs/api/react`; `docs/api-index.html` is
  copied to `docs/api/index.html`.
- The reports contain 55 `(undocumented)` entries for core and 57 for React.
  All React entries are interface members; core adds three top-level type
  aliases.

### Proposed Changes

| Change | File |
| ------ | ---- |
| Document every public interface member | `packages/core/src/**`, `packages/react/src/**` |
| Add entry-point examples | `YearPlanner.tsx`, `provider.tsx`, `theme.ts`, `layout/classic-year.ts`, `ribbon/fragments.ts` |
| Enable the release-tag rule | `packages/core/api-extractor.json`, `packages/react/api-extractor.json` |
| Enable TypeDoc validation | `typedoc.core.json`, `typedoc.react.json` |
| Regenerate the reviewed reports | `packages/*/etc/*.api.md` |
| Rebuild the HTML reference | `docs/api/**` (generated) |

## Implementation Details

### Documentation groups

| Group | Files | Members |
| ----- | ----- | ------- |
| Core periods and intervals | `period.ts`, `interval.ts` | `AllDayPeriod` 3, `TimedPeriod` 4, `DateInterval` 2 |
| Core diagnostics | `diagnostics.ts` | `Diagnostic` 6 |
| Core layout | `layout/classic-year.ts` | `ClassicYearLayoutOptions` 5, `ClassicYearUnits` 5, `DayColumnLayout` 6, `MonthRowLayout` 12, `YearLayout` 9 |
| React render contexts | `types.ts` | `AnnotationRenderContext` 2, `CellRenderContext` 4, `ItemRenderContext` 6, `OverflowRenderContext` 3, `TooltipRenderContext` 2 |
| React inspector and theme | `types.ts`, `theme.ts` | `InspectorActions` 5, `InspectorRenderContext` 3, `ResolvedTheme` 3 |
| React slots | `types.ts` | `YearPlannerComponents` 9 |
| React handle | `types.ts`, `YearPlanner.tsx` | `YearPlannerHandle` 20 |
| Type aliases | `layout/classic-year.ts` | `ClassicYearLayoutResult` and the other undocumented aliases |

Exact counts come from the red contract run; the plan does not invent a number
that the reports do not show.

### TSDoc rules

- Each member gets one sentence describing its meaning and any unit, default or
  invariant that is not obvious from the type.
- No member doc restates the type name (`/** The layer id. */` is not enough when
  the value has a precedence rule; state the rule).
- `@example` is added to `YearPlanner`, `YearPlannerProvider`, `createTheme`
  (exists), `buildClassicYearLayout` and `buildRibbonLayout`.
- `@public` release tags are added where the extractor reports them missing; no
  `@internal` is added to a currently public export.

### TypeDoc validation

Both configs gain:

```json
"validation": { "notDocumented": true, "invalidLink": true }
```

If `invalidLink` flags a generated cross-link that cannot be fixed, the failure is
reported and the option is narrowed with a recorded reason; `notDocumented` is
not waived.

### API report update

The reports are regenerated with `pnpm api-report` (the `--local` path) and
checked with `pnpm api-report:ci`. The diff is reviewed as the public API change
record; no signature changes are expected.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| A public member still has no TSDoc | Contract test fails and names the report entry | AR-10, AR-11 |
| A public export has no release tag | API Extractor warning; contract test fails | AR-10 |
| TypeDoc rejects an undocumented reflection | `docs:build` fails; fix the doc, do not disable the rule | AR-10 |
| A generated link is broken | `invalidLink` reports it; fix the anchor or narrow the option with a reason | AR-10 |
| The API report changes unintentionally | `api-report:ci` fails; review the diff before regenerating | AR-11 |

> **Traceability:** every enforcement decision above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- `tests/quality/tsdoc-contract.spec.test.ts` owns ST-13 through ST-17.
- The test reads the checked-in reports, so it protects the reviewed surface, not
  an intermediate build.
- `pnpm docs:build` is the TypeDoc proof and runs inside `pnpm verify`.

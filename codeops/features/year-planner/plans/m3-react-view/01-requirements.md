# Requirements: M3 React View

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-06](../../requirements/RD-06-react-view-theming.md) — the owning requirements document

## Scope of this plan (delta view)

### In this plan

- RD-06 Must Have: public props/handle, HTML/CSS 39-column renderer, scroll
  container, sticky headers, zoom 0.75–1.5, `scrollToDate`, `ResizeObserver`,
  CSS-variable theming, `createTheme`, optional provider, five presets,
  override surface, `unstyled`, `getDateMeta`, all render slots, inspector,
  fragment proxy contract, tooltip contract, Fluent adapter and optional MUI
  adapter, localized Gregorian labels, `displayTimeZone`, instance isolation,
  no global resets, SSR safety, CSP documentation, non-color layer identity.
- RD-06 Should Have: `data-yp-theme`, per-instance variables, token mapping and
  explicit `dir="ltr"`. Fluent/MUI example stories are RD-11 (AR-27).
- **ESM-only packaging** (user directive, AR-30): `"type": "module"`, `import`-only
  export map, Vite `formats: ["es"]`, no CJS/UMD.
- RD-06 AC1–AC18: AC1–AC2, AC10–AC13 in unit/E2E tests; AC4–AC9, AC14–AC18 in
  React tests. AC3 is partially evidenced: the slot contract uses host
  `<button>` fixtures and token adapters; actual Fluent/MUI package components
  are RD-11 examples (AR-27).
- Annotation items render but remain host-owned for edits (AR-31); command
  rejection is explicit rather than a local merge.

### Minimal contracts pulled from RD-04/RD-07/RD-08

- Canonical `PlannerSelection`, `PlannerCommand`, `CommandContext`,
  `CommandOutcome`, `ValidationResult` type definitions in core (RD-04 declares
  them; M2 omitted them).
- `emptySelection` and `selectionItemIds` helpers.
- A command request pipeline for inspector/handle commands. RD-07 owns pointer
  gestures; RD-08 owns rollback, stale-response cancellation and the full
  lifecycle.

### Deferred / out of this plan

- RD-07: pointer selection matrix, marquee, drag/move/resize previews, paint
  gestures, keyboard selection algebra, auto-scroll, touch editing.
- RD-08: full command lifecycle, optimistic previews, rollback, request
  cancellation, accepted-not-applied timeout, controlled-host undo.
- RD-09: full axe and screen-reader conformance, live announcements.
- RD-10: performance benchmarks and full security gate suite.
- RD-11: complete Storybook and API documentation set.
- RD-12: versioning, changelog and publishing.
- RTL, configurable week start, aggregated density, SVG/PDF file export,
  loading/error slots, raw HTML injection, mandatory Fluent/MUI dependencies.

## Plan-local decisions

| Decision | Chosen | AR Ref |
|---|---|---|
| Scope boundary | All RD-06 ACs + minimal command/selection contracts | AR-1 |
| Contracts | Type-only core module | AR-2 |
| Theme | 24 tokens → CSS variables; five presets | AR-4 |
| Provider | Optional context; explicit props win | AR-5 |
| State | Controlled wins; visibility seeded once | AR-6, AR-7 |
| Renderer | HTML/CSS only | AR-9 |
| Zoom | Scale design units in React | AR-10 |
| Slots | Additive inside owned semantic surfaces | AR-22 |
| Commands | Host validation/request with timeout | AR-18 |
| Print | Hidden per-page tree from M2 plan | AR-23 |

## Acceptance criteria

The owning RD keeps AC1–AC18. This plan verifies each AC through the ST cases
in [07-testing-strategy.md](07-testing-strategy.md). Deferred behavior is listed
in [02-current-state.md](02-current-state.md#gaps-owned-by-later-rds).

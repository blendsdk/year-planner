# Fit and Typography: Product Quality

> **Document**: 03-02-fit-typography.md
> **Parent**: [Index](00-index.md)

## Overview

The classic grid is about 2,000 px wide and 1,332 px tall at its default units.
The zoom floor is 0.75, which still overflows an embedded 1440 × 900 laptop
with a sidebar. This component makes the grid measure its **host region**,
scale columns horizontally, choose a vertical lane budget with 24 px items, and
scroll inside its own viewport when the floor is reached. It also centres the
month/year label and moves header typography into CSS variables.

The fit is deliberately **two-dimensional**. A single uniform scale cannot
satisfy both goals at once: shrinking a 90 px row to fit 800 px makes the
24 px item proxy 14 px, which breaks the accessibility contract. The fit
therefore scales column widths and chooses how many 24 px lanes fit vertically.

## Architecture

### Current Architecture

- `DEFAULT_UNITS` in `classic-year.ts:146-152`: month band 70, weekend 40,
  weekday 55, row 90, header 36.
- `theme.ts:49-53` mirrors the units; hosts can override them.
- `geometry.ts:13-20` clamps zoom to `[0.75, 1.5]`.
- `.yp-root` is content-sized (`styles.css:4-42`); `.yp-viewport` scrolls
  (`styles.css:60-66`). The component does not measure its host region.
- Ribbon rows grow beyond `rowHeight` when lanes need more space:
  `max(rowHeight, visibleLaneCount × laneHeight + laneTop)`
  (`fragments.ts:183-193`). `laneTop` is not exposed through the React layer.
- `.yp-month` is 18 px/700, left-aligned with `padding-left: 13px`;
  `.yp-heading` is 14 px/700.

### Proposed Changes

| Change | File |
| ------ | ---- |
| `display.fit` type and default | `packages/react/src/types.ts` |
| Fit option resolution and validation | `packages/react/src/options.ts` |
| Host-region measurement, horizontal scale and vertical lane budget | `packages/react/src/YearPlanner.tsx`, `geometry.ts` |
| Unit profiles, `laneTop` plumbing and font-token defaults | `packages/react/src/theme.ts` |
| Centred month/year label | `packages/react/src/render/MonthRow.tsx`, `styles.css` |
| Header and cell type tokens | `packages/react/src/styles.css` |
| Bounded app-shell demo | `apps/demo/src/App.tsx` |
| Visual baselines and Playwright snapshots | `evidence/rd13-baseline/`, `tests/e2e/fit.spec.ts` |
| Public API report | `packages/react/etc/react-year-planner.api.md` |

## Implementation Details

### Public API

```ts
interface DisplayConfig {
  /** Fit the grid to its host region; defaults to "contain". */
  fit?: "none" | "contain";
  /** User zoom; in fit mode it scales columns only. Defaults to 1. */
  zoom?: number;
  /** Existing lane density; unchanged outside fit mode. */
  density?: "compact" | "expanded";
}
```

`fit: "none"` preserves the current behavior exactly. `fit: "contain"` changes
the default geometry; the migration guide records that a host that wants the
old fixed units sets `fit: "none"`.

### Unit profiles

| Profile | Weekday | Weekend | Band | Row | Lane | Lane top | Lanes at 1.0 |
| ------- | ------- | ------- | ---- | --- | ---- | -------- | ------------ |
| comfortable (current) | 55 | 40 | 70 | 90 | 24 | 18 | 3 |
| compact | 34 | 28 | 48 | 64 | 24 | 16 | 2 |
| dense | 26 | 24 | 36 | 51 | 24 | 14 | 1 |

Lane height is **24 px in every profile**; it is the interactive floor. The
row height is a maximum, not a minimum: the vertical budget may reduce it to
`laneTop + visibleLanes × 24`. The dense profile is the fallback when the host
region is small; it shows one lane and routes the rest to the existing overflow
popover.

### Host-region measurement

The component root is content-sized and must not be observed for height. The
fit measures:

- the nearest positioned ancestor with a non-zero height (the host region), or
  the `.yp-viewport` parent when no such ancestor exists;
- the viewport width from the same element.

The host contract is documented in `docs/getting-started.md`: give the planner
a bounded region (`height: 100%`, `min-height: 0`, or a fixed height). If no
bounded region exists, the fit uses the viewport as the height and the page
scrolls; the component never assumes the root's content height is the available
height.

`ResizeObserver` updates are debounced to one animation frame. A zero-size
observation keeps the last valid geometry; the initial geometry is the
comfortable profile at scale 1 until the first valid observation.

### Fit algorithm

1. Measure `availableWidth` and `availableHeight` from the host region.
2. Subtract the header, footer and the 1 px grid border from the available
   height.
3. Choose a base profile from comfortable to dense:
   - compute the natural width `2 × band + Σ column widths`;
   - compute `fitX = min(1, availableWidth / naturalWidth)`;
   - clamp `fitX` so `weekday × fitX ≥ 24` and `weekend × fitX ≥ 24`.
4. If the clamped profile still exceeds the width, try the next profile. If
   none fits, use dense and let `.yp-viewport` scroll horizontally.
5. Compute the vertical budget from the chosen profile:
   - `maxRowHeight = availableGridHeight / rowCount`;
   - choose the largest `visibleLanes` in `1..3` with
     `laneTop + visibleLanes × 24 ≤ maxRowHeight`;
   - `minRowHeight = laneTop + 24` (one lane);
   - `rowHeight = min(profileRowHeight, maxRowHeight)`, but never below
     `laneTop + visibleLanes × 24`;
   - if `maxRowHeight < minRowHeight`, use one lane and scroll vertically.
6. Apply `fitX` to the month band and column widths. Do **not** rebuild the
   layout units with the fit scale; pass one composed `renderZoom = fitX ×
   userZoom` to `YearGrid` and the interaction mapping so pointer coordinates
   stay consistent. In fit mode `userZoom` scales columns only; vertical
   geometry is the fit budget. Clamp `renderZoom` to the 24 px column floor.
7. If `density: "expanded"` is set, the non-fit mode keeps all lanes; in fit
   mode the vertical budget wins and extras go to overflow.
8. Recompute on resize, theme change, month count change and density change.
   Ignore a zero-size container and keep the last valid geometry.

Natural-size arithmetic uses the **actual ribbon row heights** from
`buildRibbonLayout`, not a naive `rows × rowHeight`, and includes the 1 px
border. A unit test asserts that the measured natural height equals the model.

### Typography

- `.yp-month` becomes a centred two-line label:
  `display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 0 6px;`
  with `font-size: var(--yp-font-size-month)`, `font-weight: 600` and
  `line-height: 1.1`.
- The label uses the short month name and a **two-digit year for every month**
  (for example `Sep` / `27`). The full year stays in the accessible name and
  tooltip. This keeps the dense 36 px band legible.
- `.yp-heading` becomes `font-size: var(--yp-font-size-heading)`,
  `font-weight: 600`, `letter-spacing: 0.02em`.
- The tokens are declared once in the theme root:
  `--yp-font-size-heading: 11px`, `--yp-font-size-month: 13px`,
  `--yp-font-size-day: 9px`, `--yp-font-size-cell-label: 9px`,
  `--yp-line-height-tight: 1.1`.
- Day numbers and ISO week numbers already inherit `font-variant-numeric:
  tabular-nums` from `.yp-root`; a computed-style test proves it.
- Cell labels keep their 9 px size and read from the token.
- Print typography is untouched.

### Demo shell

`apps/demo/src/App.tsx` wraps the planner in:

```text
app shell (100dvh, grid rows: auto 1fr)
├── header (title, theme/month/density controls)
├── body (grid columns: 260px 1fr)
│   ├── sidebar (zoom, interaction mode, event hints)
│   └── planner region (min-height: 0; overflow: hidden)
└── footer (status)
```

The planner region gets `height: 100%` and `min-height: 0`; the planner fills
it and scrolls internally. The default window stays 14 months; the month
selector includes 12 for short screens. A production-preview screenshot is part
of the baseline.

### Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Host region has no bounded height | Use the viewport height and let the page scroll; document the bounded-region contract | AR-5 |
| Container has zero size (hidden tab) | Keep the last valid geometry; the initial geometry is comfortable at scale 1 | AR-5 |
| Container is narrower than the 24 px column floor | Keep the floor and scroll horizontally | AR-7 |
| A lane cannot fit at 24 px | Use one lane and scroll vertically; extras go to overflow | AR-5, AR-7 |
| Theme units are invalid or non-finite | Fall back to the comfortable profile and the existing validation diagnostics | AR-10 |
| `zoom` is below the column floor | Clamp the composed scale to the floor; document that zoom cannot make columns smaller than 24 px | AR-31 |
| `fit` is combined with print | Print ignores fit and uses A3 geometry | AR-30 |
| Resize storms during a window drag | Debounce to one animation frame and compare the rounded geometry before writing | AR-8 |
| A dense month label overflows its band | Use the short month and two-digit year; a text-fit assertion checks `scrollWidth <= clientWidth` | AR-10 |

> **Traceability:** every design choice above is recorded in
> [00-ambiguity-register.md](00-ambiguity-register.md).

## Testing Requirements

- Unit tests for profile selection, horizontal clamp, vertical lane budget,
  natural-height arithmetic with actual row heights and the 1 px border.
- Component tests with a mocked `ResizeObserver` for `contain`, `none`, zero
  size, resize updates and a host region without a bounded height.
- E2E at 1280 × 800, 1440 × 900 and 1024 × 768: no page-level or component
  scroll for the 1280 × 800 / 14-month case, every grid cell and item proxy at
  least 24 × 24, and the month label centred within its band.
- Playwright `toHaveScreenshot` at the three sizes; the docs images are
  evidence, not the regression gate.
- Computed-style assertions for the font variables; a quality contract rejects
  a hard-coded header `font-size` in `styles.css`.
- The existing print matrix must stay green; fit is screen-only.
- The existing 1600 × 1200 visual snapshots are rebaselined because the default
  fit changes the geometry.

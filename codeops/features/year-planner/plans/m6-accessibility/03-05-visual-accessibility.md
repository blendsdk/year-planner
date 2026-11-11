# Visual Accessibility: Accessibility Plan

> **Document**: 03-05-visual-accessibility.md
> **Parent**: [Index](00-index.md)

## Overview

This specification covers contrast, target size, non-colour state cues, forced colours, reduced
motion and print. It changes theme defaults and CSS only. It does not add a public theme token.

## Contrast

### Ribbon text computation

The classic-blue preset uses `#ffffff` on `#76bfe5` (2.03:1). Instead of adding a `ribbonText` token
to the public theme, `YearPlanner` computes one CSS custom property from the existing tokens:

```ts
/** Returns the candidate with the higher WCAG contrast ratio. */
export function readableTextColor(
  background: string,
  candidates: readonly [string, string],
): string;
```

The theme-ribbon candidates are `theme.textPrimary` and `theme.textInverse`. Item fragments compute
their own text colour from the actual fragment background with `textPrimary`, `textInverse` and
white as candidates, because a host ribbon layer can be much darker than the theme ribbon (for
example the classic-yellow theme has a dark `textInverse`). Hex values are parsed for luminance;
non-hex values fall back to `textPrimary`. The theme result is passed as `--yp-ribbon-text`
alongside the existing CSS variables. Hosts can override it with `cssVars`.

`styles.css` applies `color: var(--yp-ribbon-text)` to `.yp-band`, `.yp-heading`, `.yp-month` and
`.yp-fragment-ribbon`.

### Measured results

| Preset | Ribbon | Chosen text | Ratio | Focus ring on surface | Border on surface |
| ------ | ------ | ----------- | ----- | --------------------- | ----------------- |
| classic-blue | `#76bfe5` | `#1b2329` | 7.85 | 5.28 | 4.03 |
| classic-yellow | `#f6f368` | `#24251d` | 13.22 | 5.33 | 3.58 |
| modern | `#243b53` | `#ffffff` | 11.50 | 4.24 | 3.54 |
| high-contrast | `#000000` | `#ffffff` | 21.00 | 8.59 | 21.00 |
| print | `#2f5d8a` | `#ffffff` | 6.88 | 21.00 | 21.00 |

The modern border changes from `#8a99a8` (2.92:1) to `#7b8a99` (3.54:1). Text sizes stay above the
4.5:1 target; focus rings and borders meet the 3:1 graphical-object target.

### Focus ring on ribbon fragments

The current proxy ring is drawn inside the fragment, where `#0b6bcb` on `#76bfe5` is 2.60:1. The
new rule draws the ring outside the proxy with a 2 px surface halo:

```css
.yp-proxy:focus-visible {
  outline: 2px solid var(--yp-focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--yp-surface);
}
```

The dark ring is adjacent to the surface halo (5.28:1 in classic-blue), so the focus indicator is
visible on ribbon, cell and selected backgrounds. Host themes inherit the same rule.

### Lane-height supersession

RD-06 set the default lane height to 18 px. RD-09 target size requires 24 px. This plan records the
supersession explicitly: ST-39 is the new oracle and the old 18 px constant assertion in
`theme.spec.test.tsx` is replaced. Changing the test is not fitting it to the implementation; the
requirement changed (AR-19).

## Target size

| Control | Current | New |
| ------- | ------- | --- |
| Date cell | 55×90 | unchanged |
| Item proxy | height 18 | height 24 (`laneHeight` default) |
| Resize handle | 7×18 | 24×24 hit area, 3 px visual line |
| Overflow button | 28×20 | at least 24×24 |
| Inspector buttons | min-height 26 | unchanged |
| Inspector close | 26×26 | unchanged |
| Skip link | none | padded to at least 24 px high when focused |

Three lanes at 24 px plus the 18 px lane top equal the existing 90 px row height
(`3 × 24 + 18 = 90`), so lane capacity and row height do not change. `theme.ts`, the CSS default
and the theme test constant move from 18 to 24.

Resize handles become 24×24 transparent buttons. A `::after` pseudo-element draws the visible 3 px
line so the larger hit area does not look heavy.

## Non-colour state cues

| State | Visual cue in addition to colour | Accessible cue |
| ----- | -------------------------------- | -------------- |
| Selected date | 2 px inset outline, bold day number | `aria-selected=true`, name says `selected` |
| Selected item | 2 px inset outline, bold underlined label | `aria-pressed=true`, name says `selected` |
| Holiday | Dotted underline under the day number | Cell name says `holiday` |
| Overflow | `+N` text | `aria-expanded`, count in name |
| Layer | `solid`/`hatch`/`dots` pattern and visible layer label | Name includes layer and pattern |
| Pending | Dashed outline | `aria-busy=true` |

## Media queries

### Forced colours

```css
@media (forced-colors: active) {
  .yp-cell,
  .yp-heading,
  .yp-band,
  .yp-month,
  .yp-fragment,
  .yp-inspector,
  .yp-overflow-popover {
    border-color: CanvasText;
  }
  .yp-cell:focus-visible,
  .yp-proxy:focus-visible,
  .yp-overflow-button:focus-visible,
  .yp-inspector button:focus-visible {
    outline: 2px solid Highlight;
  }
  .yp-proxy[aria-pressed="true"],
  .yp-cell[aria-selected="true"] {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
```

### Reduced motion

There are no animations today. The plan adds a defensive block:

```css
@media (prefers-reduced-motion: reduce) {
  .yp-root,
  .yp-root * {
    scroll-behavior: auto;
    animation: none;
    transition: none;
  }
}
```

The project CSS test forbids `!important`; there are no competing animation rules, so the
unprefixed declarations are sufficient.

### Print

Print already hides the interactive viewport and inspector and renders static `aria-hidden` pages.
The plan adds `.yp-command-status`, `.yp-skip-link` and `.yp-sr-only` to the print hide list so no
interactive-only affordance leaks into the printed output.

## Bundle cost

The accessibility layer adds label composition, the item list, the overlay, announcements and the
status bar. The measured package is **63.36 kB gzip** against the previous 60 kB budget. RD-09 raises
the milestone budget to **65 kB** and records the 3.36 kB cost for the RD-10 performance pass
(AR-22).

## Error Handling

| Error Case | Handling Strategy | AR Ref |
| ---------- | ----------------- | ------ |
| Theme colour is `var(...)` or a named colour | Fall back to `textPrimary`; host can set `--yp-ribbon-text` | AR-5 |
| Both ribbon candidates fail 4.5:1 | Pick the higher ratio; the preset test fails so the theme is corrected | AR-5 |
| Host overrides lane height | Target size is the host’s responsibility; document the 24 px default | AR-4 |
| Forced-colours mode removes backgrounds | Borders and outlines use system colours | AR-11 |

## Testing Requirements

- Unit tests for luminance, candidate selection and all preset ratios.
- CSS source assertions for the media queries and target sizes.
- Playwright computed-style checks for the 24 px targets and focus outlines.
- Visual snapshot updates after the lane-height and header-colour changes.

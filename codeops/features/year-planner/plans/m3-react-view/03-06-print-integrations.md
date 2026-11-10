# Print and Integrations: M3 React View

> **Document**: 03-06-print-integrations.md
> **Parent**: [Index](00-index.md)

## Overview

Adds real A3 print output driven by the M2 print plan, plus pure token adapters
for Fluent UI v9 and MUI.

## Print planning

The view calls:

```ts
planRibbonPrint(ribbons, {
  page: print?.page ?? "A3",
  mode: print?.mode ?? "paginate",
  rowsPerPage: print?.rowsPerPage,
});
```

- Invalid options forward `INVALID_PRINT_OPTIONS` to `onDiagnostic` and fall
  back to the default paginate plan.
- `mode: "fit"` renders one page with the computed scale. When the plan has
  `PRINT_FIT_TOO_SMALL`, the diagnostic is forwarded and the one-page plan is
  still rendered (no automatic fallback); this is the RD-05 AR-19 contract.
- `paginate` renders one page per `PrintPage`, strictly following the core row
  chunks (14 rows per page by default).
- Page scales are independent; each page scales uniformly from width and height.
- Each page re-stacks its rows from `top: 0`; header/footer heights come from
  `ribbon.headerHeight`/`footerHeight`, matching the core scale calculation.

## Print DOM

```html
<div data-yp-part="print-pages" aria-hidden="true">
  <section data-yp-part="print-page" style="--yp-print-scale: 0.773">
    <div class="yp-print-surface" style="width: {ribbon.totalWidth}px">
      <header class="yp-row yp-header">...</header>
      ...page rows...
      <footer class="yp-row yp-footer">...</footer>
    </div>
  </section>
</div>
```

- The print tree is hidden on screen with `.yp-print-pages { display: none; }`.
- `@media print` hides the screen viewport/inspector and shows the print tree.
- `@page { size: A3 landscape; margin: 6mm; }`.
- `.yp-print-page` is 1542 × 1077 design px, `overflow: hidden`,
  `break-after: page`; the last page has no forced break.
- `.yp-print-surface` is the full `ribbon.totalWidth` (1995 px at defaults),
  transformed with
  `scale(var(--yp-print-scale))` from the top-left. `--yp-print-scale` comes
  from the page plan; the theme `printScale` token is only a fallback when
  planning is unavailable.
- A non-default `units` value changes `ribbon.totalWidth` and the page scale
  consistently (tested).
- Each page repeats the weekday header and includes month labels, weekend
  tints, ISO week numbers, ribbon fragments, annotations and highlights.
- `print-color-adjust: exact` keeps channel colors on paper.

## Print theme

`display.theme: "print"` uses white surfaces, black text and borders, light gray
weekend/context tints, and saturated channel colors. It never removes month
labels, weekend differentiation, ISO weeks or ribbons.

## Fluent adapter

`@blendsdk/react-year-planner/adapters/fluent`

```ts
export interface FluentLikeTheme {
  colorNeutralBackground1?: string;
  colorNeutralBackground2?: string;
  colorNeutralForeground1?: string;
  colorNeutralForeground2?: string;
  colorNeutralStroke1?: string;
  colorBrandBackground?: string;
  colorPaletteYellowBackground2?: string;
  fontFamilyBase?: string;
  fontSizeBase300?: string;
  fontWeightRegular?: string | number;
}

export function fluentThemeToCssVars(theme: FluentLikeTheme): Record<`--yp-${string}`, string>;
```

Mapping:

| Fluent token | Planner variable |
|---|---|
| `colorNeutralBackground1` | `--yp-surface` |
| `colorNeutralBackground2` | `--yp-surface-muted`, `--yp-context` |
| `colorNeutralForeground1` | `--yp-text-primary` |
| `colorNeutralForeground2` | `--yp-text-muted` |
| `colorNeutralStroke1` | `--yp-border` |
| `colorBrandBackground` | `--yp-ribbon`, `--yp-selection-outline` |
| `colorPaletteYellowBackground2` | `--yp-highlight` |
| `fontFamilyBase` | `--yp-font-family` |
| `fontSizeBase300` | `--yp-font-size` |
| `fontWeightRegular` | `--yp-font-weight` |

- No import from `@fluentui/react-components`; the function accepts a plain
  object.
- Missing tokens are omitted so CSS defaults/theme presets still apply.
- The adapter has no runtime dependency and declares no peer: hosts that use
  Fluent already have it, and the mapper only accepts a plain object.

## MUI adapter

`@blendsdk/react-year-planner/adapters/mui`

```ts
export interface MuiLikeTheme {
  palette?: {
    primary?: { main?: string };
    background?: { default?: string; paper?: string };
    text?: { primary?: string; secondary?: string };
    divider?: string;
  };
  typography?: { fontFamily?: string; fontSize?: number };
}

export function muiThemeToCssVars(theme: MuiLikeTheme): Record<`--yp-${string}`, string>;
```

| MUI value | Planner variable |
|---|---|
| `palette.background.default` | `--yp-surface` |
| `palette.background.paper` | `--yp-surface-muted`, `--yp-context` |
| `palette.text.primary` | `--yp-text-primary` |
| `palette.text.secondary` | `--yp-text-muted` |
| `palette.divider` | `--yp-border` |
| `palette.primary.main` | `--yp-ribbon`, `--yp-selection-outline` |
| `typography.fontFamily` | `--yp-font-family` |
| `typography.fontSize` | `--yp-font-size` |

Missing values are omitted. The adapter never imports `@mui/material` and
  declares no peer.

## Package and build contract

- Vite multi-entry input:

```ts
lib: {
  entry: {
    index: "src/index.ts",
    "adapters/fluent": "src/adapters/fluent.ts",
    "adapters/mui": "src/adapters/mui.ts",
  },
  formats: ["es"],
}
```

- `package.json` export objects:

```json
"./adapters/fluent": { "types": "./dist/adapters/fluent.d.ts", "import": "./dist/adapters/fluent.js" },
"./adapters/mui": { "types": "./dist/adapters/mui.d.ts", "import": "./dist/adapters/mui.js" }
```

- Adapters declare no Fluent/MUI peer, so package installation does not pull
  either design system into the workspace.
- **ESM-only** (AR-30): `"type": "module"`, every export map condition exposes
  `import` only, Vite builds `formats: ["es"]`, and no CJS/UMD output exists.
  `attw --profile esm-only` is the package gate.
- `scripts/check-size.mjs` includes the adapter JS files in the gzip budget.

## Instance isolation

- Themes are inline CSS variables on each root; the provider only supplies
  defaults at render time, so two roots do not share mutable state.
- `useId` prefixes tooltip/overflow element IDs; no global `defs` IDs exist in
  the HTML renderer.
- CSS selectors are scoped under `.yp-root`; no global resets.

## CSP and security

- The only inline styles are React `style` objects built from typed host props,
  theme tokens, geometry and `getDateMeta` values. Hosts need
  `style-src-attr 'unsafe-inline'`; nonces do not authorize style attributes.
  If a host forbids inline style attributes, theming and geometry are not
  supported in R1.
- Item `metadata` is never read for styles, URLs or HTML. Item
  `style`/`className`/color fields are trusted host presentation input and pass
  through the allowlist in 03-03.
- No `dangerouslySetInnerHTML`, `eval`, remote CSS imports or `url()` values
  from item data.
- `docs/security.md` documents the policy and the trusted-input boundary.

## Testing Requirements

- Paginate 14/24/36 rows produces 1/2/3 print pages with A3 page size.
- Fit produces one page and forwards the sub-7-pt warning; no auto-fallback.
- Print tree contains month labels, weekends, ribbons, annotations and ISO weeks.
- `display.theme: "print"` keeps weekend differentiation and channels.
- Adapter mappings for full and partial themes; no Fluent/MUI import.
- Subpath builds and types resolve; size check includes adapters.
- CSP-style test: metadata strings never appear in fragment `style`/HTML.

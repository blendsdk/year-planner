# React View Guide

> **Scope**: RD-06 — rendered grid, items, theming, slots, inspector and print
> **Status**: Implemented for the classic year view

## Install and import

```bash
pnpm add @blendsdk/react-year-planner react react-dom
```

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";
```

The package is **ESM-only** (`"type": "module"`). It exposes `import` conditions
for the main entry and the two adapter subpaths; no CommonJS or UMD build exists.

## Basic usage

```tsx
<YearPlanner
  year={2027}
  items={items}
  layers={layers}
  groups={groups}
  activeLayerId="bookings"
  display={{ theme: "classic-yellow", zoom: 1, locale: "en-US" }}
/>
```

Use `range={{ start: { year, month }, monthCount }}` for a 12–36 month window;
`range` wins over `year`. `contextMonths` controls the default 14-month preset.

## Data and state

| Prop pair | Behavior |
|---|---|
| `items` / `defaultItems` | Controlled wins; uncontrolled updates from local commands call `onItemsChange`. |
| `visibility` / `defaultVisibility` | Group → layer → item → filter → channel precedence. |
| `selection` / `defaultSelection` | Item/date selection rendered in the grid and inspector. |
| `filter` / `defaultFilter` | Layer, resource, status and title filters. |

Invalid entities are dropped by the core validator; valid siblings still render.
Diagnostics are forwarded to `onDiagnostic`.

## Theming

Themes are CSS variables with a `--yp-` prefix and four ordered layers:

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;
```

```tsx
import { createTheme, YearPlannerProvider } from "@blendsdk/react-year-planner";

const theme = createTheme({ ribbon: "#8358c6", rowHeight: 96 });

<YearPlannerProvider theme={theme}>
  <YearPlanner year={2027} />
</YearPlannerProvider>;
```

Presets: `classic-blue`, `classic-yellow`, `modern`, `high-contrast`, `print`.
`cssVars` and `style` override tokens per instance. `unstyled` removes decorative
fills, borders and shadows but keeps structure, focus and print geometry.

Geometry tokens are design-pixel numbers (`rowHeight`, `laneHeight`,
`monthBandWidth`, `weekendWidth`, `weekdayWidth`); `"<n>px"` strings are
normalized. An explicit `units` prop wins over theme geometry. Geometry set only
through arbitrary `cssVars` changes CSS variables, not the JavaScript layout; use
theme tokens or `units` when the layout must change.

### Fluent UI v9 and MUI adapters

```ts
import { fluentThemeToCssVars } from "@blendsdk/react-year-planner/adapters/fluent";
import { muiThemeToCssVars } from "@blendsdk/react-year-planner/adapters/mui";

<YearPlanner cssVars={fluentThemeToCssVars(fluentTheme)} />;
<YearPlanner cssVars={muiThemeToCssVars(muiTheme)} />;
```

Adapters accept plain objects, import neither design system and declare no
peer dependency. Missing tokens are omitted so preset defaults remain.

| Fluent / MUI input | Planner variables |
|---|---|
| neutral background / background.default | `--yp-surface` |
| neutral background 2 / background.paper | `--yp-surface-muted`, `--yp-context` |
| foreground 1 / text.primary | `--yp-text-primary` |
| foreground 2 / text.secondary | `--yp-text-muted` |
| stroke 1 / divider | `--yp-border` |
| brand / primary.main | `--yp-ribbon`, `--yp-selection-outline` |
| yellow palette / warning | `--yp-highlight` |
| font family/size/weight | `--yp-font-family`, `--yp-font-size`, `--yp-font-weight` |

## Items, annotations and overflow

Visible items are projected into fragments clipped to month rows. Ribbon and
foreground fragments expose a focusable proxy with sibling resize handles;
backdrop channels are not focusable. Compact density shows at most the configured
lanes and exposes the rest through a per-row `+N` popover. Annotations render as
badges and can be hidden with `display.showAnnotations: false`.

Selected proxies use `aria-pressed`, not `aria-selected`. Ribbons use the item
color, then the layer color, then the theme ribbon color. Custom `renderItem`
content is additive and must not contain interactive controls inside the proxy;
the component warns in development, but cannot prevent host-injected controls.

## Slots

```tsx
<YearPlanner
  getDateMeta={(date) => (date === "2027-12-24" ? { holiday: true, label: "X" } : undefined)}
  renderCell={() => <span>extra</span>}
  renderItem={({ item }) => <span>{item.status}</span>}
  renderTooltip={({ item }) => <span>{item.title}</span>}
  renderOverflow={(context) => <span>{context.hiddenCount} hidden</span>}
  renderInspector={(context) => <span>{context.items.length} selected</span>}
/>
```

`components` wraps inner content of structural parts; the planner keeps the
outer element, ARIA, focus and hit surface. `renderCell` and `renderItem` cannot
remove those surfaces.

## Interaction

Pointer, keyboard and touch editing are covered in
[interaction.md](interaction.md). Set `interaction.mode` to `auto` for
move/resize/marquee, `select` for date ranges, `paint`/`erase` for the active
highlight layer, or `create` for drag-created items. `touchEditing` is the
host-owned touch toggle: `auto` and `off` remain scroll-first, `on` enables
editing with `touch-action: none`.

Delete uses the DOM-focused item first, then the selected item. Hidden items are
pruned from selection; focus falls back to the nearest enabled date and is
announced in a polite live region.

## Inspector

The component-owned inspector lists selected item details, visibility,
editability, overflow items and command feedback. Actions use the same request
pipeline as imperative calls: local read-only/version checks → optional
`validateChange` → optional `onChangeRequest` with one shared deadline → a
tracked request settlement. Controlled items are authoritative; uncontrolled
mode applies through the local reducer. Pending items are marked with
`data-yp-pending` and `aria-busy`; warnings appear as inspector notices; accepted,
rejected and accepted-not-applied outcomes are announced in a polite live
region. Default actions move ±7 days, resize by one day, delete with
confirmation, paint/erase the selected range, and create one day on the active
layer. Annotation items render but are host-owned for edits in this slice; their
inspector actions are disabled. `renderInspector` replaces the body; the aside
and close button remain. See [commands.md](commands.md) for the host contract.

## Print

The component renders a hidden print tree planned by the core. Paginate produces
1/2/3 A3 pages for 12–14 / 15–28 / 29–36 months, with each page scaled uniformly
inside both A3 dimensions. Fit mode renders one page and reports
`PRINT_FIT_TOO_SMALL` when date text would fall below 7 pt. Month labels,
weekends, ISO weeks, ribbons and annotations are preserved.

## SSR

The component reads no browser globals during render, uses explicit `en-US` and
`UTC` defaults, and attaches observers only after mount. The entry declares
`"use client"` so React Server Component bundlers place it in a client boundary.
A node `renderToString` test and a hydration test guard this contract.

## Storybook

The project mandate is to create as many stories as possible. The Storybook site
currently contains **144 stories across ten files**, covering themes, layouts,
zoom, locales, items, annotations, channels, overflow, inspector states, slots,
print modes, controlled/filter/read-only states and token adapters. Run
`pnpm storybook` locally or build the static site with `pnpm storybook:build`.

## ESM-only package

`packages/react/package.json` is `"type": "module"`; every export map condition
uses `import`; Vite builds `formats: ["es"]`; `attw --profile esm-only` and the
package test enforce the contract.

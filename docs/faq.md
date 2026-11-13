# FAQ

## Questions

### Does the planner work with Next.js and React Server Components?

Yes. The package entry declares `"use client"`, reads no browser globals during
render, and uses explicit `en-US` and `UTC` defaults. Render it on the server with
`renderToString` and hydrate with the same explicit `display.locale`.

### Why 37 day columns?

Each month row always draws 37 day columns: up to six leading blanks for the
weekday offset plus at most 31 days. The fixed width keeps every month row aligned
regardless of the weekday the month starts on; it is not related to the number of
context months.

### How do I hide an item without deleting it?

Pass <code v-pre>visibility={{ hiddenGroupIds, hiddenLayerIds, hiddenItemIds }}</code> or the
uncontrolled `defaultVisibility`. A hidden item disappears from the grid, the
inspector, the overflow list and print. See [visibility.md](visibility.md).

### Why did my edit not persist?

The planner does not persist data. In controlled mode it calls
`onSelectionChange`, `onVisibilityChange` or the command callbacks; the host must
apply the change to `items`. In uncontrolled mode an accepted change calls
`onItemsChange`. Check `onDiagnostic` for a validation or version rejection.

### Can I put a button inside an item?

No. The item proxy is already a focusable control; a nested button or link is
invalid. Put actions in the inspector, or use `renderItem` for non-interactive
content. `renderInspector` can render real design-system buttons.

### Does the component support recurrence or dependencies?

Not in R1. Those capabilities are listed in [DEFERRED.md](https://github.com/blendsdk/year-planner/blob/main/DEFERRED.md) and are
not stubbed. Use a host-side expansion into concrete items if you need them now.

### How do I print an A3 page?

Set <code v-pre>print={{ page: "A3", mode: "paginate" }}</code> or `mode: "fit"`, then call
`window.print()`. Hide host chrome in `@media print`. See [print.md](print.md).

### Can I use Fluent UI v9 or MUI?

The adapters map a Fluent or MUI theme object to planner CSS variables without
importing either design system. Real Fluent/MUI components can be rendered in a
cell or the inspector through the render slots; see [theming.md](theming.md).

### Is the planner accessible?

It has keyboard semantics, roving focus, live regions, contrast evidence and
automated axe coverage. The manual NVDA/VoiceOver audit is parked, so no WCAG
conformance claim is made. See [accessibility.md](accessibility.md).

### Why is the bundle a single file?

Per-export tree-shaking is deferred. The React entry plus CSS is measured under
the 60 kB target, and the combined installed surface stays under the 72 kB guard.
Language catalogues are an optional package and are measured separately.
See [limitations.md](limitations.md).

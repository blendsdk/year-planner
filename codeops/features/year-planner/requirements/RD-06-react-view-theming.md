# RD-06: React View, Theming and Style Integration

> **Document**: RD-06-react-view-theming.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-03, RD-04, RD-05
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Owns the React rendering surface: the calendar grid, labels, headers, shape
plane, item proxies, annotation layer, theming tokens, custom render slots and
integration with host design systems such as Fluent UI v9 and MUI.

The visual plane is replaceable, but the interaction and accessibility shells
are owned by the component. Custom renderers decorate content; they do not
replace hit-testing, focus or geometry.

---

## Functional Requirements

### Must Have

- [ ] Export `<YearPlanner />` with `year`/`range`, `items`, `groups`, `layers`,
  `resources`, `annotations`, `visibility`, `selection`, `interaction`,
  `display`, callbacks, render slots and `ref` handle.
- [ ] Default HTML/CSS Grid renderer: 39 columns including two month bands,
  transparent cell layer, background layer, date/week labels, item proxies and
  overlays.
- [ ] The optional SVG shape/connector renderer is selected only after the M0
  evidence gate; the public API must not expose an unstable renderer switch.
- [ ] Theming through CSS custom properties with a `--yp-` prefix and
  `@layer year-planner.base, theme, components, overrides`.
- [ ] `createTheme(tokens)` returns a typed theme; `YearPlannerProvider` is
  optional; CSS variables work without React context.
- [ ] Presets: `classic-blue`, `classic-yellow`, `modern`, `high-contrast`,
  `print`.
- [ ] Consumers can override via `className`, `style`, `cssVars`, stable
  `data-yp-part` attributes and slot components.
- [ ] `unstyled` / `appearance="unstyled"` keeps structural CSS but removes
  decorative defaults.
- [ ] `getDateMeta(date)` returns optional `{ holiday, label, background, color,
  className, style, disabled, ariaLabel, content, priority }`; custom cell
  backgrounds/text and official holidays are host data.
- [ ] Render slots: `renderCell`, `renderItem`, `renderAnnotation`,
  `renderOverflow`, `renderEmpty`, `renderLoading`, `renderError` and
  `components` for structural parts.
- [ ] Item proxies are HTML elements aligned to fragment bounds; they provide
  focus, accessible names, labels and resize handles. SVG shapes, if used, are
  decorative and `aria-hidden`.
- [ ] Fluent UI v9 adapter maps Fluent theme tokens to planner CSS variables;
  MUI adapter is optional; neither is a hard dependency.
- [ ] Labels use `Intl.DateTimeFormat` with the host locale; month names,
  weekday names and date numbers are localized. The grid remains Saturday-first
  in R1.
- [ ] Multiple planner instances isolate CSS and SVG/defs IDs.
- [ ] No global resets, no `!important`, no runtime CSS-in-JS dependency.
- [ ] The component is SSR-safe: no `window`/`document` during render; the React
  entry declares a client-component boundary where the bundler requires it.

### Should Have

- [ ] A `data-yp-theme` attribute and CSS variables for per-instance themes.
- [ ] Fluent/MUI example stories and a documented token mapping table.
- [ ] `dir="ltr"` explicit in R1; RTL deferred.

### Won't Have (Out of Scope)

- A mandatory Fluent/MUI peer dependency.
- Full headless primitive composition in R1.
- RTL, configurable week start, aggregated density.
- Shadow DOM isolation — CSS layers and prefixing are the contract.
- Raw HTML injection or `dangerouslySetInnerHTML`.

---

## Technical Requirements

### Layer stack (default HTML renderer)

```text
z0 background grid: weekend/context tints, grid lines
z1 optional SVG shape plane: highlights, ribbons, annotations, connectors
z2 cell layer: transparent cells, date numbers, ISO weeks, ARIA/focus
z3 item proxies/content: labels, badges, Fluent/MUI content, handles
z4 overlay: marquee, tooltip, diagnostics
```

### Theme tokens

| Group | Examples |
|---|---|
| Surface | background, surface, weekend, context, border |
| Text | primary, muted, inverse, date number |
| Selection | fill, outline, focus ring |
| Channels | highlight, ribbon, annotation, foreground |
| Geometry | row height, lane height, month band, weekend/weekday width |
| Typography | family, size, weight |
| Print | page size, scale, color adjustment |

### CSS contract

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;

:where(.yp-root) {
  --yp-surface: #fff;
  --yp-weekend: #e3f7fc;
  --yp-ribbon: #8358c6;
}
```

### Framework adapters

- `@blendsdk/react-year-planner/adapters/fluent`: accepts a Fluent v9 theme or
  tokens and returns planner CSS variables; no `@fluentui/react-components`
  import in the core entry.
- `@blendsdk/react-year-planner/adapters/mui`: accepts an MUI palette and
  returns planner CSS variables; optional peer.
- Adapters are tree-shakable subpaths.

### Complexity

Grid/labels/cells: **M**. Theming/tokens: **M**. Slots/customization: **L**.
Framework adapters: **S**.

---

## Integration Points

- RD-03 supplies rows, dates, labels and geometry.
- RD-04 supplies visibility, annotations and item metadata.
- RD-05 supplies fragment descriptors.
- RD-07 supplies selection and preview state.
- RD-09 owns semantic roles, focus and announcements.
- RD-11 owns Storybook stories and theming documentation.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Styling | CSS-in-JS, CSS modules, CSS variables | CSS variables + CSS modules | No runtime dependency; host override friendly | AR #15 |
| Design system | Fluent/MUI mandatory, optional adapters | Optional adapters | Preserve host choice; Fluent first | AR #33 |
| Custom cells | Replace hit surface, decorate | Decorate | Protects interaction and accessibility | AR #16 |
| Holidays | Built-in, host data | Host data | No unverified holiday truth | AR #16 |
| Renderer | HTML/SVG fixed, evidence | Spike decides | Avoid irreversible coupling | AR #11, #36 |
| Week start | Configurable, fixed | Saturday-first | Photo fidelity; defer RTL/week start | AR #34 |

---

## Security Considerations

- **Data sensitivity**: Render slots may receive business-sensitive item data;
  the component does not log it.
- **Input validation**: Host metadata and styles are treated as untrusted; no
  raw HTML injection.
- **Authentication & authorization**: Host-owned; hidden items are not rendered.
- **Injection risks**: React escaping for text; no `dangerouslySetInnerHTML`; no
  `eval`; no dynamic CSS string injection outside validated token values.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] Switching `classic-blue` to `classic-yellow` changes only theme tokens;
   layout geometry and dates are identical.
2. [ ] A consumer override of `--yp-ribbon` changes ribbon color without
   editing package CSS.
3. [ ] A Fluent UI v9 Button and an MUI Button render inside a cell and an item
   proxy without breaking focus, hit-testing or layout.
4. [ ] A host-supplied holiday annotation renders custom background, text and
   label; no holiday is invented when no data is supplied.
5. [ ] `unstyled` removes decorative colors/borders but keeps structure,
   keyboard focus and print geometry.
6. [ ] No global reset or unscoped element selector is emitted; all component
   selectors are scoped.
7. [ ] Two planner instances with different themes render independently and
   have unique SVG/defs IDs if SVG is enabled.
8. [ ] `renderCell` can add content but cannot remove the date cell's hit
   surface or ARIA label.
9. [ ] SSR renders the grid and labels without touching `window`/`document`.
10. [ ] Print theme preserves month labels, weekends, ribbons and ISO weeks.
11. [ ] Security requirements verified: no raw HTML, no CSS injection, hidden
    items absent from render slots.

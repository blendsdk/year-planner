# Current State: Accessibility and Keyboard Experience

> **Document**: 02-current-state.md
> **Parent**: [Index](00-index.md)

## Existing Implementation

### What Exists

The React renderer already has a substantial accessibility base:

- The grid has `role="grid"`, `aria-colcount="37"`, `aria-rowcount` including header and footer,
  and a configurable name (`packages/react/src/render/YearGrid.tsx:159-174`).
- Month rows use `role="row"`, month bands use `role="rowheader"` and dated cells use
  `role="gridcell"` (`MonthRow.tsx:130-149`, `CellLayer.tsx:104-123`).
- Date focus is roving: exactly one dated cell has `tabindex=0` (`CellLayer.tsx:116`).
- Item proxies are `role="button"` with `aria-pressed`, `aria-busy` and a title/period/layer name
  (`ItemLayer.tsx:184-195`). Resize handles are sibling buttons with `tabindex=-1`.
- The inspector is a labelled `aside` with `tabIndex=-1`, a close button, selected details, an
  overflow section and command feedback (`Inspector.tsx:203-222`, `Inspector.tsx:421-578`).
- The overflow button has `aria-expanded`, `aria-controls` and a count label
  (`Overflow.tsx:63-80`).
- Two polite live regions announce focus fallback and command outcomes
  (`YearPlanner.tsx:700-705`).
- Hidden items are removed from ribbon layout, selection and the inspector list through effective
  visibility checks.
- Themes already include `high-contrast`, focus-visible rings, and `prefers-reduced-motion` has no
  animations to disable.

### Baseline axe evidence

`axe-core@4.14.0` injected into the current demo (`?` default state, Chromium, 1600×1200) reports
two serious rule families:

| Rule | Nodes | Example |
| ---- | ----- | ------- |
| `color-contrast` | 130 | Weekday header `#ffffff` on `#76bfe5` = 2.02:1 |
| `label-content-name-mismatch` | 73 | Week-number cell: visible “49” absent from `aria-label` |

No critical violations. No `aria-required-children`, `nested-interactive` or `aria-allowed-attr`
violations in the baseline.

### Relevant Files

| File | Purpose | Changes Needed |
| ---- | ------- | -------------- |
| `packages/react/src/render/CellLayer.tsx` | Date cells and labels | Item count, ISO week, holiday, selected state, `aria-selected`, hidden visual spans |
| `packages/react/src/render/ItemLayer.tsx` | Item proxies | Rich accessible name, clipping/status, feedback association |
| `packages/react/src/render/MonthRow.tsx` | Row composition | Pass selected dates and active-row overflow state |
| `packages/react/src/render/YearGrid.tsx` | Grid | Help description, header contrast class |
| `packages/react/src/render/Inspector.tsx` | Inspector | Item list, ids, visible status, hidden filtering |
| `packages/react/src/render/Overflow.tsx` | Overflow | Roving tab stop, focus on open, 24 px target |
| `packages/react/src/YearPlanner.tsx` | Root and announcements | Region, skip link, status bar, selection/visibility announcements, invalid active date |
| `packages/react/src/interaction/useInteraction.ts` | Keyboard | Home/End row bounds |
| `packages/react/src/theme.ts` | Tokens | Lane height 24, modern border, ribbon text computation |
| `packages/react/src/styles.css` | Presentation | Contrast, cues, target sizes, forced colours, reduced motion, print |
| `tests/e2e/accessibility.spec.ts` | Browser evidence | New axe matrix and keyboard flows |
| `apps/storybook/stories/Accessibility.stories.tsx` | States | New stories |

## Gaps Identified

### Gap 1: Cell names omit visible state

**Current Behaviour:** `aria-label` is only the formatted date, or the host’s `ariaLabel`.
**Required Behaviour:** include the visible item count, ISO week when shown, holiday and selected
state, while preserving the host override.
**Fix Required:** compose the label in a tested helper; mark planner-owned visual spans
`aria-hidden` when the cell name is authoritative.

### Gap 2: Selected dates have no grid semantics

**Current Behaviour:** selection is drawn by `SelectionPreview` and exposed on the inspector, but
cells have no `aria-selected`.
**Required Behaviour:** every dated cell exposes `aria-selected="true|false"`.
**Fix Required:** derive a selected-date set from `PlannerSelection.dates` and pass it to cells.

### Gap 3: Item names are incomplete

**Current Behaviour:** `title, layer, period`.
**Required Behaviour:** title, date span, layer label/pattern, status, selection and clipping.
**Fix Required:** build the name with a helper; add status and selection; add “partially visible”
when the fragment is clipped.

### Gap 4: Focus can have zero tab stops

**Current Behaviour:** `effectiveActiveDate` falls back to the first date even when that date is
disabled; every cell can then have `tabindex=-1`.
**Required Behaviour:** exactly one enabled date cell is in the tab order.
**Fix Required:** resolve the initial/active date through `nearestEnabledDate`.

### Gap 5: Too many row controls in the tab order

**Current Behaviour:** every row’s overflow button is tabbable.
**Required Behaviour:** one overflow button per component, tied to the active row.
**Fix Required:** roving `tabindex` for overflow buttons; focus the active row when date focus moves.

### Gap 6: No item list

**Current Behaviour:** the inspector shows selected details and the active row’s overflow only.
**Required Behaviour:** a keyboard-reachable list of visible items, including overflow items.
**Fix Required:** add an `Items (N)` section, filter by effective visibility, focus/select on click.

### Gap 7: Command state is announced but not visible

**Current Behaviour:** accepted/rejected text lives in a visually hidden `command-status`; pending
is only `aria-busy`/CSS.
**Required Behaviour:** pending, accepted, rejected, timeout, stale, aborted and
accepted-not-applied are visible and announced once.
**Fix Required:** a visible status bar; assertive error region; a mapping from settlement to text.

### Gap 8: Contrast and label-content mismatches

**Current Behaviour:** classic-blue ribbon text 2.03:1; modern border 2.92:1; visible week numbers
are absent from cell names.
**Required Behaviour:** 4.5:1 text and 3:1 focus/border; visible text included in the name.
**Fix Required:** compute `--yp-ribbon-text`; darken the modern border; include week numbers.

### Gap 9: Target size

**Current Behaviour:** 18 px lane height, 7 px resize handles, 20 px overflow button.
**Required Behaviour:** 24×24 CSS px for interactive targets.
**Fix Required:** lane height 24 (three lanes still fit the 90 px row), 24×24 handles, 24 px
overflow button.

### Gap 10: No skip link or generated help

**Current Behaviour:** no way to jump past the grid; no shortcut description.
**Required Behaviour:** skip link to the item list/inspector; generated hidden help text.
**Fix Required:** root region, skip link, help id, combined `aria-describedby`.

## Dependencies

### Internal Dependencies

- RD-06 DOM/layer structure and slots.
- RD-07 focus, selection and gesture state.
- RD-08 command lifecycle, feedback and settlement types.
- `@blendsdk/year-planner-core` visibility, interval and formatter APIs.

### External Dependencies

- Existing `axe-core@4.14.0` root devDependency.
- Existing Playwright, Vitest and Storybook toolchains.
- No new runtime or dev dependency.

## Risks and Concerns

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Rich labels become noisy for screen-reader users | Medium | Medium | Keep names factual and short; test exact strings |
| 24 px lanes change visual density | High | Low | Three lanes still total 90 px; update visual snapshots once |
| Ribbon text computation misses host themes | Low | Medium | Fall back to `textPrimary`; document `cssVars` override |
| axe scans are slow on 36 months | Medium | Low | Run the matrix in Chromium only; reuse the existing runner |
| Orca cannot attach under Xvfb | Medium | Low | Record the attempt and keep the NVDA/VoiceOver protocol open |
| `renderInspector` host content bypasses the item list | Low | Low | The planner-owned aside, close button and skip target remain |

# RD-09: Accessibility and Keyboard Experience

> **Document**: RD-09-accessibility.md
> **Status**: Implemented — automated evidence current; manual audit parked
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-06, RD-07
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the accessible interaction model for a nonstandard 14×37 calendar. The
component targets WCAG 2.2 AA, but conformance is only claimed after automated
and manual evidence. A grid of up to 1,332 cells (36 months) must not force
screen-reader users to traverse every cell; a logical item list and inspector
provide a parallel path.

---

## Functional Requirements

### Must Have

- [ ] Semantic structure: a labelled calendar region, row/column headers,
  gridcells or equivalent table semantics, and a named item list/inspector.
- [ ] One tab stop for the date grid using roving tabindex; arrow keys move
  date focus; Home/End and PageUp/PageDown are optional enhancements. Visible
  item proxies also use a roving tab stop so the component does not create one
  tab stop per fragment.
- [ ] Shift+Arrow extends a date range; Space toggles the focused date/item;
  Enter inspects; Escape cancels or clears; Delete requires permission and
  confirmation.
- [ ] Item proxies are focusable button-like elements (no nested interactive
  controls) with accessible names containing title,
  date span, layer label/pattern, status, selection and overflow state.
- [ ] Focus is restored to the logical item after lane repack, row clipping,
  hide/show, commit or reject; if removed, focus moves to a nearby date cell and
  an announcement explains the move.
- [ ] A live region announces selection changes, command pending/accepted/
  rejected/timeout/stale/aborted/accepted-not-applied, visibility changes and
  focus fallback.
- [ ] No meaning is conveyed by color alone: selected, hidden, holiday and
  overflow states also use text, outline, pattern or icon.
- [ ] Contrast of text, focus rings and meaningful graphical objects meets
  WCAG 2.2 AA against their backgrounds in all themes.
- [ ] Focus visible on every interactive element; target size meets WCAG 2.2
  minimum (24×24 CSS px) or has an equivalent larger hit area.
- [ ] Motion is optional and respects `prefers-reduced-motion`; no essential
  information depends on animation.
- [ ] Hidden items are absent from the accessibility tree; visibility is not
  authorization, but hidden presentation must not leak details.
- [ ] Decorative SVG shapes are `aria-hidden`; HTML item proxies carry the
  accessible semantics. A proxy must not contain nested interactive controls;
  resize handles are siblings and item actions live in the inspector.
- [ ] The item list/inspector is keyboard reachable without traversing the grid
  and lists overflow items.
- [ ] Errors are associated with the affected item/date and announced; the
  message is visible, not only in ARIA.
- [ ] Print does not rely on interactive-only affordances; focus/selection
  outlines are omitted or adapted.

### Should Have

- [ ] A skip link to the item list/inspector.
- [ ] Configurable `aria-label`/`aria-describedby` for the planner region.
- [ ] High-contrast theme verified in forced-colors mode.

### Won't Have (Out of Scope)

- A claim of WCAG 2.2 AA conformance before the manual audit.
- Full screen-reader certification for every browser/AT combination.
- RTL accessibility behavior — deferred with RTL.
- Voice control or switch-access-specific gestures.

---

## Technical Requirements

### Focus model

- Roving tabindex on date cells; exactly one cell has `tabindex=0`.
- Item proxies use a roving tabindex; exactly one visible proxy has `tabindex=0`
  and the others `-1`. The inspector has a stable landmark/heading.
- Focus state is stored by logical IDs, not DOM nodes.
- After layout changes, a focus-restoration effect resolves the item's first
  visible fragment; fallback is the nearest valid date.

### ARIA contract

| Part | Role / attributes |
|---|---|
| Planner root | `role="group"` or `region`, `aria-label` |
| Grid | `role="grid"`, `aria-rowcount`, `aria-colcount=37` (day columns; month bands are outside the grid) |
| Row | `role="row"` |
| Date cell | `role="gridcell"`, `aria-selected`, `aria-label` with date and **visible** item count |
| Item proxy | `role="button"`, `aria-pressed` only, full label; no nested interactive controls |
| Overflow chip | `aria-expanded`, `aria-controls`, count in label |
| Inspector | labelled region, item details and actions |
| Live region | `aria-live="polite"` for selection; `assertive` for errors |

### Testing

- axe-core automated scan on representative Material/Fluent and utility themes, compact/expanded, overflow, error and
  36-month states.
- Keyboard-only Playwright flows for select, paint/erase, move, resize, cancel.
- Manual screen-reader check with NVDA or VoiceOver before any conformance
  statement; record browser, AT and date in the test report.

### Complexity

Semantics/focus: **L**. Announcements: **M**. Manual audit: **M**.

---

## Integration Points

- RD-06 supplies the DOM/layer structure and slots.
- RD-07 supplies focus, selection and gesture state.
- RD-08 supplies command lifecycle announcements.
- RD-10 owns automated/manual evidence and release gating.
- RD-11 documents keyboard shortcuts and accessibility status.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Grid traversal | All cells (up to 1,332), roving focus + list | Roving + list | Avoids forced traversal; practical | AR #20 |
| Conformance claim | Claim AA, target + audit | Target + audit | Honest evidence-based claim | AR #21 |
| SVG semantics | SVG focus, HTML proxies | HTML proxies | Reliable focus/screen readers | AR #12 |
| Hidden data | Include in tree, exclude | Exclude | Prevent presentation leak | AR #24 |

---

## Security Considerations

- **Data sensitivity**: Accessible names may include titles/dates; hidden items
  must not be named or announced.
- **Input validation**: ARIA labels are generated from validated text and React
  escaping; no raw HTML.
- **Authentication & authorization**: N/A — accessibility does not grant data
  access.
- **Injection risks**: No HTML injection in labels or live-region text.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: N/A.

---

## Acceptance Criteria

1. [ ] A keyboard-only user can focus the grid, move with arrows, extend with
   Shift+Arrow, select, inspect the item list and move an item by a week.
2. [ ] Exactly one date cell is in the tab order at a time; Tab reaches the item
   list/inspector without traversing every date cell.
3. [ ] Every visible item proxy has an accessible name containing title, date
   span, layer and selected state.
4. [ ] A hidden item has no DOM node, accessible name, tooltip or
   accessibility-tree entry.
5. [ ] Focus returns to the logical item after lane repack and after a
   successful command; after hiding the focused item, focus moves to a nearby
   date and the live region announces it.
6. [ ] Pending, accepted, rejected, timeout, stale, aborted and
   accepted-not-applied outcomes are announced once and visible in the UI.
7. [ ] axe reports no serious or critical violations in `material-teal`,
   `fluent-marigold`, `high-contrast`, `print`, overflow, error and 36-month states.
8. [ ] Across all 56 presets, built-in labels on cell surfaces and ribbon/header
   labels meet 4.5:1 contrast; focus/selection outlines and grid borders meet
   3:1 against base cell surfaces. Screen and print use the same readable ribbon
   text choice. Host-supplied colours remain the host's responsibility.
9. [ ] Selected, holiday and overflow states are distinguishable without color.
10. [ ] Manual screen-reader evidence is recorded for at least one of NVDA or
    VoiceOver before any conformance statement is published. **Parked by user
    decision on 2026-11-11**: low priority, not an R1 blocker, no Linux path;
    revisit before any conformance statement.
11. [ ] The inspector is reachable from the item list, lists selected item
    details and overflow items, and returns focus to the grid on close.
12. [ ] A hidden item is absent from the inspector, overflow list and visible
    item count; its title/interval is not announced.
13. [ ] Layers are distinguishable by label/pattern/legend, not color alone.
14. [ ] An item proxy contains no nested interactive control; resize handles are
    siblings; axe/html validation passes.
15. [ ] A 36-month window remains keyboard reachable and axe reports no
    serious/critical violations.
16. [ ] Security requirements verified: hidden data absent from ARIA, labels
    escaped, no HTML injection.

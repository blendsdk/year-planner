# RD-09: Accessibility and Keyboard Experience

> **Document**: RD-09-accessibility.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-06, RD-07
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Defines the accessible interaction model for a nonstandard 14×37 calendar. The
component targets WCAG 2.2 AA, but conformance is only claimed after automated
and manual evidence. A 518-cell grid must not force screen-reader users to
traverse every cell; a logical item list and inspector provide a parallel path.

---

## Functional Requirements

### Must Have

- [ ] Semantic structure: a labelled calendar region, row/column headers,
  gridcells or equivalent table semantics, and a named item list/inspector.
- [ ] One tab stop for the date grid using roving tabindex; arrow keys move
  date focus; Home/End and PageUp/PageDown are optional enhancements.
- [ ] Shift+Arrow extends a date range; Space toggles the focused date/item;
  Enter inspects; Escape cancels or clears; Delete requires permission and
  confirmation.
- [ ] Item proxies are focusable buttons with accessible names containing title,
  date span, layer, status, selection and conflict/overflow state.
- [ ] Focus is restored to the logical item after lane repack, row clipping,
  hide/show, commit or reject; if removed, focus moves to a nearby date cell and
  an announcement explains the move.
- [ ] A live region announces selection changes, command pending/accepted/
  rejected/timeout, visibility changes and focus fallback.
- [ ] No meaning is conveyed by color alone: selected, hidden, conflict, holiday
  and overflow states also use text, outline, pattern or icon.
- [ ] Contrast of text, focus rings and meaningful graphical objects meets
  WCAG 2.2 AA against their backgrounds in all themes.
- [ ] Focus visible on every interactive element; target size meets WCAG 2.2
  minimum (24×24 CSS px) or has an equivalent larger hit area.
- [ ] Motion is optional and respects `prefers-reduced-motion`; no essential
  information depends on animation.
- [ ] Hidden items are absent from the accessibility tree; visibility is not
  authorization, but hidden presentation must not leak details.
- [ ] Decorative SVG shapes are `aria-hidden`; HTML item proxies carry the
  accessible semantics.
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
- Item proxies use `tabindex=0` when visible; the inspector has a stable
  landmark/heading.
- Focus state is stored by logical IDs, not DOM nodes.
- After layout changes, a focus-restoration effect resolves the item's first
  visible fragment; fallback is the nearest valid date.

### ARIA contract

| Part | Role / attributes |
|---|---|
| Planner root | `role="group"` or `region`, `aria-label` |
| Grid | `role="grid"`, `aria-rowcount`, `aria-colcount` |
| Row | `role="row"` |
| Date cell | `role="gridcell"`, `aria-selected`, `aria-label` with date and item count |
| Item proxy | `role="button"`, `aria-pressed`/`aria-selected`, full label |
| Overflow chip | `aria-expanded`, `aria-controls`, count in label |
| Inspector | labelled region, item details and actions |
| Live region | `aria-live="polite"` for selection; `assertive` for errors |

### Testing

- axe-core automated scan on both themes, compact/expanded, overflow and error
  states.
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
| Grid traversal | All 518 cells, roving focus + list | Roving + list | Avoids forced traversal; practical | AR #20 |
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
   list/inspector without traversing 518 cells.
3. [ ] Every visible item proxy has an accessible name containing title, date
   span, layer and selected state.
4. [ ] A hidden item has no accessible name, DOM node or tooltip in the
   accessibility tree.
5. [ ] Focus returns to the logical item after lane repack and after a
   successful command; after hiding the focused item, focus moves to a nearby
   date and the live region announces it.
6. [ ] Pending, accepted, rejected and timeout outcomes are announced once and
   visible in the UI.
7. [ ] axe reports no serious or critical violations in classic-blue,
   classic-yellow, high-contrast, overflow and error states.
8. [ ] Text and focus indicators meet 4.5:1 / 3:1 contrast targets in both
   classic themes.
9. [ ] Selected, holiday, conflict and overflow states are distinguishable
   without color.
10. [ ] Manual screen-reader evidence is recorded for at least one of NVDA or
    VoiceOver before any conformance statement is published.
11. [ ] Security requirements verified: hidden data absent from ARIA, labels
    escaped, no HTML injection.

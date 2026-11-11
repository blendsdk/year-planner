# Requirements: Accessibility and Keyboard Experience

> **Document**: 01-requirements.md
> **Parent**: [Index](00-index.md)
> **Source**: [RD-09](../../../requirements/RD-09-accessibility.md) — the OWNING requirements doc

## Scope of this plan (delta view)

### In this plan

- RD-09 Must Have items 1–15: semantics, roving focus, keyboard commands, rich item names, focus
  restoration, live announcements, non-colour cues, contrast, focus visibility, target size,
  reduced motion, hidden-item exclusion, keyboard item list, associated errors and print behaviour.
- RD-09 Should Have items 1–3: skip link, configurable region label/description, forced-colours
  CSS.
- RD-09 acceptance criteria 1–9 and 11–16.
- RD-09 technical requirements: focus model, ARIA contract and automated testing.
- The complete Storybook surface for the new accessibility states.

### Deferred / out of this plan

- RD-09 acceptance criterion 10: a recorded NVDA or VoiceOver session. It needs a Windows or macOS
  host with the named AT. The plan records an Orca smoke check where the Linux host supports it,
  documents the NVDA/VoiceOver protocol, and publishes no conformance claim.
- PageUp/PageDown navigation: optional in RD-09; arrow keys already move by week.
- Full WCAG 2.2 AA certification: explicitly “Won’t Have” before a manual audit.
- RTL accessibility, voice control and switch-access gestures: out of RD-09 scope.
- Performance, security, browser-matrix and release gating: RD-10.

## Plan-local decisions

| Decision | Chosen | AR Ref |
| -------- | ------ | ------ |
| Item list surface | Inspector section with skip link | AR-1 |
| Selected state | `aria-selected` on cells plus selected text in proxy names | AR-2 |
| Proxy label content | Title, period, layer, pattern, status, selection, clipping | AR-3 |
| Target size mechanism | Default lane height 24 px; 24×24 handles and overflow | AR-4 |
| Ribbon contrast | Computed `--yp-ribbon-text`, no new theme token | AR-5 |
| Modern border | `#7b8a99` | AR-6 |
| Visible command state | Full-width status bar plus inspector feedback | AR-7 |
| Live-region split | Polite visible status; assertive hidden errors; polite hidden selection | AR-8 |
| Overflow tab order | One per component, active row only | AR-9 |
| Invalid active date | Nearest enabled date fallback | AR-10 |
| Non-colour cues | Outline, weight, underline, dotted holiday marker, `+N` | AR-11 |
| Manual AT evidence | Orca smoke check + NVDA/VoiceOver protocol; no conformance claim | AR-12 |
| Error association | Feedback id + proxy `aria-describedby` | AR-13 |
| Home/End | Implement row bounds; PageUp/PageDown optional and omitted | AR-14 |
| Region labelling | Reuse `ariaLabel`/`ariaDescribedBy`; generated help text | AR-15 |
| Verification | Existing `axe-core` through Playwright; `pnpm verify:full` | AR-16 |
| Inspector action focus | Keep focus on the pressed action; gestures restore the item | AR-17 |
| Nested names | Root region label; grid appends “grid” | AR-18 |
| Lane-height test | RD-09 supersedes the old 18 px assertion; ST-39 is the oracle | AR-19 |
| AC14 validation | axe `nested-interactive` plus a DOM scan; no HTML validator dependency | AR-20 |

## Acceptance Criteria

1. A keyboard-only user can focus the grid, move with arrows, extend with Shift+Arrow, select,
   inspect the item list and move an item by a week.
2. Exactly one date cell is in the tab order at a time; Tab reaches the item list and inspector
   without traversing every date cell.
3. Every visible item proxy has an accessible name containing title, date span, layer, pattern,
   status and selected state.
4. A hidden item has no DOM node, accessible name, tooltip, item-list entry or accessibility-tree
   entry.
5. Focus returns to the logical item after lane repack and after a successful command; after hiding
   the focused item, focus moves to a nearby date and the live region announces it.
6. Pending, accepted, rejected, timeout, stale, aborted and accepted-not-applied outcomes are
   announced once and visible in the UI.
7. axe reports no serious or critical violations in classic-blue, classic-yellow, high-contrast,
   overflow, error and 36-month states.
8. Text, focus indicators and meaningful borders meet 4.5:1 / 3:1 targets in the built-in themes.
9. Selected, holiday and overflow states are distinguishable without colour.
10. Manual screen-reader evidence is recorded for at least one of NVDA or VoiceOver before any
    conformance statement is published. _Not reachable on this host; see Deferred._
11. The inspector is reachable from the item list, lists selected item details and overflow items,
    and returns focus to the grid on close.
12. A hidden item is absent from the inspector, item list, overflow list and visible item count;
    its title and interval are not announced.
13. Layers are distinguishable by label, pattern or legend, not colour alone.
14. An item proxy contains no nested interactive control; resize handles are siblings; axe and HTML
    validation pass.
15. A 36-month window remains keyboard reachable and axe reports no serious or critical violations.
16. Security requirements verified: hidden data absent from ARIA, labels escaped, no HTML injection.

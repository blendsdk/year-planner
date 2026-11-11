# Accessibility and Keyboard Experience Implementation Plan

> **Feature**: WCAG 2.2 AA-targeted semantics, roving focus, announcements, contrast and automated evidence for the year planner
> **Status**: Execution Complete
> **Created**: 2026-11-11 10:57
> **Implements**: year-planner/RD-09
> **CodeOps Artifact Schema**: 1

## Overview

RD-09 closes the accessibility gap left by the visual and interaction milestones. The existing
component already exposes a labelled ARIA grid, roving date focus, keyboard selection, an inspector
and two polite live regions. It does not yet expose selected dates, item counts, selected state in
item names, a visible command status, a keyboard-reachable item list or a contrast-safe ribbon
label. A baseline axe scan on the demo found two serious rule families: `color-contrast` (130
nodes) and `label-content-name-mismatch` (73 nodes).

This plan adds the missing semantics and focus behaviour without replacing the DOM structure. It
keeps the HTML/CSS renderer, the existing inspector and the existing command pipeline. It adds no
dependency: `axe-core` is already a root devDependency, and the scans run through the existing
Playwright runner.

The plan also records the evidence boundary. Automated axe, keyboard and accessibility-tree checks
can run on this host. NVDA and VoiceOver cannot. No WCAG conformance statement will be published;
the manual audit protocol and the open evidence item are recorded instead.

## Minimum-Sufficient Baseline

**Original goal:** make the year planner operable and understandable with a keyboard and assistive
technology, with automated evidence for the RD-09 states.

**Smallest viable design:** extend the existing renderers, inspector and live regions with richer
names, `aria-selected`, roving tabindex for the remaining row controls, a labelled item list inside
the inspector, a visible status bar, and computed contrast-safe colours. Reuse `axe-core` and the
existing Playwright/Vitest stacks.

**Excluded machinery:** no new component library, accessibility framework, screen-reader driver,
test harness, state manager or public theme token.

**Approved complexity:** None.

## Document Index

| #   | Document                                                   | Description                                      |
| --- | ---------------------------------------------------------- | ------------------------------------------------ |
| AR  | [Ambiguity Register](00-ambiguity-register.md)             | Zero-Ambiguity Gate decisions (audit trail)      |
| 00  | [Index](00-index.md)                                       | This document — overview and navigation          |
| 01  | [Requirements](01-requirements.md)                         | RD-09 delta view and plan-local decisions        |
| 02  | [Current State](02-current-state.md)                       | Baseline code, gaps and axe evidence             |
| 03  | [Semantics and Names](03-01-semantics.md)                  | Roles, labels, selected state and hidden items   |
| 04  | [Focus and Keyboard](03-02-focus-keyboard.md)              | Roving tabindex, skip link, Home/End and fallback |
| 05  | [Announcements and Status](03-03-announcements-status.md)  | Live regions, visible status and outcome mapping |
| 06  | [Item List and Inspector](03-04-item-list-inspector.md)    | Item list, overflow, hidden filtering and return |
| 07  | [Visual Accessibility](03-05-visual-accessibility.md)      | Contrast, target size, non-colour cues and media |
| 08  | [Testing Strategy](07-testing-strategy.md)                 | ST-cases, axe matrix and verification            |
| 05  | [Review Findings](05-findings.md)                          | Independent review findings and closures         |
| 99  | [Execution Plan](99-execution-plan.md)                     | Phases, sessions and task checklist              |

## Quick Reference

### Keyboard contract

| Key | Action |
| --- | --- |
| `Tab` | Skip link → one date cell → one item proxy → one overflow button → inspector |
| Arrows | Move date focus by day or week; skip disabled dates |
| `Shift` + arrows | Extend the date selection from the anchor |
| `Home` / `End` | First / last enabled date in the focused month row |
| `Space` | Toggle the focused date or item |
| `Enter` | Inspect the focused date or item |
| `Escape` | Cancel a gesture, then clear selection; close overflow |
| `Delete` | Delete the focused item after host confirmation |
| `Ctrl`/`Cmd` + `A` | Select all effectively visible items |

### Key Decisions

| Decision | Outcome | AR |
| -------- | ------- | -- |
| Item list location | Inspector section with a skip link | AR-1 |
| Selected state | `aria-selected` on cells and explicit text in proxy names | AR-2 |
| Proxy names | Title, period, layer, pattern, status, selection, clipping | AR-3 |
| Target size | Default lane height 24 px; 24×24 handles and overflow button | AR-4 |
| Ribbon contrast | Computed `--yp-ribbon-text` from existing tokens | AR-5 |
| Command visibility | Full-width status bar plus inspector details | AR-7 |
| Live regions | Visible polite status; hidden assertive errors; hidden polite selection | AR-8 |
| Overflow tab order | One overflow button in the tab order, tied to the active row | AR-9 |
| Manual evidence | Orca smoke check where available; NVDA/VoiceOver protocol documented | AR-12 |
| Inspector focus | Keep focus on repeated action buttons; gestures restore the item | AR-17 |
| Nested names | Root region label, grid label with “grid” suffix | AR-18 |
| Lane-height test | RD-09 supersedes the old 18 px assertion | AR-19 |
| AC14 validation | axe `nested-interactive` plus a DOM scan; no HTML validator dependency | AR-20 |

## Specialist Agents

**None** — the capability-gap check found no gap a standing specialist would close.

_Detection evidence: the work is confined to `packages/react/src/render/`, `packages/react/src/interaction/`, `packages/react/src/styles.css`, React tests, Playwright tests and Storybook stories. Existing reviewers cover React, accessibility semantics and CSS contrast through the normal quality loop; no separate security, data, infrastructure or domain specialist is needed. `axe-core` is already installed at the repository root._

## Related Files

| File | Role |
| ---- | ---- |
| `packages/react/src/render/YearGrid.tsx` | Grid, header/footer rows, accessible name |
| `packages/react/src/render/MonthRow.tsx` | Row header, cell layer, item layer, overflow |
| `packages/react/src/render/CellLayer.tsx` | Date cells, labels, selected state |
| `packages/react/src/render/ItemLayer.tsx` | Item proxies, rich names, resize handles |
| `packages/react/src/render/ItemOverlay.tsx` | Grid-sibling overlay for proxies, previews and overflow |
| `packages/react/src/render/Inspector.tsx` | Inspector, item list, overflow, feedback |
| `packages/react/src/render/Overflow.tsx` | Overflow button, popover and focus |
| `packages/react/src/render/StatusBar.tsx` | Visible command status bar |
| `packages/react/src/render/ItemList.tsx` | Planner-owned visible item list |
| `packages/react/src/YearPlanner.tsx` | Root region, live regions, skip link |
| `packages/react/src/a11y.ts` | Label, selection and contrast helpers |
| `packages/react/src/announcements.ts` | Command status mapping |
| `packages/react/src/useAnnouncements.ts` | Pending/settlement/selection/visibility announcements |
| `packages/react/src/interaction/useInteraction.ts` | Keyboard model and Home/End |
| `packages/react/src/interaction/row.ts` | Month-row bounds |
| `packages/react/src/theme.ts` | Lane height, modern border, ribbon text computation |
| `packages/react/src/styles.css` | Focus, contrast, cues, forced colours, reduced motion |
| `tests/e2e/accessibility.spec.ts` | axe and keyboard browser evidence |
| `apps/storybook/stories/Accessibility.stories.tsx` | Accessibility states |
| `docs/accessibility.md` | Keyboard map, evidence status, manual audit protocol |

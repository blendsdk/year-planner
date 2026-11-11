# RD-09 Review Findings

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Review**: independent React/accessibility review of the uncommitted RD-09 diff
> **Verdict**: PASS after fixes — all critical and major findings closed

| ID | Severity | Finding | Status |
| -- | -------- | ------- | ------ |
| RV-001 | CRITICAL | Proxy focus ring clipped by `overflow: hidden` on the fragment | Fixed: `:focus-within` makes the fragment visible and raises its stacking order; E2E checks computed overflow, outline and halo |
| RV-002 | MAJOR | Roving proxy tab stop could land on a backdrop or overflow-lane item and disappear | Fixed: proxy fragments are filtered by channel, annotation visibility and visible lane; Ctrl+A and backdrop tests added |
| RV-003 | MAJOR | Focus lost silently when the active item left the rendered window | Fixed: active-item effect requires a rendered proxy; window-change test asserts fallback and announcement |
| RV-004 | MAJOR | 24 px resize handles consumed short item proxies | Fixed: handles render only for fragments at least 72 px wide; resize remains available in the inspector; one-day test added |
| RV-005 | MAJOR | Focused selected cell had the same indicator as an unfocused selected cell | Fixed: focus uses a 3 px dashed ring, selection keeps its solid inset ring; E2E checks computed style |
| RV-006 | MAJOR | Rejection could be announced twice by the hidden alert and inspector `role="status"` | Fixed: inspector feedback is a named region, not a live region; rejection test asserts one live element carries the message |
| RV-007 | MINOR | `aria-colcount=37` conflicted with the rowheader cell | Fixed: month bands are decorative `aria-hidden`; rows own 37 gridcells |
| RV-008 | MINOR | Dangling `aria-describedby` when the inspector was closed | Fixed: the feedback id is passed only while the inspector and feedback render |
| RV-009 | MINOR | Item list had no visual selected state | Fixed: selected entries get outline, weight, underline and fill |
| RV-010 | MINOR | Resize handles were dead buttons for AT | Fixed: handles are `aria-hidden` pointer affordances; keyboard resize stays in the inspector |
| RV-011 | MINOR | Print ribbon text ignored the readable-text fix | Fixed: print fragments compute readable text from their background; print test added |
| RV-012 | MINOR | Modern theme CSS drifted from `theme.ts` | Fixed: border sync and per-theme `--yp-ribbon-text` values |
| RV-013 | MINOR | Overlay was 1 px off the grid border | Fixed: overlay inset is 1 px |
| RV-014 | MINOR | Grid did not declare multi-selection | Fixed: `aria-multiselectable="true"` |
| RV-015 | OBSERVATION | Date-cell names repeated visible text | Fixed: the extra `visibleText` append was removed; referenced content still satisfies axe |
| RV-016 | OBSERVATION | Overflow dialog stayed open when focus left | Fixed: focusout closes it when focus moves outside |
| RV-017 | OBSERVATION | “Hidden” is used for overflow and visibility-hidden states | Accepted: existing terminology across the inspector and overflow; a future copy pass can rename it |
| RV-018 | OBSERVATION | `maxWorkers: 2` test config change is outside the feature | Accepted: the expanded suite starves short command deadlines on the 4-core reference host; two workers make the timing tests deterministic |
| RV-019 | OBSERVATION | Active date becoming disabled did not move DOM focus | Fixed: effect moves focus to the nearest enabled date and announces it; runtime-disabled test added |

## Verification after fixes

- React: 474 tests across 42 files.
- Accessibility Playwright: 16 tests, including eight axe states, focus ring, forced colours, keyboard, skip link, hidden item and nested-control scan.
- `pnpm verify:full`: green after the review fixes — 207 core, 474 React, 108 Playwright passed, 25 skipped, clean consumer PASS.
- Manual NVDA/VoiceOver evidence: still open (AR-12); no conformance claim.

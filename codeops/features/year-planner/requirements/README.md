# Year Planner for React — Requirements Documents

> **Project**: Year Planner for React — an open-source React annual planning component
> **Status**: Draft
> **Created**: 2026-11-10
> **Architecture**: React + strict TypeScript; core + React packages; Vite/Vitest/Storybook/Playwright
> **CodeOps Artifact Schema**: 1

---

## Overview

Year Planner for React is an MIT open-source component for long-range annual
planning. Its flagship view is a classic 14-month, Saturday-first, 37-slot year
grid derived from two photographed physical planners, extended with continuous
interval ribbons, overlapping layers, annotations, range painting, drag
selection, moves/resizes, theming and print.

The product is a library/SDK, not a vertical SaaS application. Host applications
own persistence, authorization, business rules, capacity and booking
correctness. The component is renderer-agnostic in its core and ships a React
adapter.

## Minimum-Sufficient Baseline

**Original goal:** a reusable, production-oriented annual planning component
that reconstructs the two source calendars and supports continuous overlapping
intervals, layers, interactions, theming and a controlled integration API.

**Smallest viable design:** two ESM packages (pure core + React view), a
classic 12–36 month grid, layers/visibility, continuous ribbons, selection/
paint/move/resize, local undo, keyboard access, theming, print, Storybook and
generated API docs.

**Excluded support machinery:** no backend, database, auth service, design
system, Redux, runtime CSS-in-JS, resource timeline, recurrence engine,
optimizer or commercial licensing infrastructure.

**Approved complexity:** user-mandated toolchain — Storybook, API Extractor/
TypeDoc, Playwright, Turbo, Changesets and npm provenance. No AI-proposed
complexity escalation remains open.

## Domain Lenses

| Lens | Selected | Evidence |
|---|---|---|
| Web application | Yes | Browser UI, pointer/keyboard, async validation, controlled state |
| Data and migration | Yes | Versioned public API, serialized visibility presets, package format |
| Distributed and concurrent | Yes, scoped | Async validation, stale responses, revisions, cancellation, rollback |
| Compiler and language | No | No parser/compiler/IR |
| Financial system | No | No money/ledger |

## Domain Glossary

| Term | Definition |
|---|---|
| Activity/item | One logical scheduled entity with stable identity |
| Period | Half-open `[start, endExclusive)` date-only or timed interval |
| Fragment | Projection of one item clipped to one month row |
| Layer group | Hierarchy controlling categorization and visibility |
| Layer | Visual/logical classification with a render channel |
| Render channel | background, highlight, ribbon, annotation or foreground |
| Effective visibility | Derived visibility after group/layer/item/filter precedence |
| Annotation | Date-bound label/decoration; host-supplied holidays use this |
| Marquee | Rectangular pointer selection; defaults to item intersection |
| Controlled mode | Host owns items/visibility/selection; component emits requests |
| Command | Typed proposal to create/update/move/resize/delete/paint/bulk |
| Diagnostic | Stable-coded error/warning/info with entity and interval context |

## Document Index

| # | Document | Description | Depends On |
|---|----------|-------------|------------|
| **AR** | [Ambiguity Register](00-ambiguity-register.md) | Zero-Ambiguity Gate decisions | — |
| **RD-01** | [Foundation, Packages and Toolchain](RD-01-foundation.md) | Repo, two packages, build/test/docs toolchain, governance | — |
| **RD-02** | [Temporal Core and Interval Algebra](RD-02-temporal-core.md) | Date-only/timed periods, ISO weeks, interval algebra | RD-01 |
| **RD-03** | [Classic Year Layout and Dynamic Months](RD-03-classic-year-layout.md) | 14×37 grid, 12–36 month windows, prefix widths | RD-01, RD-02 |
| **RD-04** | [Layers, Visibility, Annotations and Data Validation](RD-04-layers-visibility.md) | Entity model, visibility precedence, filters, holidays | RD-01, RD-02 |
| **RD-05** | [Continuous Ribbons, Lanes, Overflow and Print](RD-05-ribbons-lanes-print.md) | Fragments, lanes, overlaps, overflow, A3 print | RD-02, RD-03, RD-04 |
| **RD-06** | [React View, Theming and Style Integration](RD-06-react-view-theming.md) | Grid/view layers, CSS variables, slots, Fluent/MUI | RD-03, RD-04, RD-05 |
| **RD-07** | [Interaction Engine, Selection and Keyboard](RD-07-interaction-selection.md) | Modes, modifier matrix, marquee, keyboard, touch, undo | RD-03, RD-04, RD-05, RD-06 |
| **RD-08** | [Controlled Commands, Validation and Rollback](RD-08-controlled-commands.md) | Command pipeline, async host validation, rollback | RD-04, RD-05, RD-06, RD-07 |
| **RD-09** | [Accessibility and Keyboard Experience](RD-09-accessibility.md) | WCAG target, focus, ARIA, announcements, manual audit | RD-06, RD-07 |
| **RD-10** | [Quality Gates, Performance, Security and Browser Support](RD-10-quality-gates.md) | Test tiers, budgets, matrices, evidence | RD-01–RD-09 |
| **RD-11** | [Documentation, Storybook and API Reference](RD-11-documentation.md) | Storybook, TSDoc, API Extractor, TypeDoc, GH Pages | RD-01–RD-10 |
| **RD-12** | [Release, Versioning and Maintenance](RD-12-release-maintenance.md) | Lockstep, provenance, support, release gates | RD-01–RD-11 |

## Dependency Graph

```text
RD-01 Foundation
  ├── RD-02 Temporal core
  │     ├── RD-03 Layout
  │     │     └── RD-05 Ribbons/lanes/print
  │     │           └── RD-06 React/theming
  │     │                 ├── RD-07 Interaction
  │     │                 │     └── RD-08 Commands/rollback
  │     │                 └── RD-09 Accessibility
  │     └── RD-04 Layers/visibility
  └── RD-10 Quality gates
        └── RD-11 Docs/API
              └── RD-12 Release
```

## Suggested Implementation Order

| Phase | Documents | Description |
|---|---|---|
| **A: MVP** | RD-01 → RD-06 | Foundation, temporal core, layout, layers, ribbons, React view |
| **B: Interaction** | RD-07 → RD-08 | Selection/gestures, keyboard, commands, rollback |
| **C: Release quality** | RD-09 → RD-12 | Accessibility, quality evidence, docs, release |

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| License | MIT + DCO | Open-source decision; no commercial license |
| Package family | Core + React | Framework-neutral core; React adapter |
| Dates | Validated strings + integer math | No timezone drift; no date dependency |
| Intervals | Half-open | Adjacent intervals do not overlap |
| Layout | Pure data layout | Shared by HTML/SVG/print/hit-testing |
| Renderer | HTML hypothesis; SVG evidence-based | Avoid irreversible coupling |
| Visibility | Presentation only | Hidden data may still affect host validation |
| State | Controlled-first | Host authority; no phantom success |
| Theming | CSS variables + layers + slots | Host design-system compatibility |
| Release | Lockstep + provenance | Two tightly coupled packages |

## Traceability

| Source | Covered by |
|---|---|
| Handoff CAL-01–05 | RD-02, RD-03 |
| Handoff RIB-01–04 | RD-05 |
| Handoff LAY-01–03 | RD-04 |
| Handoff INT-01–05, ACC-01 | RD-07, RD-09 |
| Handoff SCH-01–03 | RD-08 (mock host) |
| Handoff PRT-01 | RD-05, RD-10 |
| Dynamic months (new) | RD-03, RD-05, RD-06 |
| Theming/Fluent/MUI (new) | RD-06 |
| Storybook/API docs (new) | RD-11 |
| Open-source governance (new) | RD-01, RD-12 |

## Commonly Forgotten Requirements — Final Check

| # | Concern | Addressed? | Owner |
|---|---------|------------|-------|
| 1 | Audit logging | N/A — host-owned | — |
| 2 | Data export | N/A — R1 print only | — |
| 3 | API versioning | Yes | RD-12 |
| 4 | Rate limiting | N/A — no endpoints | — |
| 5 | Error messages | Yes | RD-08 |
| 6 | Empty states | Yes | RD-11 |
| 7 | Loading/optimistic UI | Commands yes; provider deferred | RD-08 |
| 8 | Accessibility | Yes | RD-09 |
| 9 | Mobile responsiveness | Basic support matrix | RD-10 |
| 10 | Backup/DR | N/A — no data store | — |
| 11 | Monitoring | N/A — no service | — |
| 12 | Email | N/A | — |
| 13 | Search/filter | Yes | RD-04 |
| 14 | Pagination | N/A — calendar rows; print pagination yes | RD-05 |
| 15 | File upload | N/A | — |
| 16 | Soft delete | N/A — host-owned | — |
| 17 | Timezones | Yes | RD-02 |
| 18 | Localization | Labels via Intl; RTL deferred | RD-06 |
| 19 | ToS/privacy | N/A — library | — |
| 20 | GDPR/retention | N/A — no data store | — |
| 21 | Session management | N/A | — |
| 22 | Graceful degradation | SSR/print/no-JS structural | RD-06, RD-10 |
| 23 | Admin | N/A | — |
| 24 | Onboarding | Yes — quickstart/Storybook | RD-11 |
| 25 | Configuration | Yes — display/interaction/theme props | RD-06 |
| 26 | Input validation | Yes | RD-02, RD-04 |
| 27 | Injection prevention | Yes | RD-04, RD-06, RD-10 |
| 28 | Auth model | Host-owned; documented | RD-04, RD-08 |
| 29 | Rate limiting | N/A | — |
| 30 | Secrets management | Yes — OIDC | RD-01, RD-12 |
| 31 | Encryption | N/A — no transport/storage | — |
| 32 | Infrastructure hardening | CI least privilege | RD-10, RD-12 |
| 33 | Security testing | Yes | RD-10 |

## How to Use These Documents

1. Review the Ambiguity Register and the RDs.
2. Run `preflight` on this requirements set.
3. Pick the first RD and run `make-plan`.
4. Run `exec-plan` for the plan.
5. Update the feature roadmap and evidence as each RD is delivered.

> **Gate status:** the ambiguity register is marked passed under the user's
> 2026-11-10 “proceed” directive. Any later change to a resolved row requires a
> new register entry and an RD amendment.

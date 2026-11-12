# Traceability Matrix — Year Planner for React

> **CodeOps Artifact Schema**: 1
> **Status**: Draft
> **Created**: 2026-11-10

## Convention

- Every RD acceptance criterion `N` in `RD-XX` has a specification test ID
  **`RD-XX-AC-NN`**.
- Handoff acceptance cases keep their IDs (`CAL-01`, `RIB-01`, etc.) and map to
  one or more RD test IDs.
- The test file name contains the ID; the test title repeats it, for example
  `test('RD-05-AC-01: cross-month fragments share identity', ...)`.
- `make-plan` must create at least one spec test per ID before implementation.

## Handoff acceptance cases

| Handoff case | RD acceptance | Test ID(s) |
|---|---|---|
| CAL-01 | RD-03 AC1–2 | RD-03-AC-01, RD-03-AC-02 |
| CAL-02 | RD-03 AC3; RD-02 AC1 | RD-03-AC-03, RD-02-AC-01 |
| CAL-03 | RD-03 AC5; RD-02 AC3 | RD-03-AC-05, RD-02-AC-03 |
| CAL-04 | RD-03 AC6; RD-02 AC4 | RD-03-AC-06, RD-02-AC-04 |
| CAL-05 | RD-03 AC12 | RD-03-AC-12 |
| RIB-01 | RD-05 AC1 | RD-05-AC-01 |
| RIB-02 | RD-05 AC3 | RD-05-AC-03 |
| RIB-03 | RD-05 AC2 | RD-05-AC-02 |
| RIB-04 | RD-05 AC4 | RD-05-AC-04 |
| LAY-01 | RD-04 AC1 | RD-04-AC-01 |
| LAY-02 | RD-04 AC2 | RD-04-AC-02 |
| LAY-03 | RD-04 AC9 | RD-04-AC-09 |
| INT-01 | RD-07 AC1 | RD-07-AC-01 |
| INT-02 | RD-07 AC5 | RD-07-AC-05 |
| INT-03 | RD-07 AC9 | RD-07-AC-09 |
| INT-04 | RD-07 AC11; RD-09 AC1 | RD-07-AC-11, RD-09-AC-01 |
| INT-05 | RD-07 AC8 | RD-07-AC-08 |
| SCH-01 | RD-08 AC6 | RD-08-AC-06 |
| SCH-02 | RD-08 AC2, AC5 | RD-08-AC-02, RD-08-AC-05 |
| SCH-03 | RD-08 AC1 | RD-08-AC-01 |
| ACC-01 | RD-09 AC1; RD-07 AC11 | RD-09-AC-01, RD-07-AC-11 |
| PRT-01 | RD-05 AC11; RD-10 AC6; RD-11 AC11 | RD-05-AC-11, RD-10-AC-06, RD-11-AC-11 |

## New R1 cases

| Case | RD acceptance | Test ID(s) |
|---|---|---|
| Dynamic 12 months | RD-03 AC7 | RD-03-AC-07 |
| Dynamic 18 months | RD-03 AC8 | RD-03-AC-08 |
| Dynamic 24/36 months | RD-03 AC10; RD-05 AC13 | RD-03-AC-10, RD-05-AC-13 |
| Paint union | RD-07 AC6; RD-04 AC12 | RD-07-AC-06, RD-04-AC-12 |
| Erase split | RD-07 AC5; RD-04 AC11 | RD-07-AC-05, RD-04-AC-11 |
| Create/delete | RD-07 AC13; RD-08 AC10 | RD-07-AC-13, RD-08-AC-10 |
| Read-only/locked | RD-04 AC14; RD-07 AC10 | RD-04-AC-14, RD-07-AC-10 |
| Update patch | RD-08 AC15 | RD-08-AC-15 |
| Redo | RD-07 AC16 | RD-07-AC-16 |
| Inspector | RD-09 AC11 | RD-09-AC-11 |
| Hidden counts | RD-04 AC4; RD-09 AC12 | RD-04-AC-04, RD-09-AC-12 |
| 36-month a11y | RD-09 AC15 | RD-09-AC-15 |
| CSP/style | RD-06 AC11; RD-10 AC13 | RD-06-AC-11, RD-10-AC-13 |
| SSR locale | RD-06 AC10; RD-10 AC15 | RD-06-AC-10, RD-10-AC-15 |
| Size budget | RD-10 AC12 | RD-10-AC-12 |
| M0 renderer gate | RD-05 AC14 | RD-05-AC-14 |

## Acceptance criteria

| Test ID | RD | AC | Status | Proving test file | Proving title | Evidence / deviation |
|---|---|---|---|---|---|---|
| RD-01-AC-01 | RD-01 | 1 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-01: reproducible install` | Repository contract assertion |
| RD-01-AC-02 | RD-01 | 2 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-02: strict typecheck` | Repository contract assertion |
| RD-01-AC-03 | RD-01 | 3 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-03: ESM build artifacts` | Repository contract assertion |
| RD-01-AC-04 | RD-01 | 4 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-04: package publication checks` | Repository contract assertion |
| RD-01-AC-05 | RD-01 | 5 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-05: clean consumer` | Repository contract assertion |
| RD-01-AC-06 | RD-01 | 6 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-06: React 19 CI` | Repository contract assertion |
| RD-01-AC-07 | RD-01 | 7 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-07: DCO gate` | Repository contract assertion |
| RD-01-AC-08 | RD-01 | 8 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-08: MIT package contracts` | Repository contract assertion |
| RD-01-AC-09 | RD-01 | 9 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-09: documented release gate` | Repository contract assertion |
| RD-01-AC-10 | RD-01 | 10 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-10: no committed secrets` | Repository contract assertion |
| RD-01-AC-11 | RD-01 | 11 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-01-AC-11: production security surface` | Repository contract assertion |
| RD-02-AC-01 | RD-02 | 1 | proven | `packages/core/src/date.spec.test.ts` | `RD-02-AC-01/02: Gregorian date keys and Saturday-first weekday` | Core date test |
| RD-02-AC-02 | RD-02 | 2 | proven | `packages/core/src/date.spec.test.ts` | `RD-02-AC-01/02: Gregorian date keys and Saturday-first weekday` | Core date test |
| RD-02-AC-03 | RD-02 | 3 | proven | `packages/core/src/date.spec.test.ts` | `RD-02-AC-03: month lengths` | Core date test |
| RD-02-AC-04 | RD-02 | 4 | proven | `packages/core/src/date.spec.test.ts` | `RD-02-AC-04: ISO week-year` | Core date test |
| RD-02-AC-05 | RD-02 | 5 | proven | `packages/core/src/interval.spec.test.ts` | `RD-02-AC-05/06: period intersections across boundaries` | Core interval test |
| RD-02-AC-06 | RD-02 | 6 | proven | `packages/core/src/interval.spec.test.ts` | `RD-02-AC-05/06: period intersections across boundaries` | Core interval test |
| RD-02-AC-11 | RD-02 | 11 | proven | `packages/core/src/period.spec.test.ts` | `RD-02-AC-05/06/11: period validation and timed projection` | Core period test |
| RD-02-AC-07 | RD-02 | 7 | proven | `packages/core/src/interval.spec.test.ts` | `RD-02-AC-07/08: half-open interval algebra` | Core interval test |
| RD-02-AC-08 | RD-02 | 8 | proven | `packages/core/src/interval.spec.test.ts` | `RD-02-AC-07/08: half-open interval algebra` | Core interval test |
| RD-02-AC-09 | RD-02 | 9 | proven | `packages/core/src/period.spec.test.ts` | `RD-02-AC-09: invalid input codes` | Core period test |
| RD-02-AC-10 | RD-02 | 10 | proven | `tests/quality/ci-contract.spec.test.ts` | `RD-02-AC-10 / RD-10-AC-05: timezone evidence` | Three-timezone script and CI step |
| RD-02-AC-12 | RD-02 | 12 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-02-AC-12: temporal input safety` | Source scan |
| RD-03-AC-01 | RD-03 | 1 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-01/02: classic 14-month layout` | Core layout test |
| RD-03-AC-02 | RD-03 | 2 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-01/02: classic 14-month layout` | Core layout test |
| RD-03-AC-03 | RD-03 | 3 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-03/04/05: date-to-column mapping` | Core layout test |
| RD-03-AC-04 | RD-03 | 4 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-03/04/05: date-to-column mapping` | Core layout test |
| RD-03-AC-05 | RD-03 | 5 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-03/04/05: date-to-column mapping` | Core layout test |
| RD-03-AC-06 | RD-03 | 6 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-03-AC-06 / RD-06-AC-07: isolates two instances and renders ISO weeks with dir=ltr` | React render test |
| RD-03-AC-07 | RD-03 | 7 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08: exact dynamic windows` | Core layout test |
| RD-03-AC-08 | RD-03 | 8 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08: exact dynamic windows` | Core layout test |
| RD-03-AC-09 | RD-03 | 9 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08/09/10/14/15: dynamic windows and input safety` | Core layout test |
| RD-03-AC-10 | RD-03 | 10 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08/09/10/14/15: dynamic windows and input safety` | Core layout test |
| RD-03-AC-14 | RD-03 | 14 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08/09/10/14/15: dynamic windows and input safety` | Core layout test |
| RD-03-AC-11 | RD-03 | 11 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-11/15: blank slots and input safety` | Core layout test |
| RD-03-AC-12 | RD-03 | 12 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-12: weekend geometry` | Core layout test |
| RD-03-AC-13 | RD-03 | 13 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-13: deterministic layout` | Core layout test |
| RD-03-AC-15 | RD-03 | 15 | proven | `packages/core/src/layout/classic-year.spec.test.ts` | `RD-03-AC-07/08/09/10/14/15: dynamic windows and input safety` | Core input-rejection test; source scan adds no-HTML evidence |
| RD-04-AC-01 | RD-04 | 1 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-01/02/03: visibility precedence` | Core visibility test |
| RD-04-AC-02 | RD-04 | 2 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-01/02/03: visibility precedence` | Core visibility test |
| RD-04-AC-03 | RD-04 | 3 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-01/02/03: visibility precedence` | Core visibility test |
| RD-04-AC-04 | RD-04 | 4 | proven | `packages/react/src/items.spec.test.tsx` | `RD-04-AC-04: omits hidden items from fragments and proxies` | React render test |
| RD-04-AC-05 | RD-04 | 5 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-05: tri-state and reducer matrix` | Core visibility test |
| RD-04-AC-06 | RD-04 | 6 | proven | `packages/core/src/model/validation.spec.test.ts` | `RD-04-AC-06: validation of groups and cycles` | Core validation test |
| RD-04-AC-07 | RD-04 | 7 | proven | `packages/core/src/model/validation.spec.test.ts` | `RD-04-AC-07: validation of item references` | Core validation test |
| RD-04-AC-08 | RD-04 | 8 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-08: filters by status, layer, resource and trimmed search without mutating input` | Core visibility test |
| RD-04-AC-09 | RD-04 | 9 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-04-AC-09: emits onVisibilityChange for controlled and imperative changes` | React component test |
| RD-04-AC-10 | RD-04 | 10 | proven | `packages/core/src/model/validation.spec.test.ts` | `RD-04-AC-10: preserves custom annotation styling and invents no holiday data` | Core validation test |
| RD-04-AC-11 | RD-04 | 11 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-11: erases the middle into two new residual items` | Core paint test |
| RD-04-AC-12 | RD-04 | 12 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-12: paints a merged interval over a matching highlight` | Core paint test |
| RD-04-AC-13 | RD-04 | 13 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-13: does not merge differing metadata or color and keeps originals` | Core paint test |
| RD-04-AC-15 | RD-04 | 15 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-15: skips a hidden highlight and leaves it unchanged` | Core paint test |
| RD-04-AC-16 | RD-04 | 16 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-16: merges only when the title matches` | Core paint test |
| RD-04-AC-17 | RD-04 | 17 | proven | `packages/core/src/model/paint.spec.test.ts` | `RD-04-AC-17: rejects a layer that is not the active paint target` | Core paint test |
| RD-04-AC-14 | RD-04 | 14 | proven | `packages/core/src/model/visibility.spec.test.ts` | `RD-04-AC-14: editability precedence` | Core visibility test |
| RD-04-AC-18 | RD-04 | 18 | proven | `packages/react/src/security.spec.test.tsx` | `RD-04-AC-18 / RD-05-AC-15 / RD-09-AC-16 / RD-10-AC-08: hidden data never renders` | Hidden-data, XSS and network suite |
| RD-05-AC-01 | RD-05 | 1 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-01: splits a cross-month item into clipped row fragments with one identity` | Core ribbon test |
| RD-05-AC-02 | RD-05 | 2 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-02: measures one-day and eight-day widths from the actual slots` | Core ribbon test |
| RD-05-AC-03 | RD-05 | 3 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-03: places three overlapping items in three lanes` | Core ribbon test |
| RD-05-AC-04 | RD-05 | 4 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-04: splits a cross-year item across December and January` | Core ribbon test |
| RD-05-AC-05 | RD-05 | 5 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-05: repacks lanes after hiding one of three layers` | Core ribbon test |
| RD-05-AC-06 | RD-05 | 6 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-06: shows three lanes and seventeen overflow items in compact mode` | Core ribbon test |
| RD-05-AC-07 | RD-05 | 7 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-07: renders every lane and grows the row in expanded mode` | Core ribbon test |
| RD-05-AC-08 | RD-05 | 8 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-08: never lists a hidden item in overflow` | Core ribbon test |
| RD-05-AC-10 | RD-05 | 10 | proven | `packages/core/src/ribbon/fragments.spec.test.ts` | `RD-05-AC-10: is stable for identical inputs and changes with version, visibility and window` | Core ribbon test |
| RD-05-AC-09 | RD-05 | 9 | proven | `packages/core/src/ribbon/print.spec.test.ts` | `RD-05-AC-09/13: print pagination` | Core print pagination test |
| RD-05-AC-11 | RD-05 | 11 | proven | `tests/e2e/print-matrix.spec.ts` | `RD-05-AC-11 / RD-10-AC-06: PRT-01 keeps the 2017 yellow fixture on one A3 page` | PRT-01 E2E print test |
| RD-05-AC-12 | RD-05 | 12 | proven | `packages/core/src/ribbon/print.spec.test.ts` | `RD-05-AC-12: print fit` | Core print fit test |
| RD-05-AC-13 | RD-05 | 13 | partial | `packages/core/src/ribbon/print.spec.test.ts` | `RD-05-AC-09/13: print pagination` | 36-month 14/14/8 pages covered; 15/28/29 boundary windows land with the print matrix |
| RD-05-AC-14 | RD-05 | 14 | proven | `tests/quality/repo-contract.spec.test.ts` | `RD-05-AC-14: renderer decision record` | Documentation and public-surface check |
| RD-05-AC-15 | RD-05 | 15 | proven | `packages/react/src/security.spec.test.tsx` | `RD-04-AC-18 / RD-05-AC-15 / RD-09-AC-16 / RD-10-AC-08: hidden data never renders` | Hidden and escaped output suite |
| RD-06-AC-01 | RD-06 | 1 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-06-AC-01: applies theme classes without changing geometry` | React component test |
| RD-06-AC-02 | RD-06 | 2 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-06-AC-02: lets an explicit preset win over the provider and cssVars win over both` | React component test |
| RD-06-AC-03 | RD-06 | 3 | proven | `packages/react/src/adapters.spec.test.tsx` | `RD-06-AC-03: renders host buttons in cells and the inspector without nesting in a proxy` | Adapter test |
| RD-06-AC-04 | RD-06 | 4 | proven | `packages/react/src/items.spec.test.tsx` | `RD-06-AC-04: applies getDateMeta background, text, label, aria and disabled state` | React item test |
| RD-06-AC-05 | RD-06 | 5 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-06-AC-05: keeps structure and focus in unstyled mode` | React component test |
| RD-06-AC-06 | RD-06 | 6 | proven | `packages/react/src/styles.spec.test.tsx` | `RD-06-AC-06: scopes selectors and avoids !important` | CSS contract test |
| RD-06-AC-07 | RD-06 | 7 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-03-AC-06 / RD-06-AC-07: isolates two instances and renders ISO weeks with dir=ltr` | React component test |
| RD-06-AC-08 | RD-06 | 8 | proven | `packages/react/src/items.spec.test.tsx` | `RD-06-AC-08/09: keeps cell and proxy surfaces when render slots add content` | React item test |
| RD-06-AC-09 | RD-06 | 9 | proven | `packages/react/src/items.spec.test.tsx` | `RD-06-AC-08/09: keeps cell and proxy surfaces when render slots add content` | React item test |
| RD-06-AC-10 | RD-06 | 10 | proven | `packages/react/src/YearPlanner.hydration.spec.test.tsx` | `RD-06-AC-10 / RD-10-AC-15: hydration` | Hydration test; node-environment SSR is also proven in packages/react/src/YearPlanner.ssr.spec.test.tsx |
| RD-06-AC-11 | RD-06 | 11 | proven | `tests/e2e/classic-year.spec.ts` | `RD-06-AC-11: renders under the documented CSP attribute allowance` | Playwright CSP test |
| RD-06-AC-12 | RD-06 | 12 | proven | `packages/react/src/print.spec.test.tsx` | `RD-06-AC-12: renders labels, weekends, ISO weeks and fragments in print` | Print test |
| RD-06-AC-13 | RD-06 | 13 | proven | `packages/react/src/YearPlanner.spec.test.tsx` | `RD-06-AC-13: maps pointer coordinates to dates and fragments at every zoom` | React component test |
| RD-06-AC-14 | RD-06 | 14 | proven | `packages/react/src/commands.spec.test.tsx` | `RD-06-AC-14: deletes an uncontrolled item and emits the next array` | Command test |
| RD-06-AC-15 | RD-06 | 15 | proven | `packages/react/src/inspector.spec.test.tsx` | `RD-06-AC-15: renders the aside, close button and empty hint` | Inspector test |
| RD-06-AC-16 | RD-06 | 16 | proven | `packages/react/src/inspector.spec.test.tsx` | `RD-06-AC-16: shows retry/dismiss for a timed-out command` | Inspector test |
| RD-06-AC-17 | RD-06 | 17 | proven | `packages/react/src/inspector.spec.test.tsx` | `RD-06-AC-17: emits move, resize, delete and paint commands` | Inspector test |
| RD-06-AC-18 | RD-06 | 18 | proven | `packages/react/src/items.spec.test.tsx` | `RD-06-AC-18: never renders metadata as HTML and filters unsafe item styles` | React item test plus source scan |
| RD-07-AC-01 | RD-07 | 1 | proven | `packages/react/src/interaction/pointer.spec.test.tsx` | `RD-07-AC-01: selects a cross-month date range with two preview fragments` | Pointer test |
| RD-07-AC-02 | RD-07 | 2 | proven | `packages/react/src/interaction/selection.spec.test.tsx` | `RD-07-AC-02/03/04/17: selection policy` | Selection policy test |
| RD-07-AC-03 | RD-07 | 3 | proven | `packages/react/src/interaction/selection.spec.test.tsx` | `RD-07-AC-02/03/04/17: selection policy` | Selection policy test |
| RD-07-AC-04 | RD-07 | 4 | proven | `packages/react/src/interaction/selection.spec.test.tsx` | `RD-07-AC-02/03/04/17: selection policy` | Selection policy test |
| RD-07-AC-17 | RD-07 | 17 | proven | `packages/react/src/interaction/selection.spec.test.tsx` | `RD-07-AC-02/03/04/17: selection policy` | Selection policy test |
| RD-07-AC-05 | RD-07 | 5 | proven | `tests/e2e/interaction.spec.ts` | `RD-07-AC-01/05/06/07/08/11: interaction demo` | Playwright interaction test |
| RD-07-AC-06 | RD-07 | 6 | proven | `tests/e2e/interaction.spec.ts` | `RD-07-AC-01/05/06/07/08/11: interaction demo` | Playwright interaction test |
| RD-07-AC-07 | RD-07 | 7 | proven | `packages/react/src/interaction/gesture.spec.test.tsx` | `RD-07-AC-07: moves a 10-day item and preserves its duration` | Gesture test |
| RD-07-AC-08 | RD-07 | 8 | proven | `packages/react/src/interaction/gesture.spec.test.tsx` | `RD-07-AC-08: rejects a resize whose end is before its start` | Gesture test |
| RD-07-AC-09 | RD-07 | 9 | proven | `packages/react/src/interaction/pointer.spec.test.tsx` | `RD-07-AC-09: cancels an active move on Escape without a command` | Pointer test |
| RD-07-AC-10 | RD-07 | 10 | proven | `packages/react/src/commands.spec.test.tsx` | `RD-07-AC-10: rejects read-only, stale and invalid commands with typed codes` | Command test |
| RD-07-AC-11 | RD-07 | 11 | proven | `packages/react/src/interaction/keyboard.spec.test.tsx` | `RD-07-AC-11/13/15/18: keyboard, focus and touch` | Keyboard test |
| RD-07-AC-15 | RD-07 | 15 | proven | `packages/react/src/interaction/keyboard.spec.test.tsx` | `RD-07-AC-11/13/15/18: keyboard, focus and touch` | Keyboard test |
| RD-07-AC-18 | RD-07 | 18 | proven | `packages/react/src/interaction/keyboard.spec.test.tsx` | `RD-07-AC-11/13/15/18: keyboard, focus and touch` | Keyboard test |
| RD-07-AC-12 | RD-07 | 12 | proven | `tests/e2e/interaction-touch.spec.ts` | `RD-07-AC-12: touch interaction` | Playwright touch test |
| RD-07-AC-13 | RD-07 | 13 | proven | `packages/react/src/interaction/pointer.spec.test.tsx` | `RD-07-AC-13: creates an item with create defaults` | Pointer test |
| RD-07-AC-14 | RD-07 | 14 | proven | `packages/react/src/interaction/gesture.spec.test.tsx` | `RD-07-AC-14: cancels on a real context change but not an equal-content rerender` | Gesture test |
| RD-07-AC-16 | RD-07 | 16 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-07-AC-16 / RD-08-AC-16: undoes and redoes uncontrolled versions and rejects a stale second update` | Command test |
| RD-07-AC-19 | RD-07 | 19 | proven | `packages/react/src/interaction/gesture.spec.test.tsx` | `RD-07-AC-19: does not start a gesture on a blank target` | Gesture test |
| RD-08-AC-01 | RD-08 | 1 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-01/07/15/16: versions and local history` | Command outcome test |
| RD-08-AC-07 | RD-08 | 7 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-01/07/15/16: versions and local history` | Command outcome test |
| RD-08-AC-15 | RD-08 | 15 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-01/07/15/16: versions and local history` | Command outcome test |
| RD-08-AC-02 | RD-08 | 2 | proven | `packages/react/src/interaction.commands.spec.test.tsx` | `RD-08-AC-02/03/04/05/13/14: pending previews` | Interaction command test |
| RD-08-AC-03 | RD-08 | 3 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-03/04/11/12/13: request context and validation` | Command lifecycle test |
| RD-08-AC-04 | RD-08 | 4 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-03/04/11/12/13: request context and validation` | Command lifecycle test |
| RD-08-AC-11 | RD-08 | 11 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-03/04/11/12/13: request context and validation` | Command lifecycle test |
| RD-08-AC-13 | RD-08 | 13 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-03/04/11/12/13: request context and validation` | Command lifecycle test |
| RD-08-AC-05 | RD-08 | 5 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-05/08: controlled acceptance` | Command outcome test |
| RD-08-AC-08 | RD-08 | 8 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-05/08: controlled acceptance` | Command outcome test |
| RD-08-AC-06 | RD-08 | 6 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-06/09/11: paint and retry` | Command outcome test |
| RD-08-AC-09 | RD-08 | 9 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-08-AC-06/09/11: paint and retry` | Command outcome test |
| RD-08-AC-10 | RD-08 | 10 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-10: delete confirmation` | Command lifecycle test |
| RD-08-AC-12 | RD-08 | 12 | proven | `packages/react/src/commands.lifecycle.spec.test.tsx` | `RD-08-AC-12: malformed outcomes and concurrency` | Command lifecycle test |
| RD-08-AC-14 | RD-08 | 14 | proven | `packages/react/src/interaction.commands.spec.test.tsx` | `RD-08-AC-02/03/04/05/13/14: pending previews` | Interaction command test |
| RD-08-AC-16 | RD-08 | 16 | proven | `packages/react/src/commands.outcomes.spec.test.tsx` | `RD-07-AC-16 / RD-08-AC-16: undoes and redoes uncontrolled versions and rejects a stale second update` | Command outcome test |
| RD-08-AC-17 | RD-08 | 17 | proven | `packages/react/src/commands.spec.test.tsx` | `RD-08-AC-17: redacts hidden item details in command diagnostics` | Command test |
| RD-09-AC-01 | RD-09 | 1 | proven | `tests/e2e/accessibility.spec.ts` | `RD-09-AC-01/02/05/11/14: keyboard evidence` | Playwright keyboard evidence |
| RD-09-AC-02 | RD-09 | 2 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-02/05: focus model` | Accessibility test |
| RD-09-AC-03 | RD-09 | 3 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-01/02/03: semantics` | Accessibility test |
| RD-09-AC-04 | RD-09 | 4 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-04/11/12: item list` | Accessibility item-list test |
| RD-09-AC-05 | RD-09 | 5 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-02/05: focus model` | Accessibility focus test |
| RD-09-AC-06 | RD-09 | 6 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-05/06: announcements` | Accessibility announcement test |
| RD-09-AC-07 | RD-09 | 7 | proven | `tests/e2e/accessibility.spec.ts` | `RD-09-AC-07/15: axe matrix` | Playwright axe matrix |
| RD-09-AC-08 | RD-09 | 8 | proven | `packages/react/src/a11y.spec.test.tsx` | `RD-09-AC-08: contrast helpers` | Contrast helper test |
| RD-09-AC-09 | RD-09 | 9 | proven | `packages/react/src/styles.spec.test.tsx` | `RD-09-AC-09: declares non-colour cues` | CSS contract test |
| RD-09-AC-10 | RD-09 | 10 | partial |  |  | Manual NVDA/VoiceOver evidence is parked by user decision; no WCAG conformance claim |
| RD-09-AC-11 | RD-09 | 11 | proven | `packages/react/src/accessibility.spec.test.tsx` | `RD-09-AC-04/11/12: item list` | Accessibility item-list test |
| RD-09-AC-12 | RD-09 | 12 | proven | `packages/react/src/inspector.spec.test.tsx` | `RD-09-AC-12: omits hidden selected items from the inspector context` | Inspector test |
| RD-09-AC-13 | RD-09 | 13 | proven | `packages/react/src/items.spec.test.tsx` | `RD-09-AC-13: renders backdrop opacity, patterns and layer labels` | React item test |
| RD-09-AC-14 | RD-09 | 14 | proven | `tests/e2e/accessibility.spec.ts` | `RD-09-AC-01/02/05/11/14: keyboard evidence` | Playwright keyboard evidence |
| RD-09-AC-15 | RD-09 | 15 | proven | `tests/e2e/accessibility.spec.ts` | `RD-09-AC-07/15: axe matrix` | Playwright axe matrix |
| RD-09-AC-16 | RD-09 | 16 | proven | `packages/react/src/security.spec.test.tsx` | `RD-04-AC-18 / RD-05-AC-15 / RD-09-AC-16 / RD-10-AC-08: hidden data never renders` | ARIA hidden-data and escaped output |
| RD-10-AC-01 | RD-10 | 1 | proven | `tests/quality/ci-contract.spec.test.ts` | `RD-10-AC-01: release gate evidence` | CI contract |
| RD-10-AC-02 | RD-10 | 2 | proven | `tests/quality/traceability.spec.test.ts` | `RD-10-AC-02: repository traceability` | Traceability checker |
| RD-10-AC-03 | RD-10 | 3 | proven | `tests/quality/coverage-contract.spec.test.ts` | `RD-10-AC-03: coverage floor` | Coverage contract |
| RD-10-AC-04 | RD-10 | 4 | proven | `tests/e2e/quality-visual.spec.ts` | `RD-10-AC-04: quality visual matrix` | Visual matrix |
| RD-10-AC-05 | RD-10 | 5 | proven | `tests/quality/ci-contract.spec.test.ts` | `RD-02-AC-10 / RD-10-AC-05: timezone evidence` | Timezone evidence |
| RD-10-AC-06 | RD-10 | 6 | proven | `tests/e2e/print-matrix.spec.ts` | `RD-10-AC-06: A3 print matrix @print` | Print matrix |
| RD-10-AC-07 | RD-10 | 7 | partial | `tests/e2e/accessibility.spec.ts` | `RD-09-AC-07/15 / RD-10-AC-07: axe matrix` | Automated axe complete; manual NVDA/VoiceOver parked; no conformance claim |
| RD-10-AC-08 | RD-10 | 8 | proven | `packages/react/src/security.spec.test.tsx` | `RD-04-AC-18 / RD-05-AC-15 / RD-09-AC-16 / RD-10-AC-08: hidden data never renders` | Hidden-data suite |
| RD-10-AC-09 | RD-10 | 9 | proven | `packages/react/src/security.spec.test.tsx` | `RD-10-AC-09: injection payloads stay inert` | XSS and fuzz suite |
| RD-10-AC-10 | RD-10 | 10 | proven | `packages/react/src/security.spec.test.tsx` | `RD-10-AC-10: no network or telemetry` | Network spies and request log |
| RD-10-AC-11 | RD-10 | 11 | proven | `tests/perf/bench.spec.ts` | `RD-10-AC-11: production budgets` | Benchmark harness |
| RD-10-AC-12 | RD-10 | 12 | proven | `tests/quality/coverage-contract.spec.test.ts` | `RD-10-AC-12: bundle measurement contract` | Both size measurements |
| RD-10-AC-13 | RD-10 | 13 | proven | `tests/e2e/security.spec.ts` | `RD-10-AC-08/10/13: security and privacy` | CSP and request log |
| RD-10-AC-14 | RD-10 | 14 | proven | `tests/quality/package-scripts.spec.test.ts` | `RD-10-AC-12 / RD-10-AC-14: command and consumer contract` | Clean consumer |
| RD-10-AC-15 | RD-10 | 15 | proven | `packages/react/src/YearPlanner.hydration.spec.test.tsx` | `RD-06-AC-10 / RD-10-AC-15: hydration` | SSR and locale hydration |
| RD-10-AC-16 | RD-10 | 16 | proven | `tests/quality/audit-contract.spec.test.ts` | `RD-10-AC-16: dependency and license gates` | Audit and least privilege |

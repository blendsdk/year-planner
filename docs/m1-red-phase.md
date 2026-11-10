# Red-Phase Evidence — M1

> **Date**: 2026-11-10
> **Purpose**: Record the failing state that the M1 specification tests were
> written against. The implementation is green now; these failures were
> reproduced by temporarily removing the implementation or the build artifact,
> then restoring it. Nothing was permanently deleted.

The red state is intentionally reproducible. Restore the removed code or build
output and re-run the same command to return to green.

## 1. Core specification tests before implementation

Command:

```bash
cd packages/core
pnpm test
```

State: `date.ts`, `period.ts`, `interval.ts` and `layout/classic-year.ts` were
temporarily moved out of `src/`.

```text
FAIL  src/date.impl.test.ts [ src/date.impl.test.ts ]
Error: Cannot find module './date' imported from '.../packages/core/src/date.impl.test.ts'
FAIL  src/date.spec.test.ts [ src/date.spec.test.ts ]
Error: Cannot find module './date' imported from '.../packages/core/src/date.spec.test.ts'
FAIL  src/interval.spec.test.ts [ src/interval.spec.test.ts ]
Error: Cannot find module './interval' imported from '.../packages/core/src/interval.spec.test.ts'
FAIL  src/layout/classic-year.impl.test.ts [ src/layout/classic-year.impl.test.ts ]
Error: Cannot find module './classic-year' imported from '.../packages/core/src/layout/classic-year.impl.test.ts'
FAIL  src/layout/classic-year.spec.test.ts [ src/layout/classic-year.spec.test.ts ]
Error: Cannot find module './classic-year' imported from '.../packages/core/src/layout/classic-year.spec.test.ts'

Test Files  5 failed (5)
     Tests  no tests
```

Restored files and re-ran: **46 passed**.

## 2. React specification/implementation tests before the view

Command:

```bash
cd packages/react
pnpm test
```

State: `YearPlanner.tsx` was temporarily moved out of `src/`.

```text
FAIL  src/YearPlanner.impl.test.tsx [ src/YearPlanner.impl.test.tsx ]
FAIL  src/YearPlanner.spec.test.tsx [ src/YearPlanner.spec.test.tsx ]

Test Files  2 failed (2)
     Tests  no tests
```

Restored the component and re-ran: **7 passed**.

## 3. Print spec before the A3 scale

Command:

```bash
pnpm test:print
```

State: `--yp-print-scale` in `packages/react/src/styles.css` was temporarily
changed from `0.72` to `1`.

```text
Error: expect(received).toBe(expected) // Object.is equality
Expected: 1
Received: 2

> 49 |     expect(pdf.pages).toBe(1);
       |                       ^
      50 |     expect(pdf.pageSize).toContain("1191.12 x 842.88 pts");

1 failed
```

Restored `0.72` and re-ran: **1 page, 1191.12 × 842.88 pt (A3)**.

## 4. Clean-consumer check before the built packages

Command:

```bash
pnpm test:consumer
```

State: `packages/core/dist` and `packages/react/dist` were temporarily removed,
so the packed tarballs had no entry points.

```text
error during build:
[commonjs--resolver] Failed to resolve entry for package
"@blendsdk/react-year-planner". The package may have incorrect
main/module/exports specified in its package.json.
```

Rebuilt both packages and re-ran: **PASS clean consumer**.

## What this evidence does and does not prove

- It proves the tests fail when the behavior or build output is absent, so a
  green run is not vacuous.
- It does not prove a perfect historical chronology. The M1 work was developed
  in a tight loop; the red state above is the reproducible failure mode, not a
  timestamped TDD diary.
- Specification tests remain the oracle: a later failing spec test means the
  implementation or the requirement changed, not that the test should be edited.

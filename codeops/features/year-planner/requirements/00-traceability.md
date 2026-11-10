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

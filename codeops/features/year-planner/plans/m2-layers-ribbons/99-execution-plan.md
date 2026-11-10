# Execution Plan: M2 Layers and Ribbons

> **Document**: 99-execution-plan.md
> **Parent**: [Index](00-index.md)
> **Last Updated**: 2026-11-10 13:34
> **Progress**: 40/46 tasks (87%)
> **CodeOps Artifact Schema**: 1

## Overview

Implements the RD-04 + RD-05 core engine: entity validation, visibility,
editability, paint/erase, ribbon fragments, lanes, overflow, a hit index and A3
print planning. Optional connectors wait for RD-06. Specification tests precede implementation in
every behavior phase.

**🚨 Update this document after EACH completed task!**

---

## Implementation Phases

| Phase | Title | Tasks |
|---|---|---|
| 1 | Entity model and validation | 8 |
| 2 | Visibility and editability | 7 |
| 3 | Paint and erase | 6 |
| 4 | Ribbon fragments and lanes | 7 |
| 5 | Signature and hit index | 6 |
| 6 | Print planning | 6 |
| 7 | Integration, docs and release evidence | 6 |

**Total: 46 tasks across 7 phases.**

> **⚠️ EXECUTION RULE:** the checkboxes below are the single source of truth.
> Mark `[~]` with an implemented timestamp, promote to `[x]` only after verify,
> and update this header after every task.

---

## Phase 1: Entity model and validation

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — the public entity model and non-blanking rules are
> consumed by every later phase and become a published API.

**Reference**: [03-01](03-01-entity-model.md) · AR #3, #4, #5, #26
**Objective**: Add the typed entity model, structural equality and the
non-blanking validation pass.

### Step 1.1: Specification tests

- [x] 1.1.1 [spec-author] Write validation spec tests for ST-1–ST-13, ST-64 and ST-76 — `packages/core/src/model/validation.spec.test.ts` ✅ (completed: 2026-11-10 13:13)
- [x] 1.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:13)

### Step 1.2: Implementation

- [x] 1.2.1 Add the M2 diagnostic codes and entity types — `packages/core/src/diagnostics.ts`, `packages/core/src/model/types.ts` ✅ (completed: 2026-11-10 13:18)
- [x] 1.2.2 Implement structural equality — `packages/core/src/model/equality.ts` ✅ (completed: 2026-11-10 13:18)
- [x] 1.2.3 Implement validation, cycle detection and normalization — `packages/core/src/model/validation.ts` ✅ (completed: 2026-11-10 13:18)
- [x] 1.2.4 Add the model barrel and public exports; run the spec tests green — `packages/core/src/model/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:18)

### Step 1.3: Implementation tests and verify

- [x] 1.3.1 Write validation edge-case tests — `packages/core/src/model/validation.impl.test.ts` ✅ (completed: 2026-11-10 13:18)
- [x] 1.3.2 Run `pnpm verify` and regenerate the API report ✅ (completed: 2026-11-10 13:18)

**Deliverables**:
- [ ] All ST-1–ST-13, ST-64 and ST-76 tests pass
- [ ] Invalid entities never blank the valid model
- [ ] Diagnostics contain IDs only

**Verify**: `pnpm verify`

---

## Phase 2: Visibility and editability

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — precedence bugs silently expose hidden data or permit
> forbidden edits.

**Reference**: [03-02](03-02-visibility-editability.md) · AR #6, #7, #8, #9, #10, #26
**Objective**: Resolve visibility, filters, tri-state groups, reducer actions
and policy-based editability.

### Step 2.1: Specification tests

- [x] 2.1.1 [spec-author] Write visibility/editability spec tests for ST-14–ST-30 and ST-65–ST-68, ST-78 — `packages/core/src/model/visibility.spec.test.ts` ✅ (completed: 2026-11-10 13:21)
- [x] 2.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:21)

### Step 2.2: Implementation

- [x] 2.2.1 Implement visibility precedence, filters, tri-state helpers, reducer and presets — `packages/core/src/model/visibility.ts` ✅ (completed: 2026-11-10 13:21)
- [x] 2.2.2 Implement policy resolution and editability — `packages/core/src/model/editability.ts` ✅ (completed: 2026-11-10 13:21)
- [x] 2.2.3 Export the modules and run the spec tests green — `packages/core/src/model/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:21)

### Step 2.3: Implementation tests and verify

- [x] 2.3.1 Write visibility/editability edge-case tests — `packages/core/src/model/visibility.impl.test.ts` ✅ (completed: 2026-11-10 13:21)
- [x] 2.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 13:21)

**Deliverables**:
- [ ] All ST-14–ST-30 and ST-65–ST-68, ST-78 tests pass
- [ ] Hidden ancestors always win over local show
- [ ] Policy precedence is deterministic

**Verify**: `pnpm verify`

---

## Phase 3: Paint and erase

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — data-destructive operation with identity, version and
> atomicity rules.

**Reference**: [03-03](03-03-paint-erase.md) · AR #11, #12, #13, #15
**Objective**: Implement atomic paint union and erase subtraction with new item
identities.

### Step 3.1: Specification tests

- [x] 3.1.1 [spec-author] Write paint/erase spec tests for ST-31–ST-42, ST-69–ST-71 and ST-81 — `packages/core/src/model/paint.spec.test.ts` ✅ (completed: 2026-11-10 13:25)
- [x] 3.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:25)

### Step 3.2: Implementation

- [x] 3.2.1 Implement atomic paint/erase — `packages/core/src/model/paint.ts` ✅ (completed: 2026-11-10 13:25)
- [x] 3.2.2 Export the module and run the spec tests green — `packages/core/src/model/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:25)

### Step 3.3: Implementation tests and verify

- [x] 3.3.1 Write paint/erase edge-case tests — `packages/core/src/model/paint.impl.test.ts` ✅ (completed: 2026-11-10 13:25)
- [x] 3.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 13:25)

**Deliverables**:
- [ ] All ST-31–ST-42, ST-69–ST-71 and ST-81 tests pass
- [ ] No source ID is reused
- [ ] Failed commands never mutate

**Verify**: `pnpm verify`

---

## Phase 4: Ribbon fragments and lanes

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: high — geometry must be exact across variable weekend widths
> and deterministic across rows.

**Reference**: [03-04](03-04-ribbon-geometry.md) · AR #15, #16, #17, #18, #20
**Objective**: Project visible items into clipped fragments, pack ribbon lanes,
compute compact overflow and row growth, and emit the deterministic signature.

### Step 4.1: Specification tests

- [x] 4.1.1 [spec-author] Write fragment/lane/overflow/signature spec tests for ST-43–ST-55, ST-57, ST-58, ST-72–ST-74, ST-77 and ST-80 — `packages/core/src/ribbon/fragments.spec.test.ts` ✅ (completed: 2026-11-10 13:29)
- [x] 4.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:29)

### Step 4.2: Implementation

- [x] 4.2.1 Add shared ribbon types and lane allocation with previous-row reuse — `packages/core/src/ribbon/types.ts`, `packages/core/src/ribbon/lanes.ts` ✅ (completed: 2026-11-10 13:29)
- [x] 4.2.2 Implement fragment projection, row assembly and overflow — `packages/core/src/ribbon/fragments.ts` ✅ (completed: 2026-11-10 13:29)
- [x] 4.2.3 Implement the deterministic signature and export the ribbon module; run the spec tests green — `packages/core/src/ribbon/fragments.ts`, `packages/core/src/ribbon/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:29)

### Step 4.3: Implementation tests and verify

- [x] 4.3.1 Write fragment/lane edge-case tests — `packages/core/src/ribbon/fragments.impl.test.ts` ✅ (completed: 2026-11-10 13:29)
- [x] 4.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 13:29)

**Deliverables**:
- [ ] All ST-43–ST-55, ST-57, ST-58 and ST-72–ST-74, ST-77, ST-80 tests pass
- [ ] Lane packing is deterministic
- [ ] Hidden items never appear in fragments or overflow

**Verify**: `pnpm verify`

---

## Phase 5: Hit index

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — additive descriptors with precise deterministic and
> coordinate contracts.

**Reference**: [03-05](03-05-print-hit-index.md) · AR #22
**Objective**: Add the deterministic hit index. The ribbon signature is delivered
with the fragments in Phase 4; gutter connectors are deferred to RD-06 (AR-21).

### Step 5.1: Specification tests

- [x] 5.1.1 [spec-author] Write hit-index spec tests for ST-56 and ST-75 — `packages/core/src/ribbon/hit-index.spec.test.ts` ✅ (completed: 2026-11-10 13:32)
- [x] 5.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:32)

### Step 5.2: Implementation

- [x] 5.2.1 Implement the hit index, geometric ordering and topmost hit test — `packages/core/src/ribbon/hit-index.ts` ✅ (completed: 2026-11-10 13:32)
- [x] 5.2.2 Export the module and run the spec tests green — `packages/core/src/ribbon/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:32)

### Step 5.3: Implementation tests and verify

- [x] 5.3.1 Write hit-index edge-case tests — `packages/core/src/ribbon/hit-index.impl.test.ts` ✅ (completed: 2026-11-10 13:32)
- [x] 5.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 13:32)

**Deliverables**:
- [ ] ST-56 and ST-75 tests pass
- [ ] Hit bounds are half-open and topmost
- [ ] Entry order is deterministic across channels

**Verify**: `pnpm verify`

---

## Phase 6: Print planning

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — boundary arithmetic and a non-fatal fit diagnostic.

**Reference**: [03-05](03-05-print-hit-index.md) · AR #18, #19
**Objective**: Produce A3 paginate/fit plans over variable-height ribbon rows.

### Step 6.1: Specification tests

- [x] 6.1.1 [spec-author] Write print spec tests for ST-59–ST-63 and ST-79 — `packages/core/src/ribbon/print.spec.test.ts` ✅ (completed: 2026-11-10 13:34)
- [x] 6.1.2 Run the spec tests and record the expected red failures — `docs/m2-red-phase.md` ✅ (completed: 2026-11-10 13:34)

### Step 6.2: Implementation

- [x] 6.2.1 Implement paginate/fit planning and the 7 pt diagnostic — `packages/core/src/ribbon/print.ts` ✅ (completed: 2026-11-10 13:34)
- [x] 6.2.2 Export the module and run the spec tests green — `packages/core/src/ribbon/index.ts`, `packages/core/src/index.ts` ✅ (completed: 2026-11-10 13:34)

### Step 6.3: Implementation tests and verify

- [x] 6.3.1 Write print boundary tests — `packages/core/src/ribbon/print.impl.test.ts` ✅ (completed: 2026-11-10 13:34)
- [x] 6.3.2 Run `pnpm verify` ✅ (completed: 2026-11-10 13:34)

**Deliverables**:
- [ ] All ST-59–ST-63 and ST-79 tests pass
- [ ] 1/2/3 page boundaries hold
- [ ] Fit below 7 pt returns a warning, not a crash

**Verify**: `pnpm verify`

---

## Phase 7: Integration, docs and release evidence

> **Phase baseline tree**: recorded by the executor at phase start.
> **Reasoning**: medium — proves the modules compose and keeps the public
> surface and docs honest.

**Reference**: [00-index](00-index.md), [07-testing-strategy](07-testing-strategy.md) · AR #23, #24
**Objective**: Prove the end-to-end core pipeline, update evidence and docs,
and close RD-04/RD-05 for the core slice.

### Step 7.1: Integration and closeout

- [ ] 7.1.1 Add the 12/24/36-month validate → visibility → ribbons → print integration test — `packages/core/src/integration.spec.test.ts`
- [ ] 7.1.2 Update the test report with M2 results and honest renderer gaps — `docs/test-report.md`
- [ ] 7.1.3 Update the README milestone table and finalize the red-phase record — `README.md`, `docs/m2-red-phase.md`
- [ ] 7.1.4 Update the roadmap rows and this plan to Done/100% — `codeops/features/year-planner/00-roadmap.md`, `codeops/00-roadmap.md`
- [ ] 7.1.5 Run `pnpm verify:full`, regenerate the API report and TypeDoc — `packages/core/etc/year-planner-core.api.md`, `docs/api/`
- [ ] 7.1.6 Run the post-phase quality review, record findings and clean up temporary artifacts — `05-findings.md`

**Deliverables**:
- [ ] Integration test passes
- [ ] `pnpm verify:full` passes
- [ ] API report and docs are current
- [ ] No deferred feature is claimed

**Verify**: `pnpm verify:full`

---

## Dependencies

```text
Phase 1
    ↓
Phase 2
    ↓
Phase 3
    ↓
Phase 4
    ↓
Phase 5
    ↓
Phase 6
    ↓
Phase 7
```

---

## Success Criteria

1. ✅ All 46 tasks completed
2. ✅ `pnpm verify` and `pnpm verify:full` pass
3. ✅ Core coverage stays at or above 95% for lines, branches, functions and statements
4. ✅ API report is committed and reviewed
5. ✅ No renderer, interaction or command behavior is claimed
6. ✅ Roadmap and test report reflect the real state
7. ✅ Post-phase review findings resolved or recorded

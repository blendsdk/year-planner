# Preflight Report: RD-08 Controlled Commands Plan

> **Status**: ✅ PREFLIGHT PASSED WITH NOTES — 10 resolved, 2 accepted
> **Iteration**: 2 (re-scan after planned fixes)
> **Previous Iteration**: 12 findings — 10 resolved, 2 accepted, 0 carried forward
> **This Iteration**: 0 new findings
> **Artifact**: Implementation plan at `codeops/features/year-planner/plans/m5-controlled-commands/`
> **Codebase Grounded**: 18 source/test/config files examined, 24 references verified
> **Last Updated**: 2026-11-11 01:55
> **Authority**: `--auto-design`; root invocation ID `yp-rd08-preflight-2026-11-11T01-48Z`

> **SAME-SESSION REVIEW**: This artifact was created in the current session. Same-agent
> bias risk is elevated. One independent design challenger reviewed the four major
> findings before their recommendations were recorded. Consider a fresh-session audit
> before treating this as the final word on the lifecycle design.

### Codebase Context Summary

**Tech Stack:** TypeScript 6.0.3, React 19.3.1, ESM-only packages, Vitest 3.2.7 +
Testing Library, Playwright 1.65, Storybook 10.6, Biome, API Extractor, pnpm 12.9.1.

**Architecture:** `@blendsdk/year-planner-core` owns pure dates, layout, ribbons,
visibility, editability and the paint algebra. `@blendsdk/react-year-planner`
owns state, command pipeline, interaction, rendering and the inspector. The demo and
Storybook consume only public package entries. `commands.ts` is internal to the React
package and is imported by the component, inspector and interaction layer.

**Key Files Examined:**

- `packages/react/src/commands.ts` — 609-line command hook and local checks.
- `packages/react/src/state.ts` — controlled/uncontrolled items and selection.
- `packages/react/src/YearPlanner.tsx` — pipeline wiring, focus and render.
- `packages/react/src/interaction/commit.ts`, `useInteraction.ts`, `preview.ts`.
- `packages/react/src/render/YearGrid.tsx`, `MonthRow.tsx`, `ItemLayer.tsx`, `Inspector.tsx`.
- `packages/core/src/contracts.ts`, `diagnostics.ts`, `model/paint.ts`, `model/validation.ts`.
- `packages/react/src/commands.spec.test.tsx`, `commands.impl.test.tsx`,
  `interaction.integration.spec.test.tsx`.
- `package.json`, `playwright.config.ts`, `apps/demo/src/InteractionDemo.tsx`,
  `apps/storybook/stories/Interaction.stories.tsx`.

**Reference Verification:** 24 references mapped — 22 verified, 2 corrected by the
findings below (the missing `CAPACITY_EXCEEDED` code and the API-report sequencing).

### Summary by Dimension

| # | Dimension | Findings | Highest Severity |
|---|-----------|----------|-----------------|
| 1 | Ambiguities | 0 | — |
| 2 | Implicit Assumptions | 0 | — |
| 3 | Logical Contradictions | 0 | — |
| 4 | Completeness Gaps | 1 | 🟠 |
| 5 | Dependency Issues | 0 | — |
| 6 | Feasibility Concerns | 0 | — |
| 7 | Testability | 1 | 🟡 |
| 8 | Security Blind Spots | 1 | 🟡 |
| 9 | Edge Cases | 1 | 🟠 |
| 10 | Scope Creep Indicators | 0 | — |
| 11 | Ordering & Sequencing | 1 | 🟠 |
| 12 | Consistency | 2 | 🟡 |
| 13 | Codebase Alignment | 5 | 🟠 |

### Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| MAJOR | 4 | 4 resolved, verified in Iteration 2 |
| MINOR | 6 | 6 resolved, verified in Iteration 2 |
| OBSERVATION | 2 | 2 accepted |

---

## Findings

### PF-001: API reports are regenerated too late for the verify gate 🟠 MAJOR

**Dimension:** Ordering & Sequencing
**Location:** `99-execution-plan.md` task 1.3.2 and task 4.2.4
**Codebase Evidence:** `package.json` defines `verify` as including `api-report:ci`;
`packages/core/etc/year-planner-core.api.md` and
`packages/react/etc/react-year-planner.api.md` do not contain the new codes, `baseRevision`
or the callback arguments.

**The Problem:** Phase 1 adds public exports (`COMMAND_ABORTED`,
`ACCEPTED_NOT_APPLIED`, `isDiagnosticCode`, `baseRevision` and optional callback
arguments). The plan only regenerates API reports in Phase 4. Every `pnpm verify` in
Phases 1–3 therefore fails at `api-report:ci`, which breaks the per-task verify cadence.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Regenerate API reports in Phase 1 immediately after the public changes; keep the final regeneration in Phase 4 | Keeps every verify green; final report still current | One extra report refresh |
| B | Move all public API changes to Phase 4 | Avoids early refresh | Tests for context/prop cannot be written earlier; breaks spec-first ordering |
| C | Drop `api-report:ci` from per-task verify | Faster | Hides API drift; weakens the gate |

**Recommendation:** Option A — the public surface must be reported when it changes.
**User Decision:** AI — delegated by --auto-design (provenance PF-001).

### PF-002: Item-change invalidation races acceptance and cancels unrelated work 🟠 MAJOR

**Dimension:** Codebase Alignment
**Location:** `03-01-command-lifecycle.md` §Prop and window invalidation; `07-testing-strategy.md` ST-16–ST-18
**Codebase Evidence:** `packages/core/src/ribbon/fragments.ts:63-70` includes every item
in the ribbon signature; a controlled host that updates `items` with its acceptance can
change the signature while the request is still `requesting`.

**The Problem:** The plan marks every validating/requesting request obsolete on any
`items` change. A controlled host may apply its accepted outcome synchronously with the
promise resolution; the revision-key effect could then discard a valid acceptance. The
same rule cancels an unrelated item's in-flight command, contradicting RD-08's
“unrelated items may proceed” and ST-23. Turning invalidation off during `requesting`
without a re-check would let an uncontrolled acceptance overwrite a concurrent item
change.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Invalidate on visibility/year/range/mode changes globally; invalidate item changes only while `validating` and only for the request's affected IDs; during `requesting`, let the outcome settle and re-check expected versions before any uncontrolled local apply | Avoids the acceptance race, preserves unrelated concurrency, keeps stale-apply protection | More precise request bookkeeping |
| B | Keep global items invalidation and add a synchronous-applied guard for non-paint commands | Smaller wording change | Incomplete for paint; still cancels unrelated items |
| C | Remove items invalidation and rely on host stale rejection | Simplest | Weakens AC13 and uncontrolled safety |

**Recommendation:** Option A — precise invalidation plus an apply-time version re-check.
**User Decision:** AI — delegated by --auto-design (provenance PF-002).

### PF-003: `CAPACITY_EXCEEDED` is missing from the diagnostic vocabulary 🟠 MAJOR

**Dimension:** Completeness Gaps
**Location:** `00-ambiguity-register.md` AR-5; `99-execution-plan.md` task 1.2.2
**Codebase Evidence:** `packages/core/src/diagnostics.ts:6-44` has no
`CAPACITY_EXCEEDED`; RD-08 lists it at
`requirements/RD-08-controlled-commands.md:128`; AC6 and ST-49/ST-77 depend on it.

**The Problem:** The plan adds only `COMMAND_ABORTED` and `ACCEPTED_NOT_APPLIED`. The
demo and tests cannot type-check a `CAPACITY_EXCEEDED` diagnostic, and unknown codes are
normalized to `HOST_REJECTED`, so AC6 would not be observable.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Add `CAPACITY_EXCEEDED` to the core union in Phase 1 along with the other two codes | Matches RD-08; demo/tests type-check | One more additive code |
| B | Use `HOST_REJECTED` in the demo/tests and amend RD-08 | No code addition | Loses the required stable code and AC6 specificity |
| C | Cast around the type in demo code | No core change | Type-unsafe; runtime normalization still loses the code |

**Recommendation:** Option A — the RD names the code and the demo needs it.
**User Decision:** AI — delegated by --auto-design (provenance PF-003).

### PF-004: Paint payload completeness is not actually proved 🟠 MAJOR

**Dimension:** Edge Cases
**Location:** `03-02-versions-outcomes.md` §Host outcome normalization and §Application proof
**Codebase Evidence:** `packages/core/src/model/paint.ts:212-255` can return merged items,
non-matching items, residuals and removed sources. A controlled host that returns
`{ updatedItems: [], removedItemIds: [] }` currently passes a presence-only check.

**The Problem:** The plan requires the arrays to be present but only checks entries that
are present. A partial or empty payload can report success with no mutation. It also uses
exact accepted versions, which can false-negative after a later unrelated version bump.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Require every `expectedVersions` key to appear in `updatedItems` or `removedItemIds`; require at least one new union item; use “version at least accepted” for payload entries | Proves the operation covered its sources; robust to later bumps | More predicate logic |
| B | Require `updatedItems.length > 0` for all paint | Simple | Erase-to-empty has an empty `updatedItems` |
| C | Trust the host payload | Least code | Phantom success remains |

**Recommendation:** Option A — the completeness invariant is the RD contract.
**User Decision:** AI — delegated by --auto-design (provenance PF-004).

### PF-005: Existing callback assertions use exact arity 🟡 MINOR

**Dimension:** Testability
**Location:** `99-execution-plan.md` task 1.2.3
**Codebase Evidence:** `packages/react/src/commands.impl.test.tsx:44` and
`packages/react/src/commands.spec.test.tsx:309-312` use `toHaveBeenCalledWith` with two
arguments.

**The Problem:** Adding a third `AbortSignal` argument makes those exact-arity
assertions fail. The plan claims existing tests stay green without naming this update.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Update the assertions to include `expect.anything()` for the signal and add an `AbortSignal` assertion | Keeps the public third argument | Small test edit |
| B | Keep the signal out of callbacks | No test edit | Drops the Should Have |
| C | Move the signal into `CommandContext` | No third argument | Changes the canonical RD-04 type |

**Recommendation:** Option A.
**User Decision:** AI — delegated by --auto-design (provenance PF-005).

### PF-006: Uncontrolled callbacks can diverge from the applied result 🟡 MINOR

**Dimension:** Codebase Alignment
**Location:** `03-02-versions-outcomes.md` §Uncontrolled reducer and §Callbacks
**Codebase Evidence:** `packages/react/src/commands.ts:533-549` builds `effectiveOutcome`
but calls `onChangeCommitted(outcome)`.

**The Problem:** In uncontrolled mode a host may accept without a payload; the local
helper applies items, but the callback receives the payload-less host outcome. The
callback and the actual item state disagree.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Use the effective outcome (host revision + synthesized local payload) when the payload was synthesized; pass a complete host payload untouched | Callback matches applied state | Slightly more branching |
| B | Always pass the host outcome | No change | Divergence remains |
| C | Require uncontrolled hosts to send payloads | Explicit | Unnecessary host burden |

**Recommendation:** Option A; for uncontrolled paint, always use the local helper result.
**User Decision:** AI — delegated by --auto-design (provenance PF-006).

### PF-007: Validation-throw retry wording contradicts the retry matrix 🟡 MINOR

**Dimension:** Consistency
**Location:** `03-02-versions-outcomes.md` §Timeout and throw mapping
**Codebase Evidence:** `packages/react/src/commands.ts:454-457` currently sets
`retryable: true` for a thrown validation; the plan's retry table says
`VALIDATION_ERROR` is not retryable.

**The Problem:** The plan says a thrown validation “is retryable” but the table forbids
retrying `VALIDATION_ERROR`.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Make thrown validation non-retryable and remove the sentence | Matches the table; simple | Loses a transient retry path |
| B | Make thrown validation retryable for non-delete commands and update the table | Keeps recovery | More branching; validation failures are usually fixable by the user |
| C | Leave the inconsistency | No work | Contradiction remains |

**Recommendation:** Option A — consistent and conservative.
**User Decision:** AI — delegated by --auto-design (provenance PF-007).

### PF-008: Notice-clearing semantics conflict 🟡 MINOR

**Dimension:** Consistency
**Location:** `03-03-rollback-pending-ui.md` §Inspector feedback and notices
**Codebase Evidence:** The current inspector has one feedback message; no notice list.
**The Problem:** The plan says notices clear on “a new terminal failure” in one place and
on `dismiss` in another, which would hide a warning that preceded the failure.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Clear feedback and notices when a new request starts; `dismiss` clears both | Predictable lifecycle | Warnings disappear on the next command |
| B | Clear only on dismiss | Warnings persist | Stale notices accumulate |
| C | Clear on terminal failure | Simple | Hides the warning that explained the failure |

**Recommendation:** Option A.
**User Decision:** AI — delegated by --auto-design (provenance PF-008).

### PF-009: Missing AC9 coverage and `periods` normalization 🟡 MINOR

**Dimension:** Testability
**Location:** `07-testing-strategy.md` Phase 2; `03-02-versions-outcomes.md` §Host outcome normalization
**Codebase Evidence:** `packages/core/src/model/paint.ts:212-255`; RD-08 AC9.
**The Problem:** The plan does not have ST cases for painting a range with no visible
highlight, zero-length paint or mixed attributes, and does not state that diagnostic
`periods` survive normalization.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Add ST cases for those AC9 scenarios and preserve optional `periods` | Full AC9 evidence | More ST rows |
| B | Rely on existing core tests | No new rows | No command-level evidence |
| C | Defer AC9 to RD-10 | Smaller plan | AC9 is RD-08 scope |

**Recommendation:** Option A.
**User Decision:** AI — delegated by --auto-design (provenance PF-009).

### PF-010: Host-supplied diagnostic text boundary is undocumented 🟡 MINOR

**Dimension:** Security Blind Spots
**Location:** `03-04-integration-docs.md` §Documentation
**Codebase Evidence:** `packages/react/src/render/Inspector.tsx:619-623` renders the
message as text; the plan redacts local hidden-item diagnostics but cannot sanitize
arbitrary host prose.
**The Problem:** The docs plan does not state that host diagnostic text is host-owned
and must be redacted by the host.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | Document the boundary: text-only rendering, host owns message content, local hidden diagnostics redacted | Honest and safe | No technical enforcement |
| B | Strip all item IDs from host diagnostics | Less leakage | Breaks useful host correlation |
| C | Render host messages as HTML | No | XSS |

**Recommendation:** Option A; link `docs/commands.md` from the docs set.
**User Decision:** AI — delegated by --auto-design (provenance PF-010).

### PF-011: `exactOptionalPropertyTypes` convention is not called out 🔵 OBSERVATION

**Dimension:** Codebase Alignment
**Location:** `03-03-rollback-pending-ui.md` types
**Codebase Evidence:** `tsconfig.base.json` enables `exactOptionalPropertyTypes`.
**The Problem:** Optional preview/promise fields cannot be assigned `undefined`; the
executor must use conditional spreads. The plan does not mention it.

**User Decision:** Accepted — add a one-line implementation note; no design change.

### PF-012: `isDiagnosticCode` adds a public core export 🔵 OBSERVATION

**Dimension:** Codebase Alignment
**Location:** `03-02-versions-outcomes.md`
**Codebase Evidence:** `packages/core/src/index.ts` re-exports `diagnostics.js`.
**The Problem:** The guard becomes public API. A private React-side set would avoid it
but risk drift with the core union.

**User Decision:** Accepted — the guard is small, additive and prevents drift; keep it.

---

## Delegated resolution provenance

### PF-001

```text
Authority: AI — delegated by --auto-design
Eligibility: task sequencing inside the confirmed plan.
Objective: keep every phase verify green while the public surface changes.
Decision: regenerate API reports in Phase 1 after the public changes and again in Phase 4.
Evidence: package.json verify includes api-report:ci; current reports lack the new surface.
Rejected alternatives: defer all API changes (breaks spec-first tests); skip api-report:ci (hides drift).
Strongest counterargument: two report refreshes.
Confidence: High — deterministic verify behavior.
Hardening: independent challenger agreed.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: the verify pipeline stops running api-report:ci.
```

### PF-002

```text
Authority: AI — delegated by --auto-design
Eligibility: concurrency and recovery design inside the command lifecycle.
Objective: never discard a valid acceptance and never overwrite a concurrent item change.
Decision: visibility/year/range/mode changes invalidate globally; item changes invalidate only validating requests whose affected IDs changed; requesting requests settle and rely on application proof plus an uncontrolled expected-version re-check.
Evidence: ribbon signature includes items; controlled hosts can update props with acceptance; current local apply does not re-check expectedVersion.
Rejected alternatives: global item invalidation (race, cancels unrelated items); no item invalidation (stale uncontrolled apply); synchronous-applied guard (incomplete for paint).
Strongest counterargument: more per-request bookkeeping.
Confidence: High — matches RD-08's unrelated-item concurrency and AC13.
Hardening: independent challenger recommended this refinement.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: batch commands or cross-item transactions are introduced.
```

### PF-003

```text
Authority: AI — delegated by --auto-design
Eligibility: additive diagnostic vocabulary inside the canonical union.
Objective: make AC6 and the capacity mock type-safe and observable.
Decision: add CAPACITY_EXCEEDED with the other two codes.
Evidence: RD-08 line 128; core union lacks it; ST-49/ST-77 depend on it.
Rejected alternatives: reuse HOST_REJECTED (loses the stable code); cast in demo (type-unsafe).
Strongest counterargument: another public code.
Confidence: High — required by the RD.
Hardening: independent challenger flagged the omission.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: a later RD removes the mock capacity policy.
```

### PF-004

```text
Authority: AI — delegated by --auto-design
Eligibility: data-consistency rule inside the accepted paint contract.
Objective: prove the paint operation covered every expected source.
Decision: require every expectedVersions key in updatedItems or removedItemIds; require at least one new union item; use at-least accepted versions.
Evidence: paintItems/eraseItems can merge, leave non-matching items, split residuals and remove sources.
Rejected alternatives: presence-only check (phantom success); non-empty updatedItems for all paint (erase-to-empty).
Strongest counterargument: a host may return a different but equivalent shape.
Confidence: High — the invariant is explicit in RD-08.
Hardening: independent challenger agreed.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: a future RD allows server-computed paint diffs without a full payload.
```

### PF-005

```text
Authority: AI — delegated by --auto-design
Eligibility: test maintenance inside the plan.
Objective: keep the existing host-callback tests valid with the additive signal.
Decision: update the two exact-arity assertions and assert the third argument is an AbortSignal.
Evidence: commands.impl.test.tsx:44; commands.spec.test.tsx:309-312.
Rejected alternatives: drop the signal (loses a Should Have); move it into CommandContext (canonical change).
Strongest counterargument: an extra test edit.
Confidence: High — deterministic Vitest behavior.
Hardening: independent challenger downgraded to minor but agreed the edit is needed.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: the callback signature changes again.
```

### PF-006

```text
Authority: AI — delegated by --auto-design
Eligibility: callback consistency inside the existing uncontrolled contract.
Objective: make the callback match the item state the component actually applied.
Decision: pass the effective outcome when a local payload was synthesized; pass a complete host payload untouched; uncontrolled paint uses the local helper result.
Evidence: commands.ts builds effectiveOutcome but calls onChangeCommitted(outcome).
Rejected alternatives: always host outcome (divergence); require host payloads (unnecessary burden).
Strongest counterargument: more branching in the apply path.
Confidence: High — the current code already computes the effective outcome.
Hardening: independent challenger downgraded to minor but agreed on the targeted form.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: uncontrolled mode stops using the local reducer.
```

### PF-007

```text
Authority: AI — delegated by --auto-design
Eligibility: failure-recovery consistency.
Objective: one retry rule.
Decision: thrown validation is VALIDATION_ERROR and not retryable; remove the contradictory sentence.
Evidence: commands.ts:454-457; retry matrix says no.
Rejected alternatives: make it retryable and expand the matrix (more branching).
Strongest counterargument: a transient validation failure could recover on retry.
Confidence: High — consistency wins; the user can reattempt manually.
Hardening: in-context review.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: hosts identify transient validation failures explicitly.
```

### PF-008

```text
Authority: AI — delegated by --auto-design
Eligibility: presentation state within the inspector.
Objective: avoid hiding a warning that explains a failure.
Decision: clear feedback and notices when a new request starts; dismiss clears both.
Evidence: current inspector has one message; the plan had two clearing rules.
Rejected alternatives: clear only on dismiss (stale notices); clear on failure (hides context).
Strongest counterargument: warnings disappear on the next command.
Confidence: High — scoped to one command lifecycle.
Hardening: in-context review.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: hosts need a persistent diagnostic log.
```

### PF-009

```text
Authority: AI — delegated by --auto-design
Eligibility: test coverage and diagnostic normalization inside RD-08.
Objective: close AC9 evidence and preserve the diagnostic shape.
Decision: add ST cases for no-visible-highlight, zero-length, mixed-attribute paint and partial controlled payloads; preserve optional periods.
Evidence: RD-08 AC9; core paint helper behavior.
Rejected alternatives: rely on core tests only (no command-level evidence); defer to RD-10 (out of scope).
Strongest counterargument: more ST rows.
Confidence: High — AC9 is in scope.
Hardening: in-context review.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: AC9 is revised.
```

### PF-010

```text
Authority: AI — delegated by --auto-design
Eligibility: documentation of the existing security boundary.
Objective: state clearly what the component can and cannot redact.
Decision: document text-only rendering, local hidden-diagnostic redaction, and host ownership of host-supplied prose; link docs/commands.md from the docs set.
Evidence: Inspector renders messages as text; host prose is arbitrary.
Rejected alternatives: strip all host item IDs (breaks correlation); render HTML (unsafe).
Strongest counterargument: no enforcement.
Confidence: High — honest boundary.
Hardening: in-context review.
Policy version: 1 · Root invocation ID: yp-rd08-preflight-2026-11-11T01-48Z
Reopen triggers: a host needs rich diagnostic rendering.
```

---

## Iteration 2 — Re-scan

**Scope:** all 13 dimensions re-checked within the unchanged plan target; fixes verified
against the files they name; no new findings.

| Finding | Fix verified | Evidence |
|---------|--------------|----------|
| PF-001 | ✅ | `99-execution-plan.md` 1.3.2 now runs `pnpm api-report` before `pnpm verify`; 03-04 records the Phase 1 refresh |
| PF-002 | ✅ | AR-10, 03-01 §Prop and window invalidation, 03-02 apply-time re-check, 03-03, ST-16–ST-18 and ST-93–ST-94 now use context-key plus affected-ID invalidation |
| PF-003 | ✅ | AR-5 and 99 task 1.2.2 add `CAPACITY_EXCEEDED`; 01/02 lists updated; ST-49/ST-77 are type-safe |
| PF-004 | ✅ | 03-02 normalization and application proof require expected-source coverage, a new union item and at-least versions; ST-90–ST-92/ST-95–ST-97 cover the cases |
| PF-005 | ✅ | 99 task 1.2.3 updates the exact-arity callback assertions; 03-01 testing requirements state the new signal assertion |
| PF-006 | ✅ | 03-02 §Uncontrolled reducer passes the effective outcome when synthesized; ST-89 asserts the callback payload |
| PF-007 | ✅ | 03-02 §Timeout and throw mapping now says `VALIDATION_ERROR` is not retryable, matching the matrix |
| PF-008 | ✅ | 03-02/03-03 clear feedback and notices when a new request starts; `dismiss` clears both |
| PF-009 | ✅ | 03-02 preserves `periods`; ST-90–ST-92 cover the AC9 scenarios |
| PF-010 | ✅ | 03-04 documents the host-owned diagnostic-prose boundary and links `docs/commands.md` |
| PF-011 | 🔵 accepted | 03-03 records the `exactOptionalPropertyTypes` conditional-spread rule |
| PF-012 | 🔵 accepted | `isDiagnosticCode` stays a small additive guard; no parallel code list |

### Iteration 2 checks

- **Ambiguities:** `contextKey` serialization is now explicit; no open material question.
- **Assumptions:** `AbortController` (Node ≥ 20.19), `Object.hasOwn` (ES2022) and the
  existing public paint helpers are all available in the repository.
- **Contradictions:** retry, notices, paint payload and invalidation wording now agree
  across AR, 03-01, 03-02, 03-03 and 07.
- **Completeness:** every RD-08 Must Have and Should Have has a task and ST coverage;
  AC6’s `CAPACITY_EXCEEDED` is now in the vocabulary.
- **Ordering:** API report refresh is in Phase 1; spec → red → implement → green → impl
  tests → verify holds in every phase.
- **Codebase alignment:** `contextKey` is computable before the pipeline; the affected-ID
  check uses `state.items`; the paint helper exports match the demo use; the callback
  arity tests are named.
- **Scope:** no new dependency, layer or harness; the demo and Storybook mocks stay in
  `apps/`.

## Verdict

**✅ PREFLIGHT PASSED WITH NOTES** — all 10 material findings are resolved and verified;
the two observations are accepted. The plan may proceed to execution. The pass is tied to
the current plan content; a material edit later requires a targeted re-check.

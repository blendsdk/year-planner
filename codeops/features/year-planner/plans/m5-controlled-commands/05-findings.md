# RD-08 Findings Ledger

> **Document**: 05-findings.md
> **Parent**: [Index](00-index.md)
> **Scope**: post-execution correctness and security review

## Review batch 1 — implementation diff

| Finding | Phase | Severity | Area | Ruling |
|---|---|---|---|---|
| RV-001 | all | MAJOR | commands/onItemsChange-isolation | fixed |
| RV-002 | all | MAJOR | tests/controlled-application-proof | fixed |
| RV-003 | all | MAJOR | tests/stale-apply-and-visibility | fixed |
| RV-004 | 2 | MAJOR | paint/invalid-range-code | fixed |
| RV-005 | 2 | MINOR | validation/warning-only-denial | fixed |
| RV-006 | 2 | MINOR | outcomes/malformed-removed-ids | fixed |
| RV-007 | 3 | MINOR | previews/key-collisions | fixed |
| RV-008 | 3 | MINOR | focus/current-visibility | fixed |
| RV-009 | 1 | MINOR | commands/malformed-shape | fixed |
| RV-010 | 1 | MINOR | commands/sentinel-collision | fixed |
| RV-011 | 1 | MINOR | commands/abort-mapping | fixed |
| RV-012 | 1 | OBSERVATION | api/forgotten-export | fixed |

### Notes

- `RV-001`: `applyLocal` now treats a throwing `onItemsChange` after the local
  array replacement as an applied command, records undo and calls
  `onChangeCommitted` instead of mapping the host callback error to
  `HOST_REJECTED`.
- `RV-002`: controlled accept tests now wait past `commandTimeoutMs`, assert the
  pending attribute before props update and pending cleared afterwards, and add
  create and paint-union cases.
- `RV-003`: added an uncontrolled undo-during-request case that rejects with
  `STALE_REVISION`, a visibility invalidation pending-preview case, and move and
  resize undo/redo coverage.
- `RV-004`: zero-length paint now reports `INVALID_RANGE`; a timed period still
  reports `INVALID_COMMAND`.
- `RV-005`: `permitted: false` with warning-only diagnostics now synthesizes a
  `VALIDATION_ERROR` error alongside the warnings.
- `RV-006`: non-string `removedItemIds` and IDs present in both updated and
  removed arrays now reject with `HOST_REJECTED`.
- `RV-007`: preview layers carry an explicit key; pending previews use their
  request key so two same-range creates or paints cannot collide.
- `RV-008`: focus settlement reads the latest item/visibility refs rather than
  the gesture-start snapshot.
- `RV-009`: local checks and affected-ID extraction are wrapped; malformed
  command shapes report `INVALID_COMMAND` instead of rejecting the pipeline
  promise.
- `RV-010`: a host value equal to `"timeout"` is only treated as the deadline
  sentinel when the deadline actually fired; otherwise it is normalized as a
  malformed outcome.
- `RV-011`: a host `AbortError` maps to `COMMAND_ABORTED`; internal timeout and
  obsolete paths keep their existing results.
- `RV-012`: `DiagnosticCode` is an explicit exported union backed by a private
  code list, so API Extractor no longer reports a forgotten export.

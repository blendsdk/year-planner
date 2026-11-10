# Paint and Erase: M2 Layers and Ribbons

> **Document**: 03-03-paint-erase.md
> **Parent**: [Index](00-index.md)

## Overview

Implements the highlight paint/erase algebra. One item has one period; erasing
the middle of a highlight replaces the source with two new residual items. All
new identities use `version: 1` and a caller-supplied ID factory.

## Architecture

`src/model/paint.ts` depends on `interval.ts` (union/subtract), the visibility
and editability modules, and the structural equality helper. It is pure and
synchronous.

## Implementation Details

### Types

```ts
export interface PaintDefaults {
  kind: "highlight";
  title?: string;
  color?: string;
  textColor?: string;
  className?: string;
  style?: Record<string, string | number>;
  status?: string;
  metadata?: unknown;
  annotation?: PlannerAnnotationStyle;
}

export interface PaintContext extends EditabilityContext {
  activeLayerId: string;
  createId: () => string;
  expectedVersions?: Record<string, number>;
}

export interface PaintResult {
  ok: boolean;
  updatedItems: PlannerItem[];
  removedItemIds: string[];
  diagnostics: Diagnostic[];
}

export function paintItems(
  context: PaintContext,
  layerId: string,
  period: AllDayPeriod,
  defaults: PaintDefaults,
): PaintResult;

export function eraseItems(
  context: PaintContext,
  layerId: string,
  period: AllDayPeriod,
): PaintResult;
```

### Paint algorithm

```text
1. Reject when layerId !== activeLayerId (INVALID_PAINT_TARGET).
2. Resolve the layer; reject unknown (UNKNOWN_REFERENCE) and channels other
   than background/highlight (INVALID_PAINT_CHANNEL, AR-27).
3. Reject global read-only, a hidden/locked/read-only layer,
   `allowPaint: false`, or a mode other than `auto`/`paint`/`erase` with
   NOT_EDITABLE (AR-28). These are layer-wide guardrails.
4. affected = items in layerId with kind "highlight", an **all-day** period,
   effectively visible, not item-locked/read-only, and period intersecting the
   range. Hidden, locked and read-only **items** are skipped and left unchanged
   (AR-28). Timed highlight items are skipped and left unchanged (AR-34).
5. For every affected ID present in expectedVersions, compare the version;
   any mismatch (STALE_VERSION) aborts with no mutation.
6. effectiveDefaults = { kind: "highlight", ...defaults }.
7. matching = affected items whose compared attributes equal effectiveDefaults:
   title, kind, status, metadata, style, assignments, annotation, color,
   textColor, className.
8. merged = union(range, matching periods). Because every match intersects the
   range, this is one interval.
9. Remove every matching ID. Insert one new highlight item for the merged
   interval with a new ID, version 1, layerId, and the effective defaults.
10. Return every new item plus every affected non-matching item unchanged in
    `updatedItems`; the host keeps them as-is.
```

Erase is the same through step 5, then:

```text
for each affected item:
  residuals = subtract(item.period, range)
  remove the source ID
  for each residual: insert a copy with a new ID and version 1
```

The returned `updatedItems` contains every new item **plus every affected
non-matching item, unchanged**. This matches RD-04's "full affected item set"
contract so RD-08 can report it directly. Removal is reported through
`removedItemIds`. Hidden, locked and read-only items are neither affected nor
returned, so a host merges the result into its canonical array without touching
them.

### Equality

`structuralEqual(a, b)` compares:

- primitives by `Object.is` (so `NaN` equals `NaN`);
- arrays element-by-element in order;
- plain objects by key sets and values, ignoring key insertion order;
- `Date`/`Map`/`Set`/class instances by identity (documented limitation);
- `undefined` and a missing key as equal.

The compared attribute set is fixed by RD-04: `title`, `kind`, `status`,
`metadata`, `style`, `assignments`, `annotation`, `color`, `textColor`,
`className` (AR-11).

### Identity rules

- Every new residual/merged item gets `createId()` and `version: 1`.
- Source IDs are never reused.
- Residual items copy `layerId`, `title`, `kind`, `metadata`, `color`,
  `textColor`, `className`, `style`, `status`, `assignments` and `annotation`.
- Merged items take the effective defaults because the matches were equal to
  them.
- `locked`/`readOnly` are not copied to new identities; the caller decides
  whether the new item inherits a guardrail. This prevents a residual from an
  editable item becoming silently locked.
- The paint range is an `AllDayPeriod`; a timed range must be projected before
  the call (AR-33).

### Error handling

| Case | Code | Mutation |
|---|---|---|
| Layer mismatch | `INVALID_PAINT_TARGET` | None |
| Unknown layer | `UNKNOWN_REFERENCE` | None |
| Non-paintable channel (`ribbon`/`annotation`/`foreground`) | `INVALID_PAINT_CHANNEL` | None |
| Global read-only, hidden/locked/read-only layer, `allowPaint: false`, or a non-paint mode | `NOT_EDITABLE` | None |
| Hidden/locked/read-only **item** or a timed highlight | — (skipped) | Item unchanged |
| Version mismatch | `STALE_VERSION` | None |
| Invalid range | RD-02 code | None |

All diagnostics carry IDs only (AR-26). A failed result still returns empty
`updatedItems` and `removedItemIds`, so callers can apply it unconditionally.

### Example

```ts
const result = eraseItems(
  {
    model,
    visibility,
    activeLayerId: "holidays",
    createId: () => crypto.randomUUID(),
  },
  "holidays",
  { kind: "all-day", startDate: "2027-06-14", endDateExclusive: "2027-06-17" },
);
```

## Testing Requirements

- Middle, left, right and full-coverage erase.
- Matching paint merge, differing metadata/color/title, and no-match creation.
- Hidden, locked, read-only, layer-locked and version-mismatch paths.
- New ID and version assertions on every created item.
- Attribute-copy assertions for residuals.
- Timed highlight targets are skipped, not converted.
- Invalid target/channel and invalid range.

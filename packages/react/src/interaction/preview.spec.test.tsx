import { buildClassicYearLayout, type MonthRowLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  type GesturePreview,
  type PreviewLayer,
  previewIntersectsRow,
  previewKey,
  previewsForRow,
  samePreviewEntries,
} from "./preview.js";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("expected layout");
  return result.layout;
})();

/** Finds one month row in the 2027 layout. */
function row(rowId: string): MonthRowLayout {
  const found = layout.rows.find((entry) => entry.rowId === rowId);
  if (!found) throw new Error(`missing row ${rowId}`);
  return found;
}

const january = row("2027-01");
const february = row("2027-02");

/** Builds a selection preview from one or more ranges. */
function selection(ranges: { startDate: string; endDateExclusive: string }[]): GesturePreview {
  return { kind: "selection", ranges };
}

/** Wraps a preview in its render identity. */
function layer(preview: GesturePreview): PreviewLayer {
  return { key: previewKey(preview), preview };
}

describe("RD-10-AC-11: preview row intersection", () => {
  it("matches a selection that spans two months on both rows", () => {
    const preview = selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }]);
    expect(previewIntersectsRow(preview, january)).toBe(true);
    expect(previewIntersectsRow(preview, february)).toBe(true);
  });

  it("does not match a row that only touches the range boundary", () => {
    const preview = selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-01" }]);
    expect(previewIntersectsRow(preview, february)).toBe(false);
  });

  it("matches an item preview and a range preview", () => {
    const item: GesturePreview = {
      kind: "item",
      variant: "move",
      itemId: "a",
      layerId: "layer",
      ranges: [{ startDate: "2027-02-03", endDateExclusive: "2027-02-06" }],
      valid: true,
    };
    const range: GesturePreview = {
      kind: "range",
      variant: "paint",
      layerId: "layer",
      ranges: [{ startDate: "2027-02-03", endDateExclusive: "2027-02-06" }],
      valid: false,
    };
    expect(previewIntersectsRow(item, february)).toBe(true);
    expect(previewIntersectsRow(range, february)).toBe(true);
    expect(previewIntersectsRow(item, january)).toBe(false);
  });

  it("never assigns a marquee to a row", () => {
    const marquee: GesturePreview = {
      kind: "marquee",
      rect: { left: 100, top: 10, width: 200, height: 90 },
    };
    expect(previewIntersectsRow(marquee, february)).toBe(false);
  });

  it("returns only the intersecting previews for a row", () => {
    const previews = [
      layer(selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }])),
      layer(selection([{ startDate: "2027-06-10", endDateExclusive: "2027-06-12" }])),
    ];
    expect(previewsForRow(previews, february)).toHaveLength(1);
    expect(previewsForRow([], february)).toEqual([]);
  });
});

describe("RD-10-AC-11: preview content equality", () => {
  it("treats an equal-content rebuild as unchanged", () => {
    const first = [layer(selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }]))];
    const second = [
      layer(selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }])),
    ];
    expect(first).not.toBe(second);
    expect(samePreviewEntries(first, second)).toBe(true);
  });

  it("detects a changed range, kind, validity and length", () => {
    const base = layer(selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }]));
    const changedRange = layer(
      selection([{ startDate: "2027-01-28", endDateExclusive: "2027-02-08" }]),
    );
    const changedKind = layer({
      kind: "range",
      variant: "paint",
      layerId: "layer",
      ranges: [{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }],
      valid: true,
    });
    const valid = layer({
      kind: "item",
      variant: "move",
      itemId: "a",
      layerId: "layer",
      ranges: [{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }],
      valid: true,
    });
    const invalid = layer({
      kind: "item",
      variant: "move",
      itemId: "a",
      layerId: "layer",
      ranges: [{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }],
      valid: false,
    });
    expect(samePreviewEntries([base], [changedRange])).toBe(false);
    expect(samePreviewEntries([base], [changedKind])).toBe(false);
    expect(samePreviewEntries([valid], [invalid])).toBe(false);
    expect(samePreviewEntries([base], [])).toBe(false);
  });

  it("compares marquee rectangles by value", () => {
    const first = layer({ kind: "marquee", rect: { left: 10, top: 20, width: 30, height: 40 } });
    const second = layer({ kind: "marquee", rect: { left: 10, top: 20, width: 30, height: 40 } });
    const changed = layer({ kind: "marquee", rect: { left: 11, top: 20, width: 30, height: 40 } });
    expect(samePreviewEntries([first], [second])).toBe(true);
    expect(samePreviewEntries([first], [changed])).toBe(false);
  });
});

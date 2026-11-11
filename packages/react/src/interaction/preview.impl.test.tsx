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

/** Wraps a preview in its render identity. */
function layer(preview: GesturePreview): PreviewLayer {
  return { key: previewKey(preview), preview };
}

describe("preview row intersection edge cases", () => {
  it("matches a range that covers the whole row", () => {
    const preview: GesturePreview = {
      kind: "selection",
      ranges: [{ startDate: "2026-12-01", endDateExclusive: "2027-03-01" }],
    };
    expect(previewIntersectsRow(preview, january)).toBe(true);
    expect(previewIntersectsRow(preview, february)).toBe(true);
  });

  it("rejects ranges entirely before or after the row", () => {
    const before: GesturePreview = {
      kind: "selection",
      ranges: [{ startDate: "2026-11-01", endDateExclusive: "2026-12-01" }],
    };
    const after: GesturePreview = {
      kind: "selection",
      ranges: [{ startDate: "2027-03-01", endDateExclusive: "2027-04-01" }],
    };
    expect(previewIntersectsRow(before, january)).toBe(false);
    expect(previewIntersectsRow(after, january)).toBe(false);
  });

  it("matches when only one of several ranges intersects", () => {
    const preview: GesturePreview = {
      kind: "selection",
      ranges: [
        { startDate: "2026-11-01", endDateExclusive: "2026-12-01" },
        { startDate: "2027-02-03", endDateExclusive: "2027-02-05" },
      ],
    };
    expect(previewIntersectsRow(preview, january)).toBe(false);
    expect(previewIntersectsRow(preview, february)).toBe(true);
  });

  it("handles a row with no comparable dates without throwing", () => {
    const emptyRow: MonthRowLayout = {
      ...january,
      firstDate: "2027-01-01",
      endDateExclusive: "2027-02-01",
    };
    const preview: GesturePreview = {
      kind: "selection",
      ranges: [{ startDate: "2027-01-15", endDateExclusive: "2027-01-16" }],
    };
    expect(previewIntersectsRow(preview, emptyRow)).toBe(true);
    expect(previewsForRow([], emptyRow)).toEqual([]);
  });

  it("preserves input order when filtering", () => {
    const first = layer({
      kind: "selection",
      ranges: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-02" }],
    });
    const second = layer({
      kind: "selection",
      ranges: [{ startDate: "2027-02-03", endDateExclusive: "2027-02-04" }],
    });
    expect(previewsForRow([first, second], february)).toEqual([first, second]);
  });
});

describe("preview content equality edge cases", () => {
  it("treats two empty lists as equal and a duplicate key with different content as changed", () => {
    expect(samePreviewEntries([], [])).toBe(true);
    const first = layer({
      kind: "selection",
      ranges: [{ startDate: "2027-01-01", endDateExclusive: "2027-01-02" }],
    });
    const changed = {
      key: first.key,
      preview: {
        kind: "selection",
        ranges: [{ startDate: "2027-01-01", endDateExclusive: "2027-01-03" }],
      } satisfies GesturePreview,
    };
    expect(samePreviewEntries([first], [changed])).toBe(false);
  });
});

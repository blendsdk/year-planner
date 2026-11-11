import { describe, expect, it } from "vitest";
import { eraseItems, type PaintContext, type PaintDefaults, paintItems } from "./paint";
import type { PlannerItem, PlannerLayer, PlannerModel, VisibilityState } from "./types";

const layer = (id: string, channel: PlannerLayer["channel"] = "highlight"): PlannerLayer => ({
  id,
  name: id,
  channel,
  color: "#1d4e89",
});

const highlight = (
  id: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "highlight",
  layerId: "highlights",
  period: { kind: "all-day", startDate, endDateExclusive },
  title: "H",
  version: 1,
  ...overrides,
});

const state = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
  ...overrides,
});

function context(
  items: PlannerItem[],
  overrides: Partial<PaintContext> = {},
): PaintContext & { ids: string[] } {
  const ids: string[] = [];
  let count = 0;
  const model: PlannerModel = {
    groups: [],
    layers: [layer("highlights"), layer("background", "background"), layer("ribbon", "ribbon")],
    items,
    resources: [],
  };
  return {
    model,
    visibility: state(),
    activeLayerId: "highlights",
    createId: () => {
      count += 1;
      const id = `new-${count}`;
      ids.push(id);
      return id;
    },
    mode: "auto",
    ids,
    ...overrides,
  };
}

const defaults: PaintDefaults = { kind: "highlight", title: "H" };

describe("RD-04 paint and erase", () => {
  it("RD-04-AC-11: erases the middle into two new residual items", () => {
    const ctx = context([
      highlight("h1", "2027-06-10", "2027-06-21", {
        color: "#123456",
        textColor: "#ffffff",
        className: "booked",
        style: { fontWeight: "bold" },
        status: "confirmed",
        metadata: { source: "host" },
        assignments: [{ resourceId: "alice" }],
        annotation: { label: "OH" },
      }),
    ]);
    const result = eraseItems(ctx, "highlights", {
      kind: "all-day",
      startDate: "2027-06-14",
      endDateExclusive: "2027-06-17",
    });
    expect(result.ok).toBe(true);
    expect(result.removedItemIds).toEqual(["h1"]);
    expect(result.updatedItems).toHaveLength(2);
    expect(result.updatedItems.map((entry) => entry.period)).toEqual([
      { kind: "all-day", startDate: "2027-06-10", endDateExclusive: "2027-06-14" },
      { kind: "all-day", startDate: "2027-06-17", endDateExclusive: "2027-06-21" },
    ]);
    expect(result.updatedItems.map((entry) => entry.id)).toEqual(["new-1", "new-2"]);
    for (const entry of result.updatedItems) {
      expect(entry.version).toBe(1);
      expect(entry.title).toBe("H");
      expect(entry.color).toBe("#123456");
      expect(entry.textColor).toBe("#ffffff");
      expect(entry.className).toBe("booked");
      expect(entry.style).toEqual({ fontWeight: "bold" });
      expect(entry.status).toBe("confirmed");
      expect(entry.metadata).toEqual({ source: "host" });
      expect(entry.assignments).toEqual([{ resourceId: "alice" }]);
      expect(entry.annotation).toEqual({ label: "OH" });
    }
  });

  it("RD-04-AC-12: paints a merged interval over a matching highlight", () => {
    const ctx = context([highlight("h1", "2027-06-10", "2027-06-14")]);
    const result = paintItems(
      ctx,
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(result.ok).toBe(true);
    expect(result.removedItemIds).toEqual(["h1"]);
    expect(result.updatedItems).toHaveLength(1);
    expect(result.updatedItems[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-15",
    });
    expect(result.updatedItems[0]?.id).toBe("new-1");
    expect(result.updatedItems[0]?.version).toBe(1);
    expect(result.updatedItems[0]?.title).toBe("H");
  });

  it("RD-04-AC-13: does not merge differing metadata or color and keeps originals", () => {
    const ctx = context([
      highlight("h1", "2027-06-10", "2027-06-14", { metadata: { a: 1 } }),
      highlight("h2", "2027-06-12", "2027-06-16", { color: "#ff0000" }),
    ]);
    const result = paintItems(
      ctx,
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      { kind: "highlight", title: "H", metadata: { a: 2 }, color: "#00ff00" },
    );
    expect(result.ok).toBe(true);
    expect(result.removedItemIds).toEqual([]);
    expect(result.updatedItems).toHaveLength(3);
    expect(result.updatedItems.filter((entry) => entry.id.startsWith("new-"))).toHaveLength(1);
    expect(result.updatedItems.find((entry) => entry.id === "h1")?.metadata).toEqual({ a: 1 });
    expect(result.updatedItems.find((entry) => entry.id === "h2")?.color).toBe("#ff0000");
  });

  it("creates the drawn range when nothing matches", () => {
    const result = paintItems(
      context([]),
      "highlights",
      { kind: "all-day", startDate: "2027-07-01", endDateExclusive: "2027-07-03" },
      { kind: "highlight", title: "New" },
    );
    expect(result.ok).toBe(true);
    expect(result.removedItemIds).toEqual([]);
    expect(result.updatedItems).toHaveLength(1);
    expect(result.updatedItems[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-07-01",
      endDateExclusive: "2027-07-03",
    });
    expect(result.updatedItems[0]?.title).toBe("New");
  });

  it("RD-04-AC-17: rejects a layer that is not the active paint target", () => {
    const result = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")]),
      "background",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_PAINT_TARGET");
    expect(result.updatedItems).toHaveLength(0);
    expect(result.removedItemIds).toHaveLength(0);
  });

  it("RD-04-AC-15: skips a hidden highlight and leaves it unchanged", () => {
    const ctx = context([highlight("h1", "2027-06-10", "2027-06-21")], {
      visibility: state({ hiddenItemIds: ["h1"] }),
    });
    const result = eraseItems(ctx, "highlights", {
      kind: "all-day",
      startDate: "2027-06-14",
      endDateExclusive: "2027-06-17",
    });
    expect(result.ok).toBe(true);
    expect(result.updatedItems).toHaveLength(0);
    expect(result.removedItemIds).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("rejects global and layer guardrails but skips a locked item", () => {
    const global = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")], { readOnly: true }),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(global.ok).toBe(false);
    expect(global.diagnostics.map((entry) => entry.code)).toContain("NOT_EDITABLE");

    const layerLocked = paintItems(
      context([], {
        model: {
          groups: [],
          layers: [{ ...layer("highlights"), locked: true }],
          items: [highlight("h1", "2027-06-10", "2027-06-14")],
          resources: [],
        },
      }),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(layerLocked.ok).toBe(false);
    expect(layerLocked.diagnostics.map((entry) => entry.code)).toContain("NOT_EDITABLE");

    const itemLocked = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-21", { locked: true })]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-14", endDateExclusive: "2027-06-17" },
      defaults,
    );
    expect(itemLocked.ok).toBe(true);
    expect(itemLocked.updatedItems.map((entry) => entry.id)).toEqual(["new-1"]);
    expect(itemLocked.removedItemIds).toHaveLength(0);
  });

  it("rejects a stale expected version without mutation", () => {
    const result = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    const stale = paintItems(
      context([{ ...highlight("h1", "2027-06-10", "2027-06-14"), version: 2 }], {
        expectedVersions: { h1: 1 },
      }),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(result.ok).toBe(true);
    expect(stale.ok).toBe(false);
    expect(stale.diagnostics.map((entry) => entry.code)).toContain("STALE_VERSION");
    expect(stale.updatedItems).toHaveLength(0);
    expect(stale.removedItemIds).toHaveLength(0);
  });

  it("RD-04-AC-16: merges only when the title matches", () => {
    const same = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      { kind: "highlight", title: "H" },
    );
    const different = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      { kind: "highlight", title: "Other" },
    );
    expect(same.removedItemIds).toEqual(["h1"]);
    expect(different.removedItemIds).toEqual([]);
    expect(different.updatedItems.filter((entry) => entry.id === "h1")).toHaveLength(1);
  });

  it("erases full coverage and left/right slivers", () => {
    const full = eraseItems(context([highlight("h1", "2027-06-10", "2027-06-14")]), "highlights", {
      kind: "all-day",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-14",
    });
    expect(full.removedItemIds).toEqual(["h1"]);
    expect(full.updatedItems).toHaveLength(0);

    const left = eraseItems(context([highlight("h1", "2027-06-10", "2027-06-20")]), "highlights", {
      kind: "all-day",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-14",
    });
    expect(left.updatedItems[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-06-14",
      endDateExclusive: "2027-06-20",
    });
    const right = eraseItems(context([highlight("h1", "2027-06-10", "2027-06-20")]), "highlights", {
      kind: "all-day",
      startDate: "2027-06-16",
      endDateExclusive: "2027-06-20",
    });
    expect(right.updatedItems[0]?.period).toEqual({
      kind: "all-day",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-16",
    });
  });

  it("rejects a reverse range without mutation", () => {
    const result = paintItems(
      context([highlight("h1", "2027-06-10", "2027-06-14")]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-15", endDateExclusive: "2027-06-12" },
      defaults,
    );
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_RANGE");
    expect(result.updatedItems).toHaveLength(0);
    expect(result.removedItemIds).toHaveLength(0);
  });

  it("rejects ribbon and annotation channels but allows background", () => {
    for (const channel of ["ribbon", "annotation", "foreground"] as const) {
      const result = paintItems(
        context([], {
          model: {
            groups: [],
            layers: [layer("highlights", channel)],
            items: [],
            resources: [],
          },
          activeLayerId: "highlights",
        }),
        "highlights",
        { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
        defaults,
      );
      expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_PAINT_CHANNEL");
    }
    const background = paintItems(
      context([], {
        model: {
          groups: [],
          layers: [layer("highlights", "background")],
          items: [],
          resources: [],
        },
        activeLayerId: "highlights",
      }),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(background.ok).toBe(true);
    expect(background.updatedItems).toHaveLength(1);
  });

  it("compares every documented attribute", () => {
    const variants: Array<{
      overrides: Partial<PlannerItem>;
      same: Partial<PaintDefaults>;
      different: Partial<PaintDefaults>;
    }> = [
      {
        overrides: { annotation: { label: "OH" } },
        same: { annotation: { label: "OH" } },
        different: { annotation: { label: "X" } },
      },
      {
        overrides: { style: { color: "red" } },
        same: { style: { color: "red" } },
        different: { style: { color: "blue" } },
      },
      {
        overrides: { status: "confirmed" },
        same: { status: "confirmed" },
        different: { status: "tentative" },
      },
      {
        overrides: { textColor: "#ffffff" },
        same: { textColor: "#ffffff" },
        different: { textColor: "#000000" },
      },
      {
        overrides: { className: "booked" },
        same: { className: "booked" },
        different: { className: "free" },
      },
      {
        overrides: { color: "#123456" },
        same: { color: "#123456" },
        different: { color: "#654321" },
      },
      {
        overrides: { metadata: { a: 1 } },
        same: { metadata: { a: 1 } },
        different: { metadata: { a: 2 } },
      },
    ];
    for (const variant of variants) {
      const item = highlight("h1", "2027-06-10", "2027-06-14", variant.overrides);
      const merged = paintItems(
        context([item]),
        "highlights",
        { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
        { kind: "highlight", title: "H", ...variant.same },
      );
      expect(merged.removedItemIds).toEqual(["h1"]);
      const separate = paintItems(
        context([item]),
        "highlights",
        { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
        { kind: "highlight", title: "H", ...variant.different },
      );
      expect(separate.removedItemIds).toEqual([]);
    }
    const withAssignments = paintItems(
      context([
        highlight("h1", "2027-06-10", "2027-06-14", { assignments: [{ resourceId: "alice" }] }),
      ]),
      "highlights",
      { kind: "all-day", startDate: "2027-06-12", endDateExclusive: "2027-06-15" },
      defaults,
    );
    expect(withAssignments.removedItemIds).toEqual([]);
  });

  it("skips a timed highlight", () => {
    const timed: PlannerItem = {
      ...highlight("h1", "2027-06-10", "2027-06-21"),
      period: {
        kind: "timed",
        start: "2027-06-10T08:00:00Z",
        endExclusive: "2027-06-21T08:00:00Z",
        timeZone: "UTC",
      },
    };
    const result = eraseItems(context([timed]), "highlights", {
      kind: "all-day",
      startDate: "2027-06-14",
      endDateExclusive: "2027-06-17",
    });
    expect(result.ok).toBe(true);
    expect(result.updatedItems).toHaveLength(0);
    expect(result.removedItemIds).toHaveLength(0);
  });
});

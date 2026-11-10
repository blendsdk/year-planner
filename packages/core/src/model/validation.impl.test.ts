import { describe, expect, it } from "vitest";
import { structuralEqual } from "./equality";
import type { PlannerItem, PlannerLayer } from "./types";
import { emptyPlannerModel, validatePlannerData } from "./validation";

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...overrides,
});

const item = (id: string, layerId: string, overrides: Partial<PlannerItem> = {}): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
  version: 1,
  ...overrides,
});

describe("structural equality", () => {
  it("ignores object key order and compares arrays in order", () => {
    expect(structuralEqual({ a: 1, b: [2, 3] }, { b: [2, 3], a: 1 })).toBe(true);
    expect(structuralEqual([1, 2], [2, 1])).toBe(false);
    expect(structuralEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(structuralEqual({ a: undefined }, {})).toBe(true);
  });

  it("compares non-plain objects by identity", () => {
    const date = new Date(0);
    expect(structuralEqual(date, date)).toBe(true);
    expect(structuralEqual(new Date(0), new Date(0))).toBe(false);
  });
});

describe("validation internals", () => {
  it("returns a fresh empty model", () => {
    const first = emptyPlannerModel();
    const second = emptyPlannerModel();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("detects a self-parent cycle once", () => {
    const result = validatePlannerData({ groups: [{ id: "a", name: "A", parentGroupId: "a" }] });
    expect(result.diagnostics.filter((entry) => entry.code === "GROUP_CYCLE")).toHaveLength(1);
    expect(result.model.groups).toHaveLength(0);
  });

  it("rejects invalid group visibility and layer order values", () => {
    const result = validatePlannerData({
      groups: [{ id: "g", name: "G", defaultVisible: "yes" as never }],
      layers: [layer("l", { sortOrder: Number.NaN })],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["INVALID_GROUP", "INVALID_LAYER"]),
    );
    expect(result.model.layers).toHaveLength(0);
  });

  it("rejects invalid resource capacity and keeps a valid sibling", () => {
    const result = validatePlannerData({
      resources: [
        { id: "bad", name: "Bad", type: "person", capacity: { quantity: 0, unit: "h" } },
        { id: "good", name: "Good", type: "person", capacity: { quantity: 1, unit: "h" } },
      ],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_RESOURCE");
    expect(result.model.resources.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects malformed periods, annotation styles and assignments", () => {
    const result = validatePlannerData({
      layers: [layer("l"), layer("notes", { channel: "annotation" })],
      resources: [{ id: "r1", name: "R", type: "person" }],
      items: [
        item("bad-period", "l", { period: { kind: "weekly" } as never }),
        item("bad-annotation", "l", { annotation: { label: 4 } as never }),
        item("bad-assignment", "l", { assignments: [{ resourceId: "" }] }),
        item("missing-version", "l", { version: Number.NaN }),
        item("good", "l", { assignments: [{ resourceId: "r1", quantity: 2 }] }),
      ],
    });
    const codes = result.diagnostics.map((entry) => entry.code);
    expect(codes).toEqual(expect.arrayContaining(["INVALID_ITEM", "INVALID_VERSION"]));
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects a non-annotation item on an annotation layer", () => {
    const result = validatePlannerData({
      layers: [layer("notes", { channel: "annotation" })],
      items: [item("activity", "notes")],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_ANNOTATION");
  });

  it("rejects a duplicate annotation that collides with an item", () => {
    const result = validatePlannerData({
      layers: [layer("l"), layer("notes", { channel: "annotation" })],
      items: [item("same", "l")],
      annotations: [{ ...item("same", "notes"), kind: "annotation" }],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("DUPLICATE_ID");
    expect(result.model.items).toHaveLength(1);
  });

  it("never populates periods and never mutates the input", () => {
    const input = {
      layers: [layer("l")],
      items: [
        item("bad", "l", { period: { kind: "all-day", startDate: "x", endDateExclusive: "y" } }),
      ],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    const result = validatePlannerData(input);
    expect(result.diagnostics.every((entry) => entry.periods === undefined)).toBe(true);
    expect(input).toEqual(snapshot);
  });
});

describe("validation error branches", () => {
  it("drops a group with an unknown parent and its dependents", () => {
    const result = validatePlannerData({
      groups: [{ id: "child", name: "Child", parentGroupId: "missing" }],
      layers: [layer("l", { groupId: "child" })],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["UNKNOWN_REFERENCE"]),
    );
    expect(result.model.groups).toHaveLength(0);
    expect(result.model.layers).toHaveLength(0);
  });

  it("rejects layers with missing fields, invalid policy, order values and groups", () => {
    const result = validatePlannerData({
      layers: [
        { ...layer("empty"), id: "" },
        { ...layer("policy"), policy: { allowMove: "yes" } as never },
        { ...layer("order"), sortOrder: Number.POSITIVE_INFINITY },
        { ...layer("priority"), displayPriority: Number.NaN },
        layer("group", { groupId: "missing" }),
        layer("good"),
      ],
      items: [item("i", "good")],
    });
    expect(
      result.diagnostics.filter((entry) => entry.code === "INVALID_LAYER").length,
    ).toBeGreaterThanOrEqual(4);
    expect(result.model.layers.map((entry) => entry.id)).toEqual(["good"]);
    expect(result.model.items).toHaveLength(1);
  });

  it("rejects resources with missing required fields", () => {
    const result = validatePlannerData({
      resources: [
        { id: "", name: "", type: "" },
        { id: "good", name: "G", type: "person" },
      ],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_RESOURCE");
    expect(result.model.resources.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects items with missing required fields and malformed periods", () => {
    const result = validatePlannerData({
      layers: [layer("l")],
      items: [
        { ...item("empty", "l"), id: "" },
        { ...item("kind", "l"), kind: "nope" as never },
        { ...item("layer", "l"), layerId: "" },
        { ...item("period", "l"), period: null as never },
        { ...item("all-day", "l"), period: { kind: "all-day" } as never },
        { ...item("timed", "l"), period: { kind: "timed" } as never },
        {
          ...item("zone", "l"),
          period: {
            kind: "timed",
            start: "2027-01-01T00:00:00Z",
            endExclusive: "2027-01-02T00:00:00Z",
            timeZone: "Mars/Olympus",
          },
        },
        { ...item("bad-label", "l"), annotation: { label: 4 } as never },
        { ...item("bad-background", "l"), annotation: { background: 4 } as never },
        { ...item("bad-priority", "l"), annotation: { priority: Number.NaN } as never },
        { ...item("bad-role", "l"), assignments: [{ resourceId: "r1", role: 4 }] as never },
        { ...item("bad-quantity", "l"), assignments: [{ resourceId: "r1", quantity: 0 }] },
        { ...item("non-array", "l"), assignments: {} as never },
        item("good", "l"),
      ],
      resources: [{ id: "r1", name: "R", type: "person" }],
    });
    const codes = result.diagnostics.map((entry) => entry.code);
    expect(codes).toEqual(expect.arrayContaining(["INVALID_ITEM", "INVALID_TIMEZONE"]));
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects a non-plain style and non-finite style values", () => {
    const result = validatePlannerData({
      layers: [layer("l")],
      items: [
        item("style-array", "l", { style: [] as never }),
        item("style-nan", "l", { style: { a: Number.NaN } }),
        item("good", "l"),
      ],
    });
    expect(result.diagnostics.filter((entry) => entry.code === "INVALID_STYLE")).toHaveLength(2);
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects a non-plain layer policy", () => {
    const result = validatePlannerData({
      layers: [layer("l", { policy: [] as never })],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_LAYER");
  });
});

describe("validation duplicate and malformed-input regressions", () => {
  it("returns only one group for a duplicate id and prefers the valid entity", () => {
    const duplicate = validatePlannerData({
      groups: [
        { id: "g", name: "first", policy: { allowMove: "no" } as never },
        { id: "g", name: "second" },
      ],
    });
    expect(duplicate.model.groups).toHaveLength(1);
    expect(duplicate.model.groups[0]?.name).toBe("second");
    const validFirst = validatePlannerData({
      groups: [
        { id: "g", name: "first" },
        { id: "g", name: "second" },
      ],
    });
    expect(validFirst.model.groups).toHaveLength(1);
    expect(validFirst.model.groups[0]?.name).toBe("first");
  });

  it("collapses the same object reference added twice", () => {
    const shared = item("shared", "l");
    const result = validatePlannerData({ layers: [layer("l")], items: [shared, shared] });
    expect(result.model.items).toHaveLength(1);
    expect(result.diagnostics.map((entry) => entry.code)).toContain("DUPLICATE_ID");
  });

  it("does not throw on null entries and keeps valid siblings", () => {
    const result = validatePlannerData({
      groups: [null as never, { id: "g", name: "G" }],
      layers: [null as never, layer("l", { groupId: "g" })],
      resources: [null as never, { id: "r", name: "R", type: "person", capacity: null as never }],
      items: [null as never, item("good", "l")],
    });
    const codes = result.diagnostics.map((entry) => entry.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "INVALID_GROUP",
        "INVALID_LAYER",
        "INVALID_RESOURCE",
        "INVALID_ITEM",
      ]),
    );
    expect(result.model.groups).toHaveLength(1);
    expect(result.model.layers).toHaveLength(1);
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("does not throw on non-array collections", () => {
    const result = validatePlannerData({
      groups: {} as never,
      layers: "nope" as never,
      resources: 42 as never,
      items: null as never,
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toHaveLength(4);
  });

  it("rejects non-string item titles and non-boolean flags", () => {
    const result = validatePlannerData({
      layers: [layer("l")],
      items: [
        item("title", "l", { title: 42 as never }),
        item("flag", "l", { locked: "yes" as never }),
        item("good", "l"),
      ],
    });
    expect(result.diagnostics.filter((entry) => entry.code === "INVALID_ITEM")).toHaveLength(2);
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });

  it("rejects unknown policy keys and does not pollute prototypes", () => {
    const policy = JSON.parse('{"allowMove":true,"__proto__":{"polluted":true}}');
    const result = validatePlannerData({
      layers: [layer("l", { policy })],
    });
    expect(result.diagnostics.map((entry) => entry.code)).toContain("INVALID_LAYER");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("preserves annotation text color", () => {
    const annotation = {
      ...item("holiday", "notes"),
      kind: "annotation" as const,
      textColor: "#111111",
      annotation: { label: "OH", background: "#ffd166" },
    };
    const result = validatePlannerData({
      layers: [{ ...layer("notes"), channel: "annotation" }],
      annotations: [annotation],
    });
    expect(result.model.items[0]?.textColor).toBe("#111111");
  });
});

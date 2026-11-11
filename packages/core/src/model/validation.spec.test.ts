import { describe, expect, it } from "vitest";
import type { LayerGroup, PlannerItem, PlannerLayer, Resource } from "./types";
import { validatePlannerData } from "./validation";

const group = (id: string, parentGroupId?: string): LayerGroup => ({
  id,
  name: id,
  ...(parentGroupId === undefined ? {} : { parentGroupId }),
});

const layer = (id: string, groupId?: string): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...(groupId === undefined ? {} : { groupId }),
});

const item = (
  id: string,
  layerId: string,
  start = "2027-02-01",
  end = "2027-02-05",
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate: start, endDateExclusive: end },
  title: id,
  version: 1,
});

const resource = (id: string): Resource => ({ id, name: id, type: "person" });

const codes = (result: ReturnType<typeof validatePlannerData>): string[] =>
  result.diagnostics.map((entry) => entry.code);

describe("RD-04 validation: canonical model", () => {
  it("accepts an empty input and returns an empty model", () => {
    const result = validatePlannerData({});
    expect(result.ok).toBe(true);
    expect(result.model).toEqual({ groups: [], layers: [], items: [], resources: [] });
  });

  it("drops a duplicate item and keeps the first", () => {
    const first = item("dup", "ribbon");
    const second = { ...item("dup", "ribbon"), title: "second" };
    const result = validatePlannerData({ layers: [layer("ribbon")], items: [first, second] });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("DUPLICATE_ID");
    expect(result.model.items).toHaveLength(1);
    expect(result.model.items[0]?.title).toBe("dup");
  });

  it("drops an item with an unknown layer but keeps a valid sibling", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      items: [item("bad", "missing"), item("good", "ribbon")],
    });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("UNKNOWN_REFERENCE");
    expect(result.diagnostics.find((entry) => entry.code === "UNKNOWN_REFERENCE")?.itemIds).toEqual(
      ["bad"],
    );
    expect(result.model.items.map((entry) => entry.id)).toEqual(["good"]);
  });
});

describe("RD-04-AC-06: validation of groups and cycles", () => {
  it("rejects a group cycle and every dependent entity while keeping valid data", () => {
    const result = validatePlannerData({
      groups: [group("a", "b"), group("b", "a"), group("ok")],
      layers: [layer("la", "a"), layer("lok", "ok")],
      items: [item("ia", "la"), item("iok", "lok")],
    });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("GROUP_CYCLE");
    expect(result.model.groups.map((entry) => entry.id)).toEqual(["ok"]);
    expect(result.model.layers.map((entry) => entry.id)).toEqual(["lok"]);
    expect(result.model.items.map((entry) => entry.id)).toEqual(["iok"]);
  });

  it("drops a layer with an unknown group", () => {
    const result = validatePlannerData({ groups: [], layers: [layer("layer", "missing")] });
    expect(codes(result)).toContain("UNKNOWN_REFERENCE");
    expect(result.model.layers).toHaveLength(0);
  });

  it("drops groups with invalid required fields", () => {
    const result = validatePlannerData({
      groups: [
        { id: "", name: "" },
        { id: "policy", name: "p", policy: { allowMove: "nope" } as never },
      ],
    });
    expect(codes(result).filter((code) => code === "INVALID_GROUP")).toHaveLength(2);
  });
});

describe("RD-04-AC-07: validation of item references", () => {
  it("drops an item whose assignment references an unknown resource", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      resources: [resource("r1")],
      items: [{ ...item("bad", "ribbon"), assignments: [{ resourceId: "missing" }] }],
    });
    expect(codes(result)).toContain("UNKNOWN_REFERENCE");
    expect(result.model.items).toHaveLength(0);
  });

  it("drops an invalid version and redacts the title and dates", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      items: [{ ...item("bad", "ribbon"), version: 0, title: "Secret" }],
    });
    const diagnostic = result.diagnostics.find((entry) => entry.code === "INVALID_VERSION");
    expect(diagnostic?.itemIds).toEqual(["bad"]);
    expect(diagnostic?.message).not.toContain("Secret");
    expect(diagnostic?.message).not.toContain("2027");
    expect(diagnostic?.periods).toBeUndefined();
  });

  it("rejects an annotation on a non-annotation channel", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      items: [{ ...item("ann", "ribbon"), kind: "annotation" }],
    });
    expect(codes(result)).toContain("INVALID_ANNOTATION");
  });

  it("merges annotations into the item namespace", () => {
    const annotation: PlannerItem = {
      ...item("holiday", "notes"),
      kind: "annotation",
      annotation: { label: "OH", background: "#ffd166", priority: 1 },
    };
    const result = validatePlannerData({
      layers: [{ ...layer("notes"), channel: "annotation" }],
      annotations: [annotation],
    });
    expect(result.ok).toBe(true);
    expect(result.model.items).toHaveLength(1);
    expect(result.model.items[0]?.period).toEqual(annotation.period);
  });

  it("RD-04-AC-10: preserves custom annotation styling and invents no holiday data", () => {
    const annotation: PlannerItem = {
      ...item("holiday", "notes"),
      kind: "annotation",
      title: "Company holiday",
      annotation: { label: "OH", background: "#ffd166", priority: 2 },
    };
    const result = validatePlannerData({
      layers: [{ ...layer("notes"), channel: "annotation" }],
      annotations: [annotation],
    });
    expect(result.model.items[0]?.annotation).toEqual({
      label: "OH",
      background: "#ffd166",
      priority: 2,
    });
    expect(result.model.items[0]?.title).toBe("Company holiday");
  });

  it("keeps a valid timed period and redacts an invalid one", () => {
    const valid = validatePlannerData({
      layers: [layer("ribbon")],
      items: [
        {
          ...item("timed", "ribbon"),
          period: {
            kind: "timed",
            start: "2027-01-31T23:30:00Z",
            endExclusive: "2027-02-01T01:00:00Z",
            timeZone: "UTC",
          },
        },
      ],
    });
    expect(valid.ok).toBe(true);
    expect(valid.model.items[0]?.period.kind).toBe("timed");

    const invalid = validatePlannerData({
      layers: [layer("ribbon")],
      items: [
        {
          ...item("timed-bad", "ribbon"),
          title: "Secret",
          period: {
            kind: "timed",
            start: "2027-01-31T23:30:00Z",
            endExclusive: "2027-02-01T01:00:00Z",
            timeZone: "Mars/Olympus",
          },
        },
      ],
    });
    const diagnostic = invalid.diagnostics.find((entry) => entry.itemIds?.includes("timed-bad"));
    expect(diagnostic?.code).toBe("INVALID_TIMEZONE");
    expect(diagnostic?.message).not.toContain("Mars");
    expect(diagnostic?.message).not.toContain("Secret");
    expect(diagnostic?.periods).toBeUndefined();
  });

  it("drops a reverse period without leaking the title or dates", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      items: [{ ...item("bad", "ribbon", "2027-02-07", "2027-01-28"), title: "Secret" }],
    });
    const diagnostic = result.diagnostics.find((entry) => entry.itemIds?.includes("bad"));
    expect(diagnostic?.code).toBe("INVALID_RANGE");
    expect(diagnostic?.message).not.toContain("2027");
    expect(diagnostic?.message).not.toContain("Secret");
    expect(diagnostic?.message).toContain("bad");
    expect(diagnostic?.periods).toBeUndefined();
  });

  it("rejects nested style values", () => {
    const result = validatePlannerData({
      layers: [layer("ribbon")],
      items: [{ ...item("bad", "ribbon"), style: { nested: { a: 1 } } as never }],
    });
    expect(codes(result)).toContain("INVALID_STYLE");
  });
});

describe("RD-04 validation: resources and layers", () => {
  it("rejects an invalid resource time zone", () => {
    const result = validatePlannerData({
      resources: [{ ...resource("r1"), timeZone: "Mars/Olympus" }],
    });
    expect(codes(result)).toContain("INVALID_TIMEZONE");
    expect(result.diagnostics[0]?.resourceIds).toEqual(["r1"]);
    expect(result.model.resources).toHaveLength(0);
  });

  it("rejects malformed layers, duplicates and channel pairing", () => {
    const result = validatePlannerData({
      groups: [group("g1"), group("g1")],
      layers: [
        { ...layer("l1"), channel: "nope" as never },
        { ...layer("l2"), opacity: 2 },
        { ...layer("l3"), pattern: "stripes" as never },
        layer("l4"),
        layer("l4"),
        { ...layer("l5"), channel: "annotation" },
      ],
      resources: [resource("r1"), resource("r1")],
      items: [{ ...item("i1", "l1"), kind: "activity" }, item("i2", "l5")],
    });
    expect(codes(result)).toEqual(
      expect.arrayContaining(["DUPLICATE_ID", "INVALID_LAYER", "INVALID_ANNOTATION"]),
    );
    expect(result.model.layers.map((entry) => entry.id)).toEqual(["l4", "l5"]);
    expect(result.model.resources.map((entry) => entry.id)).toEqual(["r1"]);
  });
});

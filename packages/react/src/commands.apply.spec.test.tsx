import type { PlannerItem } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { commandStillCurrent } from "./commands/apply.js";

const item = (id: string, version: number): PlannerItem => ({
  id,
  kind: "activity",
  layerId: "ribbon",
  period: { kind: "all-day", startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
  title: id,
  version,
});

describe("RD-08 stale apply guard", () => {
  it("reports a move as stale when the affected item changed", () => {
    const command = {
      type: "move" as const,
      itemId: "a",
      proposedPeriod: {
        kind: "all-day" as const,
        startDate: "2016-01-11",
        endDateExclusive: "2016-01-15",
      },
      expectedVersion: 1,
    };
    expect(commandStillCurrent([item("a", 2)], command)).toBe(false);
    expect(commandStillCurrent([item("a", 1)], command)).toBe(true);
  });

  it("reports a delete as stale when the affected item is missing", () => {
    const command = { type: "delete" as const, itemId: "a", expectedVersion: 1 };
    expect(commandStillCurrent([], command)).toBe(false);
    expect(commandStillCurrent([item("a", 2)], command)).toBe(false);
  });

  it("reports a paint as stale when an expected source changed", () => {
    const command = {
      type: "paint" as const,
      layerId: "highlight",
      period: { kind: "all-day" as const, startDate: "2016-01-04", endDateExclusive: "2016-01-08" },
      operation: "union" as const,
      defaults: { kind: "highlight" as const },
      expectedVersions: { a: 1 },
    };
    expect(commandStillCurrent([item("a", 2)], command)).toBe(false);
    expect(commandStillCurrent([item("a", 1)], command)).toBe(true);
  });

  it("reports a create as stale when the ID already exists", () => {
    const command = {
      type: "create" as const,
      item: item("a", 1),
    };
    expect(commandStillCurrent([item("a", 1)], command)).toBe(false);
    expect(commandStillCurrent([], command)).toBe(true);
  });
});

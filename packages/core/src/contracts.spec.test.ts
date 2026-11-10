import { describe, expect, it } from "vitest";
import type { PlannerSelection } from "./contracts";
import { emptySelection, selectionItemIds } from "./model/selection";

describe("RD-04 shared selection contracts", () => {
  it("creates an empty selection", () => {
    expect(emptySelection()).toEqual({ dates: [], items: [] });
  });

  it("deduplicates item IDs in first-seen order", () => {
    const selection: PlannerSelection = { dates: [], items: ["b", "a", "b", "c", "a"] };
    expect(selectionItemIds(selection)).toEqual(["b", "a", "c"]);
    expect(selectionItemIds(undefined)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { emptySelection, selectionItemIds } from "./selection";

describe("selection helpers", () => {
  it("returns fresh arrays on every empty selection", () => {
    const first = emptySelection();
    const second = emptySelection();
    first.items.push("x");
    expect(second.items).toEqual([]);
  });

  it("does not mutate the input selection", () => {
    const selection = { dates: [], items: ["b", "a", "b"] };
    expect(selectionItemIds(selection)).toEqual(["b", "a"]);
    expect(selection.items).toEqual(["b", "a", "b"]);
  });
});

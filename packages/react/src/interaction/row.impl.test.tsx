import { buildClassicYearLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { rowEdgeDate, rowForDate } from "./row.js";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout failed");
  return result.layout;
})();

describe("month row internals", () => {
  it("treats the exclusive row end as outside the row", () => {
    expect(rowForDate(layout, "2027-02-28")?.rowId).toBe("2027-02");
    expect(rowForDate(layout, "2027-03-01")?.rowId).toBe("2027-03");
  });

  it("returns undefined for a row with every date disabled", () => {
    expect(rowEdgeDate(layout, "2027-02-15", "end", () => true)).toBeUndefined();
  });

  it("returns undefined for a date outside the window", () => {
    expect(rowEdgeDate(layout, "2030-01-01", "start", () => false)).toBeUndefined();
  });
});

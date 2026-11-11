import { buildClassicYearLayout } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { rowEdgeDate, rowForDate } from "./row.js";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout failed");
  return result.layout;
})();

describe("month row bounds", () => {
  it("finds the row that contains a date", () => {
    expect(rowForDate(layout, "2027-02-15")?.rowId).toBe("2027-02");
    expect(rowForDate(layout, "2028-06-01")).toBeUndefined();
  });

  it("returns the first and last enabled date in a row", () => {
    const start = rowEdgeDate(layout, "2027-02-15", "start", () => false);
    const end = rowEdgeDate(layout, "2027-02-15", "end", () => false);
    expect(start).toBe("2027-02-01");
    expect(end).toBe("2027-02-28");
  });

  it("skips disabled edge dates inward", () => {
    const start = rowEdgeDate(
      layout,
      "2027-02-15",
      "start",
      (date) => date === "2027-02-01" || date === "2027-02-02",
    );
    const end = rowEdgeDate(
      layout,
      "2027-02-15",
      "end",
      (date) => date === "2027-02-28" || date === "2027-02-27",
    );
    expect(start).toBe("2027-02-03");
    expect(end).toBe("2027-02-26");
  });

  it("returns undefined when every edge candidate is disabled", () => {
    const start = rowEdgeDate(layout, "2027-02-15", "start", () => true);
    expect(start).toBeUndefined();
  });
});

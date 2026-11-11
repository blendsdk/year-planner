import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import { dateCellAccessibleName, itemAccessibleName, selectedDateSet } from "./a11y.js";

const layer: PlannerLayer = {
  id: "plain",
  name: "Plain",
  channel: "ribbon",
  color: "#1d4e89",
};

const bare: PlannerItem = {
  id: "bare",
  kind: "activity",
  layerId: "plain",
  period: { kind: "all-day", startDate: "2027-01-01", endDateExclusive: "2027-01-02" },
  version: 1,
};

describe("accessibility name edge cases", () => {
  it("falls back to the item id and layer name", () => {
    const name = itemAccessibleName({
      item: bare,
      layer,
      periodLabel: "Jan 1, 2027",
      visibleLabel: "bare",
      selected: false,
      clipped: false,
    });
    expect(name).toBe("bare, Jan 1, 2027, layer Plain, not selected");
  });

  it("omits the pattern for solid layers and keeps a timed period", () => {
    const name = itemAccessibleName({
      item: {
        ...bare,
        period: {
          kind: "timed",
          start: "2027-01-01T08:00:00Z",
          endExclusive: "2027-01-01T10:00:00Z",
          timeZone: "UTC",
        },
      },
      layer: { ...layer, pattern: "solid" },
      periodLabel: "Jan 1, 2027, 8:00 - 10:00 AM",
      visibleLabel: "bare",
      selected: true,
      clipped: false,
    });
    expect(name).not.toContain("pattern");
    expect(name).toContain("8:00");
    expect(name).toContain("selected");
  });

  it("does not invent a title when only an annotation label exists", () => {
    const name = itemAccessibleName({
      item: {
        ...bare,
        kind: "annotation",
        annotation: { label: "OH" },
      },
      layer: { ...layer, channel: "annotation", pattern: "dots" },
      periodLabel: "Jan 1, 2027",
      visibleLabel: "OH",
      selected: false,
      clipped: true,
    });
    expect(name).toBe(
      "OH, Jan 1, 2027, layer Plain, dots pattern, not selected, partially visible",
    );
  });

  it("keeps markup as plain text in names", () => {
    const name = dateCellAccessibleName({
      date: "2027-01-01",
      formattedDate: "<script>alert(1)</script>",
      itemCount: 1,
      selected: false,
    });
    expect(name).toContain("<script>");
    expect(name).not.toContain("&lt;");
  });

  it("ignores reversed ranges", () => {
    expect(
      selectedDateSet([{ startDate: "2027-02-05", endDateExclusive: "2027-02-01" }]).size,
    ).toBe(0);
  });
});

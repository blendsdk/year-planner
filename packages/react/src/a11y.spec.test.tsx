import type { PlannerItem, PlannerLayer, PlannerSelection } from "@blendsdk/year-planner-core";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  dateCellAccessibleName,
  itemAccessibleName,
  readableTextColor,
  selectedDateSet,
  selectionSummary,
} from "./a11y.js";
import { yearPlannerPresets } from "./theme.js";

const layer: PlannerLayer = {
  id: "bookings",
  name: "Bookings",
  channel: "ribbon",
  label: "B",
  pattern: "hatch",
  color: "#1d4e89",
};

const item = (overrides: Partial<PlannerItem> = {}): PlannerItem => ({
  id: "booking",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
  title: "Winter booking",
  version: 1,
  ...overrides,
});

describe("accessibility names", () => {
  it("includes the date, visible item count, week, holiday and selection in a cell name", () => {
    const name = dateCellAccessibleName({
      date: "2027-01-04",
      formattedDate: "Jan 4, 2027",
      itemCount: 3,
      weekNumber: 1,
      meta: { holiday: true },
      selected: true,
    });
    expect(name).toBe("Jan 4, 2027, ISO week 1, 3 items, holiday, selected");
  });

  it("uses the singular item form and marks unavailable dates", () => {
    const name = dateCellAccessibleName({
      date: "2027-01-04",
      formattedDate: "Jan 4, 2027",
      itemCount: 1,
      meta: { label: "Pay day", disabled: true },
      selected: false,
    });
    expect(name).toBe("Jan 4, 2027, Pay day, 1 item, unavailable");
  });

  it("keeps the host cell name override", () => {
    const name = dateCellAccessibleName({
      date: "2027-01-04",
      formattedDate: "Jan 4, 2027",
      itemCount: 4,
      meta: { ariaLabel: "Pay day" },
      selected: true,
    });
    expect(name).toBe("Pay day");
  });

  it("describes a selected, clipped, patterned item with status", () => {
    const name = itemAccessibleName({
      item: item({ status: "confirmed" }),
      layer,
      periodLabel: "Jan 28, 2027 - Feb 6, 2027",
      visibleLabel: "Winter booking",
      selected: true,
      clipped: true,
    });
    expect(name).toBe(
      "Winter booking, Jan 28, 2027 - Feb 6, 2027, layer B, hatch pattern, status confirmed, selected, partially visible",
    );
  });

  it("keeps the annotation label and the title in an annotation name", () => {
    const name = itemAccessibleName({
      item: item({
        id: "holiday",
        kind: "annotation",
        title: "Holiday",
        annotation: { label: "OH" },
      }),
      layer: { ...layer, channel: "annotation", label: "Notes", pattern: "solid" },
      periodLabel: "Mar 9, 2027",
      visibleLabel: "OH",
      selected: false,
      clipped: false,
    });
    expect(name).toContain("OH");
    expect(name).toContain("Holiday");
    expect(name).toContain("not selected");
    expect(name).not.toContain("pattern");
  });
});

describe("selection helpers", () => {
  it("expands ranges into a date lookup", () => {
    const dates = selectedDateSet([
      { startDate: "2027-01-30", endDateExclusive: "2027-02-02" },
      { startDate: "2027-02-05", endDateExclusive: "2027-02-06" },
    ]);
    expect([...dates]).toEqual(["2027-01-30", "2027-01-31", "2027-02-01", "2027-02-05"]);
  });

  it("summarises a mixed selection and the cleared state", () => {
    const selection: PlannerSelection = {
      dates: [{ startDate: "2027-01-30", endDateExclusive: "2027-02-02" }],
      items: ["booking", "maintenance"],
    };
    expect(selectionSummary(selection)).toBe("Selection: 2 items, 3 days");
    expect(selectionSummary({ dates: [], items: [] })).toBe("Selection cleared");
  });

  it("treats a zero-day range as empty", () => {
    expect(
      selectedDateSet([{ startDate: "2027-02-01", endDateExclusive: "2027-02-01" }]).size,
    ).toBe(0);
    expect(
      selectionSummary({
        dates: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-01" }],
        items: [],
      }),
    ).toBe("Selection cleared");
  });
});

describe("contrast helpers", () => {
  const presets = Object.entries(yearPlannerPresets);

  it("gives every preset a 4.5:1 ribbon text colour", () => {
    for (const [name, theme] of presets) {
      const ribbon = String(theme.ribbon);
      const text = readableTextColor(ribbon, [
        String(theme.textPrimary),
        String(theme.textInverse),
      ]);
      expect(contrastRatio(text, ribbon), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives every preset a 3:1 focus ring and border on its surface", () => {
    for (const [name, theme] of presets) {
      expect(
        contrastRatio(String(theme.focusRing), String(theme.surface)),
        `${name} focus`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(String(theme.border), String(theme.surface)),
        `${name} border`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("picks the readable candidate for a light and a dark ribbon", () => {
    const blue = yearPlannerPresets["classic-blue"];
    expect(
      readableTextColor(String(blue.ribbon), [String(blue.textPrimary), String(blue.textInverse)]),
    ).toBe("#1b2329");
    const modern = yearPlannerPresets.modern;
    expect(
      readableTextColor(String(modern.ribbon), [
        String(modern.textPrimary),
        String(modern.textInverse),
      ]),
    ).toBe("#ffffff");
  });

  it("falls back to the first candidate for non-hex colours", () => {
    expect(readableTextColor("var(--brand)", ["#111111", "#ffffff"])).toBe("#111111");
  });

  it("considers a light candidate for a dark host layer", () => {
    expect(readableTextColor("#1d4e89", ["#24251d", "#24251d", "#ffffff"])).toBe("#ffffff");
  });
});

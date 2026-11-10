import { describe, expect, it } from "vitest";
import { buildClassicYearLayout } from "./layout/classic-year";
import type { PlannerDataInput } from "./model/types";
import { validatePlannerData } from "./model/validation";
import { createInitialVisibility, visibilityReducer } from "./model/visibility";
import { buildRibbonLayout } from "./ribbon/fragments";
import { createRibbonHitIndex } from "./ribbon/hit-index";
import { planRibbonPrint } from "./ribbon/print";

const data: PlannerDataInput = {
  groups: [{ id: "ops", name: "Operations" }],
  layers: [
    { id: "bookings", name: "Bookings", groupId: "ops", channel: "ribbon", color: "#1d4e89" },
    { id: "notes", name: "Notes", channel: "annotation", color: "#ffd166" },
  ],
  resources: [{ id: "alice", name: "Alice", type: "person" }],
  items: [
    {
      id: "booking",
      kind: "activity",
      layerId: "bookings",
      period: { kind: "all-day", startDate: "2027-01-15", endDateExclusive: "2027-03-15" },
      title: "Booking",
      version: 1,
      assignments: [{ resourceId: "alice" }],
    },
    {
      id: "broken",
      kind: "activity",
      layerId: "missing",
      period: { kind: "all-day", startDate: "2027-01-15", endDateExclusive: "2027-01-20" },
      title: "Broken",
      version: 1,
    },
  ],
  annotations: [
    {
      id: "holiday",
      kind: "annotation",
      layerId: "notes",
      period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
      title: "Holiday",
      version: 1,
      annotation: { label: "OH", background: "#ffd166" },
    },
  ],
};

describe("M2 integration: validate → visibility → ribbons → print", () => {
  it.each([
    [12, 1],
    [24, 2],
    [36, 3],
  ])("plans %i months as %i A3 page(s)", (months, pages) => {
    const layout = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: months },
    });
    if (!layout.ok) throw new Error("layout");
    const validated = validatePlannerData(data);
    expect(validated.ok).toBe(false);
    expect(validated.model.items.map((entry) => entry.id)).toEqual(["booking", "holiday"]);
    expect(validated.model.items.find((entry) => entry.id === "broken")).toBeUndefined();

    const visibility = createInitialVisibility(validated.model);
    const ribbons = buildRibbonLayout(layout.layout, {
      model: validated.model,
      visibility,
    });
    expect(ribbons.rows).toHaveLength(months);
    expect(ribbons.fragments.filter((fragment) => fragment.itemId === "booking")).toHaveLength(3);
    expect(ribbons.fragments.find((fragment) => fragment.itemId === "holiday")?.channel).toBe(
      "annotation",
    );
    const index = createRibbonHitIndex(ribbons);
    expect(index.byItemId.get("booking")).toHaveLength(3);

    const print = planRibbonPrint(ribbons);
    if (!print.ok) throw new Error("print");
    expect(print.plan.pages).toHaveLength(pages);
    expect(print.plan.pages.flatMap((page) => page.rows)).toHaveLength(months);
  });

  it("removes a hidden group from fragments and page content", () => {
    const layout = buildClassicYearLayout({
      range: { start: { year: 2027, month: 0 }, monthCount: 12 },
    });
    if (!layout.ok) throw new Error("layout");
    const validated = validatePlannerData(data);
    const context = {
      model: validated.model,
      visibility: createInitialVisibility(validated.model),
    };
    const hidden = visibilityReducer(context, context.visibility, {
      type: "toggleGroup",
      groupId: "ops",
    });
    const ribbons = buildRibbonLayout(layout.layout, {
      model: validated.model,
      visibility: hidden,
    });
    expect(ribbons.fragments.some((fragment) => fragment.itemId === "booking")).toBe(false);
    expect(ribbons.fragments.some((fragment) => fragment.itemId === "holiday")).toBe(true);
    expect(validated.model.items).toHaveLength(2);
  });
});

import type { PlannerDataInput } from "@blendsdk/year-planner-core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

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
      period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
      title: "Booking",
      version: 1,
      assignments: [{ resourceId: "alice" }],
    },
    {
      id: "broken",
      kind: "activity",
      layerId: "missing",
      period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
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
      annotation: { label: "OH" },
    },
  ],
};

describe("RD-06 integration: validated data to rendered planner", () => {
  it.each([
    [14, 1],
    [24, 2],
    [36, 3],
  ])("renders and prints a %i-month window on %i page(s)", (months, pageCount) => {
    const { container } = render(
      <YearPlanner
        range={{ start: { year: 2027, month: 0 }, monthCount: months }}
        groups={data.groups ?? []}
        layers={data.layers ?? []}
        resources={data.resources ?? []}
        items={data.items ?? []}
        annotations={data.annotations ?? []}
        defaultSelection={{ dates: [], items: ["booking"] }}
      />,
    );
    expect(
      container.querySelectorAll('[data-yp-part="item-fragment"][data-item-id="booking"]'),
    ).toHaveLength(2);
    expect(container.querySelector('[data-item-id="broken"]')).toBeNull();
    expect(container.querySelector('[data-item-id="holiday"]')?.textContent).toContain("OH");
    expect(screen.getByRole("heading", { name: "Booking" })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-yp-part="print-page"]')).toHaveLength(pageCount);
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(months);
  });
});

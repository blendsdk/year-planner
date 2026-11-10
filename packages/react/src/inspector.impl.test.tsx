import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it } from "vitest";
import type { YearPlannerHandle } from "./types";
import { YearPlanner } from "./YearPlanner";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", groupId: "ops", channel: "ribbon", color: "#1d4e89" },
];

const item: PlannerItem = {
  id: "booking",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2016-02-01", endDateExclusive: "2016-02-04" },
  title: "Booking",
  version: 1,
};

const groups = [
  { id: "ops", name: "Operations" },
  { id: "logistics", name: "Logistics", parentGroupId: "ops" },
];

describe("inspector implementation", () => {
  it("shows the group path and uses the planner-owned close button", () => {
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        groups={groups}
        layers={[{ ...layers[0], groupId: "logistics" } as PlannerLayer]}
        items={[item]}
        defaultSelection={{ dates: [], items: ["booking"] }}
      />,
    );
    expect(screen.getByText("Operations / Logistics / Bookings")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(screen.queryByRole("complementary", { name: "Planner inspector" })).toBeNull();
    act(() => ref.current?.openInspector());
    expect(screen.getByRole("complementary", { name: "Planner inspector" })).toBeInTheDocument();
  });

  it("disables actions in a read-only planner", () => {
    render(
      <YearPlanner
        year={2016}
        groups={groups}
        layers={layers}
        items={[item]}
        defaultSelection={{ dates: [], items: ["booking"] }}
        readOnly
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move later" })).toBeDisabled();
  });

  it("shows a policy note when deletion is denied", () => {
    render(
      <YearPlanner
        year={2016}
        groups={groups}
        layers={[{ ...(layers[0] as PlannerLayer), policy: { allowDelete: false } }]}
        items={[item]}
        defaultSelection={{ dates: [], items: ["booking"] }}
      />,
    );
    expect(screen.getByText("Deletion is disabled by the layer policy.")).toBeInTheDocument();
  });

  it("routes a custom inspector action through the command pipeline", () => {
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        groups={groups}
        layers={layers}
        items={[item]}
        renderInspector={(context) => (
          <button
            type="button"
            onClick={() =>
              context.actions.requestCommand({
                type: "delete",
                itemId: "booking",
                expectedVersion: 1,
              })
            }
          >
            Remove
          </button>
        )}
        interaction={{ confirmChange: () => true }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Inspector")).toBeInTheDocument();
  });
});

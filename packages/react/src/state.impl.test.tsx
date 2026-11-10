import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { render } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle } from "./types";
import { YearPlanner } from "./YearPlanner";

const layers: PlannerLayer[] = [
  { id: "a", name: "A", channel: "ribbon", color: "#123456" },
  { id: "b", name: "B", channel: "ribbon", color: "#654321" },
];

const items: PlannerItem[] = [
  {
    id: "alpha",
    kind: "activity",
    layerId: "a",
    period: { kind: "all-day", startDate: "2016-02-01", endDateExclusive: "2016-02-04" },
    title: "Alpha",
    version: 1,
  },
  {
    id: "beta",
    kind: "activity",
    layerId: "b",
    period: { kind: "all-day", startDate: "2016-02-01", endDateExclusive: "2016-02-04" },
    title: "Beta",
    version: 1,
  },
];

describe("planner state implementation", () => {
  it("composes layer and search filters and updates through the handle", () => {
    const ref = createRef<YearPlannerHandle>();
    const onFilterChange = vi.fn();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={layers}
        items={items}
        defaultFilter={{ layerIds: ["a"], search: "alp" }}
        onFilterChange={onFilterChange}
      />,
    );
    expect(container.querySelectorAll('[data-yp-part="item-fragment"]')).toHaveLength(1);
    act(() => ref.current?.setFilter({ layerIds: ["a", "b"], search: "bet" }));
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('[data-yp-part="item-fragment"]')).toHaveLength(1);
  });

  it("does not change controlled visibility locally but emits the next state", () => {
    const ref = createRef<YearPlannerHandle>();
    const onVisibilityChange = vi.fn();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={[layers[0] as PlannerLayer]}
        items={[items[0] as PlannerItem]}
        visibility={{ hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: [] }}
        onVisibilityChange={onVisibilityChange}
      />,
    );
    act(() => ref.current?.hideItem("alpha"));
    expect(onVisibilityChange).toHaveBeenCalledWith(
      expect.objectContaining({ hiddenItemIds: ["alpha"] }),
    );
    expect(container.querySelector('[data-yp-part="item-fragment"]')).not.toBeNull();
  });

  it("seeds selection defaults only in uncontrolled mode", () => {
    const { container } = render(
      <YearPlanner
        year={2016}
        layers={[layers[0] as PlannerLayer]}
        items={[items[0] as PlannerItem]}
        defaultSelection={{ dates: [], items: ["alpha"] }}
      />,
    );
    expect(container.querySelector('[data-item-id="alpha"] [role="button"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

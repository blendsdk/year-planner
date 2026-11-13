import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { act, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import type { YearPlannerHandle } from "./types.js";
import { YearPlanner } from "./YearPlanner.js";

const layer: PlannerLayer = {
  id: "bookings",
  name: "Bookings",
  channel: "ribbon",
  color: "#1d4e89",
};

function item(id: string, startDate: string, title = id): PlannerItem {
  return {
    id,
    kind: "activity",
    layerId: "bookings",
    period: { kind: "all-day", startDate, endDateExclusive: "2027-04-01" },
    title,
    version: 1,
  };
}

describe("item list internals", () => {
  it("orders entries by period start and shows a multi-fragment item once", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer]}
        defaultItems={[
          item("later", "2027-03-01", "Later"),
          item("spanning", "2027-01-28", "Spanning"),
        ]}
      />,
    );
    const entries = container.querySelectorAll('[data-yp-part="item-list-entry"]');
    expect(entries).toHaveLength(2);
    expect(entries[0]?.getAttribute("data-yp-item-id")).toBe("spanning");
    expect(entries[1]?.getAttribute("data-yp-item-id")).toBe("later");
  });

  it("starts collapsed above the entry threshold and expands on request", () => {
    const items = Array.from({ length: 120 }, (_, index) =>
      item(`bulk-${index}`, "2027-02-01", `Bulk ${index}`),
    );
    const { container } = render(<YearPlanner year={2027} layers={[layer]} defaultItems={items} />);
    const list = container.querySelector('[data-yp-part="item-list"]') as HTMLElement;
    expect(list.textContent).toContain("All visible items (120)");
    expect(list.querySelectorAll('[data-yp-part="item-list-entry"]')).toHaveLength(0);
    const showAll = list.querySelector('[data-yp-part="item-list-show-all"]') as HTMLButtonElement;
    expect(showAll.textContent).toContain("Show all 120 items");
    act(() => showAll.click());
    expect(list.querySelectorAll('[data-yp-part="item-list-entry"]')).toHaveLength(120);
  });

  it("shows an empty state when every item is hidden", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[{ ...layer, defaultVisible: false }]}
        defaultItems={[item("hidden", "2027-02-01", "Hidden")]}
      />,
    );
    const list = container.querySelector('[data-yp-part="item-list"]') as HTMLElement;
    expect(list.textContent).toContain("All visible items (0)");
    expect(list.textContent).toContain("No visible items");
    expect(list.querySelectorAll('[data-yp-part="item-list-entry"]')).toHaveLength(0);
  });

  it("prunes a selected item when its layer becomes hidden", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer]}
        defaultItems={[item("selected", "2027-02-01", "Selected")]}
        defaultSelection={{ dates: [], items: ["selected"] }}
        visibility={{ hiddenGroupIds: [], hiddenLayerIds: ["bookings"], hiddenItemIds: [] }}
      />,
    );
    expect(container.querySelector('[data-item-id="selected"]')).toBeNull();
    expect(container.querySelector('[data-yp-item-id="selected"]')).toBeNull();
    expect(container.textContent).not.toContain("Selected");
  });

  it("moves focus to a nearby date and announces it when the focused item is hidden", async () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2027}
        layers={[layer]}
        defaultItems={[item("focused", "2027-02-01", "Focused")]}
        defaultSelection={{ dates: [], items: ["focused"], focusItemId: "focused" }}
      />,
    );
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="focused"]',
    ) as HTMLElement;
    act(() => proxy.focus());
    expect(proxy).toHaveFocus();
    await act(async () => ref.current?.hideItem("focused"));
    await waitFor(() => expect(container.querySelector('[data-item-id="focused"]')).toBeNull());
    expect(container.querySelector('[data-yp-item-id="focused"]')).toBeNull();
    await waitFor(() =>
      expect(container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
    expect(container.querySelector('[role="gridcell"][tabindex="0"]')).not.toBeNull();
  });

  it("falls back and announces when the focused item leaves the rendered window", async () => {
    const ref = createRef<YearPlannerHandle>();
    const view = render(
      <YearPlanner
        ref={ref}
        year={2027}
        layers={[layer]}
        defaultItems={[item("focused", "2027-02-01", "Focused")]}
      />,
    );
    const proxy = view.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="focused"]',
    ) as HTMLElement;
    act(() => proxy.focus());
    view.rerender(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={[layer]}
        defaultItems={[item("focused", "2027-02-01", "Focused")]}
      />,
    );
    await waitFor(() =>
      expect(view.container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
    expect(view.container.querySelector('[role="gridcell"][tabindex="0"]')).not.toBeNull();
  });

  it("moves focus off a date that becomes disabled at runtime", async () => {
    const view = render(
      <YearPlanner
        year={2027}
        layers={[layer]}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-01" }}
      />,
    );
    view.rerender(
      <YearPlanner
        year={2027}
        layers={[layer]}
        defaultSelection={{ dates: [], items: [], focusDate: "2027-02-01" }}
        getDateMeta={(date) => (date === "2027-02-01" ? { disabled: true } : undefined)}
      />,
    );
    await waitFor(() =>
      expect(view.container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
    expect(view.container.querySelector('[role="gridcell"][tabindex="0"]')).not.toHaveAttribute(
      "data-date",
      "2027-02-01",
    );
  });

  it("returns undefined for a date outside the layout", () => {
    const { container } = render(<YearPlanner year={2027} layers={[layer]} />);
    expect(container.querySelector('[data-date="2031-01-01"]')).toBeNull();
  });
});

import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

const layer = (id: string, overrides: Partial<PlannerLayer> = {}): PlannerLayer => ({
  id,
  name: id,
  channel: "ribbon",
  color: "#1d4e89",
  ...overrides,
});

const item = (
  id: string,
  layerId: string,
  startDate: string,
  endDateExclusive: string,
  overrides: Partial<PlannerItem> = {},
): PlannerItem => ({
  id,
  kind: "activity",
  layerId,
  period: { kind: "all-day", startDate, endDateExclusive },
  title: id,
  version: 1,
  ...overrides,
});

describe("item rendering internals", () => {
  it("does not render an overflow button when lanes fit", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("one", "ribbon", "2027-02-01", "2027-02-04")]}
      />,
    );
    expect(container.querySelector('[data-yp-part="overflow-button"]')).toBeNull();
  });

  it("orders annotation badges by priority without touching other channels", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("notes", { channel: "annotation" })]}
        items={[
          item("low", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { label: "L", priority: 1 },
          }),
          item("high", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { label: "H", priority: 5 },
          }),
        ]}
      />,
    );
    const high = container.querySelector('[data-item-id="high"]') as HTMLElement;
    const low = container.querySelector('[data-item-id="low"]') as HTMLElement;
    expect(high.style.zIndex).toBe("9");
    expect(low.style.zIndex).toBe("5");
  });

  it("keeps a disabled date out of selection callbacks", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <YearPlanner
        year={2016}
        getDateMeta={(date) => (date === "2016-01-05" ? { disabled: true } : undefined)}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(container.querySelector('[data-date="2016-01-05"]') as Element);
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-date="2016-01-04"]') as Element);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it("keeps the date accessible name when renderCell adds content", () => {
    const { container } = render(
      <YearPlanner
        year={2016}
        getDateMeta={(date) => (date === "2016-01-05" ? { ariaLabel: "Custom name" } : undefined)}
        renderCell={() => <span>extra</span>}
      />,
    );
    const cell = container.querySelector('[data-date="2016-01-05"]');
    expect(cell).toHaveAttribute("aria-label", "Custom name");
    expect(cell).toHaveAttribute("role", "gridcell");
  });

  it("passes the month row and visible items to renderOverflow", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={items}
        display={{ compactMaxLanes: 2 }}
        renderOverflow={(context) => (
          <span data-testid="context">
            {context.row.rowId}:{context.hiddenCount}:{context.items.length}
          </span>
        )}
      />,
    );
    fireEvent.click(container.querySelector('[data-yp-part="overflow-button"]') as Element);
    expect(container.querySelector('[data-testid="context"]')).toHaveTextContent("2027-02:4:4");
  });
});

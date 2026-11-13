import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlannerContextMenuRequest } from "./types.js";
import { YearPlanner } from "./YearPlanner.js";

const layer: PlannerLayer = {
  id: "bookings",
  name: "Bookings",
  channel: "ribbon",
  color: "#1d4e89",
};

const item: PlannerItem = {
  id: "booking",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
  title: "Booking",
  version: 1,
};

function renderPlanner(handler: (request: PlannerContextMenuRequest) => void) {
  return render(
    <YearPlanner
      year={2027}
      layers={[layer]}
      defaultItems={[item]}
      activeLayerId="bookings"
      onContextMenuRequest={handler}
    />,
  );
}

describe("context-menu internals", () => {
  it("does not leave a gesture active after an item request", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="booking"]',
    ) as HTMLElement;
    fireEvent.contextMenu(proxy);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".yp-preview-layer")).toBeNull();
    expect(container.querySelector('[data-yp-part="marquee"]')).toBeNull();
  });

  it("restores focus to the originating cell", () => {
    let request: PlannerContextMenuRequest | undefined;
    const { container } = renderPlanner((next) => {
      request = next;
    });
    const cell = container.querySelector(
      '[role="gridcell"][data-date="2027-02-02"]',
    ) as HTMLElement;
    fireEvent.contextMenu(cell);
    const root = container.querySelector(".yp-root") as HTMLElement;
    root.focus();
    request?.restoreFocus();
    expect(document.activeElement).toBe(cell);
  });

  it("ignores the grid header and the root chrome", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const heading = container.querySelector(".yp-heading") as HTMLElement;
    expect(fireEvent.contextMenu(heading)).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not raise a second request for a held keyboard flag", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const cell = container.querySelector(
      '[role="gridcell"][data-date="2027-02-02"]',
    ) as HTMLElement;
    cell.focus();
    fireEvent.keyDown(cell, { key: "F10", shiftKey: true });
    fireEvent.contextMenu(cell);
    fireEvent.contextMenu(cell);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

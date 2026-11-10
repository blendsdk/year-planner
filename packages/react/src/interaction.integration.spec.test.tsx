import {
  addDays,
  buildClassicYearLayout,
  type PlannerSelection,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner.js";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout failed");
  return result.layout;
})();

function cellPoint(date: string): { clientX: number; clientY: number } {
  const rowIndex = layout.rows.findIndex(
    (row) => date >= row.firstDate && date < row.endDateExclusive,
  );
  const row = layout.rows[rowIndex];
  const column = row?.columns.find((entry) => entry.date === date);
  if (!row || !column) throw new Error(`missing cell ${date}`);
  return {
    clientX: layout.monthBandWidth + column.x + column.width / 2,
    clientY: layout.headerHeight + rowIndex * layout.rowHeight + layout.rowHeight / 2,
  };
}

function setup(overrides: Parameters<typeof YearPlanner>[0] = {}) {
  const onSelectionChange = vi.fn();
  const view = render(
    <YearPlanner
      year={2027}
      layers={[{ id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89" }]}
      onSelectionChange={onSelectionChange}
      {...overrides}
    />,
  );
  const viewport = view.container.querySelector('[data-yp-part="viewport"]') as HTMLElement;
  const grid = view.container.querySelector('[data-yp-part="grid"]') as HTMLElement;
  Object.defineProperty(viewport, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: 1200,
      height: 800,
      right: 1200,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    }),
  });
  Object.defineProperty(grid, "setPointerCapture", { configurable: true, value: vi.fn() });
  Object.defineProperty(grid, "releasePointerCapture", { configurable: true, value: vi.fn() });
  return { onSelectionChange, viewport, grid, ...view };
}

function pointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  point: { clientX: number; clientY: number },
) {
  const payload = {
    ...point,
    pointerId: 1,
    pointerType: "mouse",
    button: type === "pointerdown" ? 0 : undefined,
  };
  if (type === "pointerdown") fireEvent.pointerDown(element, payload);
  else if (type === "pointermove") fireEvent.pointerMove(element, payload);
  else fireEvent.pointerUp(element, payload);
}

const selectedRanges = (container: HTMLElement, date: string) => {
  const cell = container.querySelector(`[data-date="${date}"]`) as HTMLElement;
  return cell;
};

describe("RD-07 controlled and uncontrolled selection", () => {
  it("emits one controlled click without mutating the host selection", () => {
    const controlled: PlannerSelection = { dates: [], items: [] };
    const harness = setup({ selection: controlled });
    fireEvent.click(selectedRanges(harness.container, "2027-02-01"));
    expect(harness.onSelectionChange).toHaveBeenCalledTimes(1);
    expect(harness.onSelectionChange.mock.calls[0]?.[0].dates).toEqual([
      { startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    ]);
    expect(controlled.dates).toEqual([]);
  });

  it("emits one controlled drag and keeps the host value authoritative", async () => {
    const controlled: PlannerSelection = { dates: [], items: [] };
    const harness = setup({ selection: controlled, interaction: { mode: "select" } });
    const cell = harness.container.querySelector('[data-date="2027-02-01"]') as Element;
    pointer(cell, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-03"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-03"));
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalledTimes(1));
    expect(harness.onSelectionChange.mock.calls[0]?.[0].dates).toEqual([
      { startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
    ]);
    expect(controlled.dates).toEqual([]);
    expect(harness.container.querySelectorAll('[data-yp-part="selection"]')).toHaveLength(0);
  });

  it("seeds defaultSelection once and then updates locally", async () => {
    const harness = setup({
      defaultSelection: {
        dates: [{ startDate: "2027-01-28", endDateExclusive: addDays("2027-01-28", 2) }],
        items: [],
      },
    });
    expect(harness.container.querySelectorAll('[data-yp-part="selection"]')).toHaveLength(1);
    fireEvent.click(selectedRanges(harness.container, "2027-02-01"));
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalledTimes(1));
    expect(harness.container.querySelectorAll('[data-yp-part="selection"]')).toHaveLength(1);
  });
});

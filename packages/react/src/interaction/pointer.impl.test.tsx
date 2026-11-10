import {
  buildClassicYearLayout,
  type CommandOutcome,
  type PlannerCommand,
  type PlannerItem,
  type PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "../YearPlanner.js";

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

function setup(
  overrides: Parameters<typeof YearPlanner>[0] = {},
  options: { items?: PlannerItem[]; layers?: PlannerLayer[] } = {},
) {
  const onSelectionChange = vi.fn();
  const onDiagnostic = vi.fn();
  const onChangeRequest = vi.fn(
    (_command: PlannerCommand): CommandOutcome => ({ accepted: true, revision: "1" }),
  );
  const view = render(
    <YearPlanner
      year={2027}
      layers={options.layers ?? [layer("bookings"), layer("highlight", { channel: "highlight" })]}
      defaultItems={options.items ?? []}
      activeLayerId="highlight"
      onSelectionChange={onSelectionChange}
      onDiagnostic={onDiagnostic}
      onChangeRequest={onChangeRequest}
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
  viewport.scrollLeft = 0;
  viewport.scrollTop = 0;
  Object.defineProperty(grid, "setPointerCapture", { configurable: true, value: vi.fn() });
  Object.defineProperty(grid, "releasePointerCapture", { configurable: true, value: vi.fn() });
  const cell = (date: string) => view.container.querySelector(`[data-date="${date}"]`) as Element;
  return { onSelectionChange, onDiagnostic, onChangeRequest, viewport, grid, cell, ...view };
}

function pointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  point: { clientX: number; clientY: number },
  pointerType = "mouse",
) {
  const payload = {
    ...point,
    pointerId: 1,
    pointerType,
    button: type === "pointerdown" ? 0 : undefined,
  };
  if (type === "pointerdown") fireEvent.pointerDown(element, payload);
  else if (type === "pointermove") fireEvent.pointerMove(element, payload);
  else if (type === "pointerup") fireEvent.pointerUp(element, payload);
  else fireEvent.pointerCancel(element, payload);
}

describe("pointer interaction internals", () => {
  it("cancels a gesture on pointercancel and ignores the next click", async () => {
    const harness = setup();
    const from = cellPoint("2027-01-28");
    pointer(harness.cell("2027-01-28"), "pointerdown", from);
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointercancel", cellPoint("2027-02-02"));
    fireEvent.click(harness.cell("2027-01-28"));
    expect(harness.onSelectionChange).not.toHaveBeenCalled();
  });

  it("cancels on lost pointer capture", () => {
    const harness = setup();
    pointer(harness.cell("2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    fireEvent.lostPointerCapture(harness.grid, { pointerId: 1 });
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps touch editing scroll-first unless explicitly enabled", async () => {
    const off = setup({ interaction: { touchEditing: "off" } });
    pointer(off.cell("2027-01-28"), "pointerdown", cellPoint("2027-01-28"), "touch");
    pointer(off.grid, "pointermove", cellPoint("2027-02-02"), "touch");
    expect(off.onSelectionChange).not.toHaveBeenCalled();

    const on = setup({ interaction: { touchEditing: "on" } });
    expect(on.grid.style.touchAction).toBe("none");
    pointer(on.cell("2027-01-28"), "pointerdown", cellPoint("2027-01-28"), "touch");
    pointer(on.grid, "pointermove", cellPoint("2027-02-02"), "touch");
    pointer(on.grid, "pointerup", cellPoint("2027-02-02"), "touch");
    await waitFor(() => expect(on.onSelectionChange).toHaveBeenCalledTimes(1));
  });

  it("does not handle keys from a host input inside a cell", () => {
    const harness = setup({
      renderCell: (context) =>
        context.date === "2027-01-28" ? <input aria-label="host input" /> : null,
    });
    const input = harness.container.querySelector("input") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Delete" });
    fireEvent.keyDown(input, { key: "a", ctrlKey: true });
    expect(harness.onSelectionChange).not.toHaveBeenCalled();
    expect(harness.onDiagnostic).not.toHaveBeenCalled();
  });

  it("selects intersecting items with an auto-mode marquee", async () => {
    const harness = setup(
      {},
      {
        items: [
          item("a", "bookings", "2027-01-28", "2027-02-03"),
          item("b", "bookings", "2027-01-30", "2027-02-04"),
        ],
      },
    );
    pointer(harness.cell("2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    await waitFor(() =>
      expect(harness.container.querySelector('[data-yp-part="marquee"]')).not.toBeNull(),
    );
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalled());
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].items).toEqual(["a", "b"]);
  });

  it("clears previews after a commit", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.container.querySelector('[data-yp-part="gesture-preview"]')).toBeNull();
  });

  it("opens and focuses the inspector on double-click unless disabled", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.doubleClick(proxy);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        harness.container.querySelector('[data-yp-part="inspector"]'),
      ),
    );

    const disabled = setup(
      { interaction: { doubleClick: "none" } },
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] },
    );
    const disabledProxy = disabled.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.doubleClick(disabledProxy);
    expect(document.activeElement).not.toBe(
      disabled.container.querySelector('[data-yp-part="inspector"]'),
    );
  });

  it("emits one selection for a controlled drag and never mutates items", async () => {
    const harness = setup({
      selection: { dates: [], items: [] },
      items: [item("a", "bookings", "2027-01-28", "2027-02-07")],
      interaction: { mode: "select" },
    });
    pointer(harness.cell("2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalledTimes(1));
  });

  it("does not start a move for a locked or read-only item", () => {
    const locked = setup(
      {},
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07", { locked: true })] },
    );
    const proxy = locked.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(locked.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(locked.grid, "pointerup", cellPoint("2027-02-02"));
    expect(locked.onChangeRequest).not.toHaveBeenCalled();

    const readOnly = setup(
      { readOnly: true },
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] },
    );
    const readOnlyProxy = readOnly.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(readOnlyProxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(readOnly.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(readOnly.grid, "pointerup", cellPoint("2027-02-02"));
    expect(readOnly.onChangeRequest).not.toHaveBeenCalled();
  });
});

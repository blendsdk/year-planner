import {
  buildClassicYearLayout,
  type CommandOutcome,
  type PlannerCommand,
  type PlannerItem,
  type PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle } from "../types.js";
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
  const ref = createRef<YearPlannerHandle>();
  const onSelectionChange = vi.fn();
  const onDiagnostic = vi.fn();
  const onChangeRequest = vi.fn(
    (_command: PlannerCommand): CommandOutcome => ({ accepted: true, revision: "1" }),
  );
  const view = render(
    <YearPlanner
      ref={ref}
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
  const cell = (date: string) =>
    view.container.querySelector(`[data-date="${date}"]`) as HTMLElement;
  return { ref, onSelectionChange, onDiagnostic, onChangeRequest, viewport, grid, cell, ...view };
}

function pointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  point: { clientX: number; clientY: number },
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {},
  pointerType = "mouse",
) {
  const payload = {
    ...point,
    pointerId: 1,
    pointerType,
    button: type === "pointerdown" ? 0 : undefined,
    ...modifiers,
  };
  if (type === "pointerdown") fireEvent.pointerDown(element, payload);
  else if (type === "pointermove") fireEvent.pointerMove(element, payload);
  else fireEvent.pointerUp(element, payload);
}

describe("RD-07 keyboard, focus and touch", () => {
  it("moves focus with arrows and skips disabled dates", () => {
    const harness = setup({
      getDateMeta: (date) => (date === "2027-02-02" ? { disabled: true } : undefined),
    });
    const first = harness.cell("2027-02-01");
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(harness.cell("2027-02-03")).toHaveAttribute("tabindex", "0");
    expect(harness.cell("2027-02-02")).toHaveAttribute("tabindex", "-1");
  });

  it("extends a date range with Shift+Arrow", async () => {
    const harness = setup();
    const first = harness.cell("2027-02-01");
    fireEvent.keyDown(first, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(harness.cell("2027-02-02"), { key: "ArrowRight", shiftKey: true });
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalled());
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].dates).toEqual([
      { startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
    ]);
  });

  it("toggles a date with Space and opens the inspector with Enter", () => {
    const harness = setup();
    fireEvent.keyDown(harness.cell("2027-02-01"), { key: " " });
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].dates).toEqual([
      { startDate: "2027-02-01", endDateExclusive: "2027-02-02" },
    ]);
    fireEvent.keyDown(harness.cell("2027-02-01"), { key: "Enter" });
    expect(harness.container.querySelector('[data-yp-part="inspector"]')).not.toBeNull();
  });

  it("clears selection with Escape when no gesture is active", () => {
    const harness = setup(
      { defaultSelection: { dates: [], items: ["a"] } },
      {
        items: [item("a", "bookings", "2027-02-01", "2027-02-03")],
      },
    );
    fireEvent.keyDown(harness.grid, { key: "Escape" });
    expect(harness.onSelectionChange).toHaveBeenCalled();
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0]).toEqual({
      dates: [],
      items: [],
    });
  });

  it("selects all visible items with Ctrl/Cmd+A", () => {
    const harness = setup(
      {},
      {
        items: [
          item("a", "bookings", "2027-02-01", "2027-02-03"),
          item("b", "bookings", "2027-02-02", "2027-02-04"),
        ],
      },
    );
    fireEvent.keyDown(harness.grid, { key: "a", ctrlKey: true });
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].items).toEqual(["a", "b"]);
  });

  it("deletes the focused item after confirmation", async () => {
    const harness = setup(
      { interaction: { confirmChange: () => true } },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.focus(proxy);
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "delete",
      itemId: "a",
      expectedVersion: 1,
    });
  });

  it("reports a no-target delete when several items are selected without focus", async () => {
    const harness = setup(
      { defaultSelection: { dates: [], items: ["a", "b"] } },
      {
        items: [
          item("a", "bookings", "2027-02-01", "2027-02-03"),
          item("b", "bookings", "2027-02-02", "2027-02-04"),
        ],
      },
    );
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("restores focus to the moved item after commit", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() =>
      expect(document.activeElement).toBe(
        harness.container.querySelector('[data-yp-part="item-proxy"][data-item-id="a"]'),
      ),
    );
  });

  it("prunes a hidden selected item and announces the focus fallback", async () => {
    const harness = setup(
      { defaultSelection: { dates: [], items: ["a"], focusItemId: "a" } },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    await act(async () => harness.ref.current?.hideItem("a"));
    await waitFor(() => expect(harness.container.querySelector('[data-item-id="a"]')).toBeNull());
    await waitFor(() =>
      expect(harness.container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
  });

  it("undoes and redoes uncontrolled commands and clears redo on a new edit", async () => {
    const harness = setup(
      { interaction: { confirmChange: () => true } },
      {
        items: [item("a", "bookings", "2027-02-01", "2027-02-03")],
      },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.focus(proxy);
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(harness.container.querySelector('[data-item-id="a"]')).toBeNull());
    await act(async () => harness.ref.current?.requestUndo());
    await waitFor(() =>
      expect(harness.container.querySelector('[data-item-id="a"]')).not.toBeNull(),
    );
    await act(async () => harness.ref.current?.requestRedo());
    await waitFor(() => expect(harness.container.querySelector('[data-item-id="a"]')).toBeNull());
  });

  it("rejects undo in controlled mode", async () => {
    const harness = setup({ items: [item("a", "bookings", "2027-02-01", "2027-02-03")] });
    await act(async () => harness.ref.current?.requestUndo());
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "UNDO_UNAVAILABLE" }),
      ),
    );
  });

  it("does not start a move for a timed item", async () => {
    const timed = item("timed", "bookings", "2027-02-01", "2027-02-03", {
      period: {
        kind: "timed",
        start: "2027-02-01T08:00:00Z",
        endExclusive: "2027-02-01T10:00:00Z",
        timeZone: "UTC",
      },
    });
    const harness = setup({}, { items: [timed] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="timed"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "TIMED_EDITING_UNSUPPORTED" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps touch editing scroll-first unless enabled", async () => {
    const off = setup({ interaction: { touchEditing: "off" } });
    expect(off.grid.style.touchAction).toBe("auto");
    pointer(off.cell("2027-02-01"), "pointerdown", cellPoint("2027-02-01"), {}, "touch");
    pointer(off.grid, "pointermove", cellPoint("2027-02-02"), {}, "touch");
    pointer(off.grid, "pointerup", cellPoint("2027-02-02"), {}, "touch");
    expect(off.onSelectionChange).not.toHaveBeenCalled();

    const auto = setup({ interaction: { touchEditing: "auto" } });
    expect(auto.grid.style.touchAction).toBe("auto");

    const on = setup({ interaction: { touchEditing: "on" } });
    expect(on.grid.style.touchAction).toBe("none");
    pointer(on.cell("2027-02-01"), "pointerdown", cellPoint("2027-02-01"), {}, "touch");
    pointer(on.grid, "pointermove", cellPoint("2027-02-02"), {}, "touch");
    pointer(on.grid, "pointerup", cellPoint("2027-02-02"), {}, "touch");
    await waitFor(() => expect(on.onSelectionChange).toHaveBeenCalledTimes(1));
  });

  it("focuses the inspector on double-click unless disabled", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] });
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
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    fireEvent.doubleClick(
      disabled.container.querySelector('[data-yp-part="item-proxy"][data-item-id="a"]') as Element,
    );
    expect(document.activeElement).not.toBe(
      disabled.container.querySelector('[data-yp-part="inspector"]'),
    );
  });

  it("deletes the DOM-focused item rather than a stale selection focus", async () => {
    const harness = setup(
      {
        defaultSelection: { dates: [], items: ["a"], focusItemId: "a", anchorItemId: "a" },
        interaction: { confirmChange: () => true },
      },
      {
        items: [
          item("a", "bookings", "2027-02-01", "2027-02-03"),
          item("b", "bookings", "2027-02-04", "2027-02-06"),
        ],
      },
    );
    const proxyB = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="b"]',
    ) as Element;
    fireEvent.focus(proxyB);
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "delete",
      itemId: "b",
    });
  });

  it("does not delete a stale item after focus moves to a date", async () => {
    const harness = setup(
      { interaction: { confirmChange: () => true } },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    fireEvent.focus(
      harness.container.querySelector('[data-yp-part="item-proxy"][data-item-id="a"]') as Element,
    );
    fireEvent.focus(harness.cell("2027-03-01"));
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("announces focus fallback after deleting the focused unselected item", async () => {
    const harness = setup(
      { interaction: { confirmChange: () => true } },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    fireEvent.focus(
      harness.container.querySelector('[data-yp-part="item-proxy"][data-item-id="a"]') as Element,
    );
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() =>
      expect(harness.container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
  });

  it("toggles and inspects an item from its proxy keys", () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.keyDown(proxy, { key: " " });
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].items).toEqual(["a"]);
    fireEvent.keyDown(proxy, { key: "Enter" });
    expect(harness.container.querySelector('[data-yp-part="inspector"]')).not.toBeNull();
  });

  it("selects only effectively visible items with Ctrl/Cmd+A", () => {
    const harness = setup(
      {
        layers: [layer("visible"), layer("hidden", { defaultVisible: false })],
      },
      {
        items: [
          item("a", "visible", "2027-02-01", "2027-02-03"),
          item("b", "hidden", "2027-02-02", "2027-02-04"),
        ],
      },
    );
    fireEvent.keyDown(harness.grid, { key: "a", ctrlKey: true });
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].items).toEqual(["a"]);
  });
});

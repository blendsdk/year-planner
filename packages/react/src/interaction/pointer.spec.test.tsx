import {
  buildClassicYearLayout,
  type CommandOutcome,
  type PlannerCommand,
  type PlannerFilter,
  type PlannerItem,
  type PlannerLayer,
  type PlannerModel,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerHandle } from "../types.js";
import { YearPlanner } from "../YearPlanner.js";
import { buildCreateItem, buildPaintCommand } from "./builders.js";
import { previewFromCompletion, projectPreviewRanges } from "./preview.js";

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
  options: { items?: PlannerItem[]; layers?: PlannerLayer[]; activeLayerId?: string | null } = {},
) {
  const ref = createRef<YearPlannerHandle>();
  const onSelectionChange = vi.fn();
  const onDiagnostic = vi.fn();
  const onChangeRequest = vi.fn(
    (_command: PlannerCommand): CommandOutcome => ({ accepted: true, revision: "1" }),
  );
  const activeLayerProps =
    options.activeLayerId === null ? {} : { activeLayerId: options.activeLayerId ?? "highlight" };
  const view = render(
    <YearPlanner
      ref={ref}
      year={2027}
      layers={options.layers ?? [layer("bookings"), layer("highlight", { channel: "highlight" })]}
      defaultItems={options.items ?? []}
      {...activeLayerProps}
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
  const capture = vi.fn();
  Object.defineProperty(grid, "setPointerCapture", { configurable: true, value: capture });
  Object.defineProperty(grid, "releasePointerCapture", { configurable: true, value: vi.fn() });
  return {
    ref,
    onSelectionChange,
    onDiagnostic,
    onChangeRequest,
    viewport,
    grid,
    capture,
    ...view,
  };
}

function pointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  point: { clientX: number; clientY: number },
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {},
) {
  const payload = {
    ...point,
    pointerId: 1,
    pointerType: "mouse",
    button: type === "pointerdown" ? 0 : undefined,
    ...modifiers,
  };
  if (type === "pointerdown") fireEvent.pointerDown(element, payload);
  else if (type === "pointermove") fireEvent.pointerMove(element, payload);
  else if (type === "pointerup") fireEvent.pointerUp(element, payload);
  else fireEvent.pointerCancel(element, payload);
}

function cellElement(setupResult: ReturnType<typeof setup>, date: string): Element {
  return setupResult.container.querySelector(`[data-date="${date}"]`) as Element;
}

function drag(
  setupResult: ReturnType<typeof setup>,
  fromDate: string,
  to: { clientX: number; clientY: number },
) {
  const from = cellPoint(fromDate);
  pointer(cellElement(setupResult, fromDate), "pointerdown", from);
  pointer(setupResult.grid, "pointermove", to);
  pointer(setupResult.grid, "pointerup", to);
}

describe("RD-07 pointer wiring", () => {
  it("captures the pointer on the grid root", () => {
    const harness = setup();
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    expect(harness.capture).toHaveBeenCalledWith(1);
  });

  it("RD-07-AC-01: selects a cross-month date range with two preview fragments", async () => {
    const harness = setup({ interaction: { mode: "select" } });
    const from = cellPoint("2027-01-28");
    const to = cellPoint("2027-02-06");
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", from);
    pointer(harness.grid, "pointermove", to);
    await waitFor(() =>
      expect(harness.container.querySelectorAll('[data-yp-part="selection-preview"]')).toHaveLength(
        2,
      ),
    );
    pointer(harness.grid, "pointerup", to);
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalled());
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].dates).toEqual([
      { startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
    ]);
  });

  it("emits exactly one selection for a sub-threshold click", async () => {
    const harness = setup();
    const point = cellPoint("2027-01-28");
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", point);
    pointer(harness.grid, "pointermove", { clientX: point.clientX + 2, clientY: point.clientY });
    pointer(harness.grid, "pointerup", { clientX: point.clientX + 2, clientY: point.clientY });
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalledTimes(1));
  });

  it("suppresses the native click after a drag", async () => {
    const harness = setup();
    const to = cellPoint("2027-02-06");
    drag(harness, "2027-01-28", to);
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalledTimes(1));
    fireEvent.click(harness.container.querySelector('[data-date="2027-02-06"]') as Element);
    expect(harness.onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it("keeps host buttons in cells independent from planner selection", () => {
    const harness = setup({
      renderCell: (context) =>
        context.date === "2027-01-28" ? <button type="button">Host action</button> : null,
    });
    fireEvent.click(harness.container.querySelector('[data-date="2027-01-28"] button') as Element);
    expect(harness.onSelectionChange).not.toHaveBeenCalled();
  });

  it("moves an item through the command pipeline", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    const from = cellPoint("2027-01-28");
    const to = cellPoint("2027-02-02");
    pointer(proxy, "pointerdown", from);
    pointer(harness.grid, "pointermove", to);
    pointer(harness.grid, "pointerup", to);
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "move",
      itemId: "a",
      expectedVersion: 1,
      proposedPeriod: { startDate: "2027-02-02", endDateExclusive: "2027-02-12" },
    });
  });

  it("paints a highlight range through the active layer", async () => {
    const harness = setup({ interaction: { mode: "paint" } });
    drag(harness, "2027-06-10", cellPoint("2027-06-12"));
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "paint",
      layerId: "highlight",
      operation: "union",
      period: { startDate: "2027-06-10", endDateExclusive: "2027-06-13" },
    });
  });

  it("erases a highlight range with subtract semantics", async () => {
    const harness = setup({ interaction: { mode: "erase" } });
    drag(harness, "2027-06-14", cellPoint("2027-06-16"));
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "paint",
      operation: "subtract",
    });
  });

  it("RD-07-AC-13: creates an item with create defaults", async () => {
    const harness = setup({
      interaction: {
        mode: "create",
        createDefaults: { kind: "activity", layerId: "bookings" },
        createId: () => "created-1",
      },
    });
    drag(harness, "2027-01-28", cellPoint("2027-01-30"));
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "create",
      item: {
        id: "created-1",
        kind: "activity",
        layerId: "bookings",
        version: 1,
        period: { startDate: "2027-01-28", endDateExclusive: "2027-01-31" },
      },
    });
  });

  it("reports a missing paint target and emits no command", async () => {
    const harness = setup({
      interaction: { mode: "paint" },
      activeLayerId: "bookings",
    });
    drag(harness, "2027-06-10", cellPoint("2027-06-12"));
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_PAINT_TARGET" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("RD-07-AC-09: cancels an active move on Escape without a command", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    fireEvent.keyDown(harness.grid, { key: "Escape" });
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("reports an invalid resize without a command", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-02-01", "2027-02-06")] });
    const handle = harness.container
      .querySelector('[data-yp-part="item-proxy"][data-item-id="a"]')
      ?.parentElement?.querySelector('[data-yp-part="resize-end"]') as Element;
    pointer(handle, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-01-31"));
    pointer(harness.grid, "pointerup", cellPoint("2027-01-31"));
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("does not start a move from an annotation", () => {
    const harness = setup(
      {},
      {
        items: [item("note", "notes", "2027-02-01", "2027-02-02", { kind: "annotation" })],
        layers: [layer("notes", { channel: "annotation" })],
      },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="note"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-03"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-03"));
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps canonical items unchanged during a drag", () => {
    const original = [item("a", "bookings", "2027-01-28", "2027-02-07")];
    const harness = setup({}, { items: original });
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    expect(
      harness.container.querySelector('[data-item-id="a"]')?.getAttribute("data-yp-pending"),
    ).toBe("false");
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps selected ranges visible after pointerup", async () => {
    const harness = setup({ interaction: { mode: "select" } });
    drag(harness, "2027-01-28", cellPoint("2027-02-06"));
    await waitFor(() =>
      expect(harness.container.querySelectorAll('[data-yp-part="selection"]')).toHaveLength(2),
    );
  });

  it("resizes an item through a handle", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-02-01", "2027-02-06")] });
    const handle = harness.container
      .querySelector('[data-yp-part="item-proxy"][data-item-id="a"]')
      ?.parentElement?.querySelector('[data-yp-part="resize-end"]') as Element;
    pointer(handle, "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-04"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-04"));
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "resize",
      proposedPeriod: { startDate: "2027-02-01", endDateExclusive: "2027-02-05" },
    });
  });

  it("requires confirmation before deleting with the keyboard", async () => {
    const confirmChange = vi.fn(() => false);
    const harness = setup(
      { interaction: { confirmChange } },
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.click(proxy);
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(confirmChange).toHaveBeenCalled());
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("keeps the original item after a host rejection", async () => {
    const onChangeRequest = vi.fn(
      (_command: PlannerCommand): CommandOutcome => ({ accepted: false, diagnostics: [] }),
    );
    const harness = setup(
      { onChangeRequest },
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() => expect(onChangeRequest).toHaveBeenCalled());
    expect(
      harness.container.querySelector('[data-item-id="a"]')?.getAttribute("data-yp-pending"),
    ).toBe("false");
  });

  it("reports a missing create layer without a command", async () => {
    const harness = setup({ interaction: { mode: "create" } }, { activeLayerId: null });
    drag(harness, "2027-01-28", cellPoint("2027-01-30"));
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("cancels when the interaction mode changes mid-drag", async () => {
    const harness = setup({ interaction: { mode: "select" } });
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    harness.rerender(
      <YearPlanner
        year={2027}
        layers={[layer("bookings"), layer("highlight", { channel: "highlight" })]}
        defaultItems={[]}
        activeLayerId="highlight"
        interaction={{ mode: "paint" }}
        onSelectionChange={harness.onSelectionChange}
        onDiagnostic={harness.onDiagnostic}
        onChangeRequest={harness.onChangeRequest}
      />,
    );
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    expect(harness.onSelectionChange).not.toHaveBeenCalled();
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("reports a no-item delete instead of guessing", async () => {
    const harness = setup();
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("decorates a move preview with the item layer", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    await waitFor(() =>
      expect(harness.container.querySelector('[data-yp-part="gesture-preview"]')).toHaveAttribute(
        "data-yp-layer",
        "bookings",
      ),
    );
  });

  it("adds intersecting items to an existing selection on Shift marquee", async () => {
    const harness = setup(
      { defaultSelection: { dates: [], items: ["c"] } },
      {
        items: [
          item("a", "bookings", "2027-01-28", "2027-02-03"),
          item("b", "bookings", "2027-01-30", "2027-02-04"),
          item("c", "bookings", "2027-02-10", "2027-02-12"),
        ],
      },
    );
    pointer(cellElement(harness, "2027-01-28"), "pointerdown", cellPoint("2027-01-28"), {
      shiftKey: true,
    });
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    await waitFor(() => expect(harness.onSelectionChange).toHaveBeenCalled());
    expect(harness.onSelectionChange.mock.calls.at(-1)?.[0].items).toEqual(["a", "b", "c"]);
  });

  it("shows an invalid-preview affordance for a disabled paint range", async () => {
    const harness = setup({
      interaction: { mode: "paint" },
      getDateMeta: (date) => (date === "2027-02-02" ? { disabled: true } : undefined),
    });
    pointer(cellElement(harness, "2027-02-01"), "pointerdown", cellPoint("2027-02-01"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-03"));
    await waitFor(() =>
      expect(
        harness.container.querySelector(
          '[data-yp-part="gesture-preview"][data-preview-valid="false"]',
        ),
      ).not.toBeNull(),
    );
    pointer(harness.grid, "pointerup", cellPoint("2027-02-03"));
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_COMMAND" }),
      ),
    );
  });

  it("cancels when the item content changes mid-drag", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-02"));
    harness.rerender(
      <YearPlanner
        year={2027}
        layers={[layer("bookings"), layer("highlight", { channel: "highlight" })]}
        items={[item("a", "bookings", "2027-01-28", "2027-02-08")]}
        activeLayerId="highlight"
        onSelectionChange={harness.onSelectionChange}
        onDiagnostic={harness.onDiagnostic}
        onChangeRequest={harness.onChangeRequest}
      />,
    );
    pointer(harness.grid, "pointerup", cellPoint("2027-02-02"));
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("renders two proposed fragments for a cross-month move", async () => {
    const harness = setup({}, { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] });
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    pointer(proxy, "pointerdown", cellPoint("2027-01-28"));
    pointer(harness.grid, "pointermove", cellPoint("2027-02-20"));
    await waitFor(() =>
      expect(harness.container.querySelectorAll('[data-yp-part="gesture-preview"]')).toHaveLength(
        2,
      ),
    );
    const row = layout.rows.find((entry) => entry.rowId === "2027-02");
    const column = row?.columns.find((entry) => entry.date === "2027-02-20");
    const fragment = harness.container.querySelector(
      '[data-yp-part="gesture-preview"]',
    ) as HTMLElement;
    expect(fragment.style.left).toBe(`${column?.x}px`);
    expect(fragment).toHaveAttribute("data-preview-kind", "move");
    const layer = harness.container.querySelector(
      '[data-yp-part="gesture-preview-layer"]',
    ) as HTMLElement;
    expect(layer.style.left).toBe("0px");
  });

  it("allows delete when confirmation succeeds", async () => {
    const harness = setup(
      { interaction: { confirmChange: () => true } },
      { items: [item("a", "bookings", "2027-01-28", "2027-02-07")] },
    );
    const proxy = harness.container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="a"]',
    ) as Element;
    fireEvent.click(proxy);
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "delete",
      itemId: "a",
      expectedVersion: 1,
    });
  });
});

describe("RD-07 command builders and preview projection", () => {
  const model = (items: PlannerItem[]): PlannerModel => ({
    groups: [],
    layers: [layer("bookings"), layer("highlight", { channel: "highlight" })],
    resources: [],
    items,
  });
  const visibility: VisibilityState = {
    hiddenGroupIds: [],
    hiddenLayerIds: [],
    hiddenItemIds: [],
    hiddenChannels: [],
  };
  const filter: PlannerFilter = {};

  it("builds paint versions without locked items", () => {
    const command = buildPaintCommand({
      model: model([
        item("open", "highlight", "2027-06-10", "2027-06-20", { kind: "highlight" }),
        item("locked", "highlight", "2027-06-12", "2027-06-14", {
          kind: "highlight",
          locked: true,
        }),
      ]),
      visibility,
      filter,
      layerId: "highlight",
      startDate: "2027-06-10",
      endDateExclusive: "2027-06-15",
      operation: "union",
      defaults: { kind: "highlight" },
    });
    expect(command).toMatchObject({
      type: "paint",
      expectedVersions: { open: 1 },
    });
  });

  it("returns no paint command for a non-highlight layer", () => {
    expect(
      buildPaintCommand({
        model: model([]),
        visibility,
        filter,
        layerId: "bookings",
        startDate: "2027-06-10",
        endDateExclusive: "2027-06-15",
        operation: "union",
        defaults: { kind: "highlight" },
      }),
    ).toBeUndefined();
  });

  it("builds create items from defaults, active layer and a stable ID", () => {
    expect(
      buildCreateItem({
        interaction: {
          createDefaults: { kind: "highlight", layerId: "highlight" },
          createId: () => "created-1",
        },
        activeLayerId: "bookings",
        startDate: "2027-01-28",
        endDateExclusive: "2027-01-31",
        createId: () => "created-1",
      }),
    ).toMatchObject({
      id: "created-1",
      kind: "highlight",
      layerId: "highlight",
      version: 1,
      period: { startDate: "2027-01-28", endDateExclusive: "2027-01-31" },
    });
    expect(
      buildCreateItem({
        interaction: undefined,
        activeLayerId: "bookings",
        startDate: "2027-01-28",
        endDateExclusive: "2027-01-31",
        createId: () => "created-2",
      }),
    ).toMatchObject({ layerId: "bookings", id: "created-2" });
  });

  it("returns no create item without a layer", () => {
    expect(
      buildCreateItem({
        interaction: undefined,
        activeLayerId: undefined,
        startDate: "2027-01-28",
        endDateExclusive: "2027-01-31",
        createId: () => "created-3",
      }),
    ).toBeUndefined();
  });

  it("projects a cross-month range into two row fragments", () => {
    const fragments = projectPreviewRanges(
      [{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }],
      layout,
      1,
    );
    expect(fragments).toHaveLength(2);
    expect(fragments[0]?.rowId).toBe("2027-01");
    expect(fragments[1]?.rowId).toBe("2027-02");
    expect(fragments[0]?.startDate).toBe("2027-01-28");
    expect(fragments[1]?.endDateExclusive).toBe("2027-02-07");
    const lastDay = projectPreviewRanges(
      [{ startDate: "2026-12-31", endDateExclusive: "2027-01-01" }],
      layout,
      1,
    );
    expect(lastDay[0]?.width).toBe(55);
  });

  it("maps completion intents to previews", () => {
    expect(
      previewFromCompletion(
        {
          kind: "select",
          anchor: "2027-02-01",
          focus: "2027-02-03",
          modifiers: { shift: false, mod: false },
        },
        undefined,
      ),
    ).toMatchObject({
      kind: "selection",
      ranges: [{ startDate: "2027-02-01", endDateExclusive: "2027-02-04" }],
    });
    expect(
      previewFromCompletion(
        {
          kind: "marquee",
          rect: { left: 0, top: 0, width: 10, height: 20 },
          modifiers: { shift: false, mod: false },
        },
        undefined,
      ),
    ).toMatchObject({ kind: "marquee" });
    expect(
      previewFromCompletion(
        {
          kind: "move",
          itemId: "a",
          proposedPeriod: {
            kind: "all-day",
            startDate: "2027-02-01",
            endDateExclusive: "2027-02-03",
          },
          fallbackDate: "2027-02-01",
        },
        "bookings",
      ),
    ).toMatchObject({ kind: "item", variant: "move", itemId: "a", layerId: "bookings" });
    expect(
      previewFromCompletion(
        {
          kind: "resize",
          itemId: "a",
          proposedPeriod: {
            kind: "all-day",
            startDate: "2027-02-01",
            endDateExclusive: "2027-02-03",
          },
          fallbackDate: "2027-02-01",
        },
        "bookings",
      ),
    ).toMatchObject({ kind: "item", variant: "resize" });
    expect(
      previewFromCompletion(
        {
          kind: "paint",
          operation: "subtract",
          startDate: "2027-02-01",
          endDateExclusive: "2027-02-03",
          fallbackDate: "2027-02-01",
        },
        "highlight",
      ),
    ).toMatchObject({ kind: "range", variant: "erase" });
    expect(
      previewFromCompletion(
        {
          kind: "create",
          startDate: "2027-02-01",
          endDateExclusive: "2027-02-03",
          fallbackDate: "2027-02-01",
        },
        "highlight",
      ),
    ).toMatchObject({ kind: "range", variant: "create" });
    expect(
      previewFromCompletion(
        { kind: "invalid", code: "INVALID_COMMAND", message: "no", fallbackDate: "2027-02-01" },
        undefined,
      ),
    ).toBeUndefined();
  });
});

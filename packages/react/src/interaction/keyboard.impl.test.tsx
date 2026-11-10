import {
  addDays,
  buildClassicYearLayout,
  type CommandOutcome,
  type PlannerCommand,
  type PlannerItem,
  type PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
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
  Object.defineProperty(grid, "setPointerCapture", { configurable: true, value: vi.fn() });
  Object.defineProperty(grid, "releasePointerCapture", { configurable: true, value: vi.fn() });
  const cell = (date: string) =>
    view.container.querySelector(`[data-date="${date}"]`) as HTMLElement;
  return { ref, onDiagnostic, onChangeRequest, viewport, grid, cell, ...view };
}

describe("keyboard and focus internals", () => {
  it("stops at the first date when moving left", () => {
    const harness = setup();
    const first = harness.cell("2026-12-01");
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    expect(first).toHaveAttribute("tabindex", "0");
  });

  it("ignores reserved Ctrl/Cmd+Shift+Arrow", () => {
    const harness = setup();
    const first = harness.cell("2026-12-01");
    fireEvent.keyDown(first, { key: "ArrowRight", shiftKey: true, ctrlKey: true });
    expect(harness.cell("2026-12-01")).toHaveAttribute("tabindex", "0");
  });

  it("deletes the sole selected item when no focus is set", async () => {
    const harness = setup(
      {
        defaultSelection: { dates: [], items: ["a"] },
        interaction: { confirmChange: () => true },
      },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    fireEvent.keyDown(harness.grid, { key: "Delete" });
    await waitFor(() => expect(harness.onChangeRequest).toHaveBeenCalled());
    expect(harness.onChangeRequest.mock.calls[0]?.[0]).toMatchObject({
      type: "delete",
      itemId: "a",
    });
  });

  it("removes an item from selection and clears its anchors when it disappears", async () => {
    const harness = setup(
      {
        items: [item("a", "bookings", "2027-02-01", "2027-02-03")],
        defaultSelection: {
          dates: [],
          items: ["a"],
          anchorItemId: "a",
          focusItemId: "a",
        },
      },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    harness.rerender(
      <YearPlanner
        year={2027}
        layers={[layer("bookings"), layer("highlight", { channel: "highlight" })]}
        items={[]}
        activeLayerId="highlight"
        defaultSelection={{
          dates: [],
          items: ["a"],
          anchorItemId: "a",
          focusItemId: "a",
        }}
        onDiagnostic={harness.onDiagnostic}
        onChangeRequest={harness.onChangeRequest}
      />,
    );
    await waitFor(() =>
      expect(harness.container.querySelector('[data-yp-part="focus-status"]')).toHaveTextContent(
        /focus moved/i,
      ),
    );
  });

  it("undoes and redoes a local paint and create", async () => {
    const harness = setup({ interaction: { createId: () => "painted" } });
    harness.ref.current?.requestCommand({
      type: "paint",
      layerId: "highlight",
      period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-03" },
      operation: "union",
      defaults: { kind: "highlight", title: "Painted" },
      expectedVersions: {},
    });
    await waitFor(() =>
      expect(harness.container.querySelector('[data-item-id="painted"]')).not.toBeNull(),
    );
    harness.ref.current?.requestUndo();
    await waitFor(() =>
      expect(harness.container.querySelectorAll('[data-yp-channel="highlight"]')).toHaveLength(0),
    );

    harness.ref.current?.requestCommand({
      type: "create",
      item: item("created", "highlight", "2027-03-01", "2027-03-03", {
        kind: "highlight",
      }),
    });
    await waitFor(() =>
      expect(harness.container.querySelector('[data-item-id="created"]')).not.toBeNull(),
    );
    harness.ref.current?.requestUndo();
    await waitFor(() =>
      expect(harness.container.querySelector('[data-item-id="created"]')).toBeNull(),
    );
    harness.ref.current?.requestRedo();
    await waitFor(() =>
      expect(harness.container.querySelector('[data-item-id="created"]')).not.toBeNull(),
    );
  });

  it("rejects an imperative delete in read-only mode", async () => {
    const harness = setup(
      { readOnly: true },
      { items: [item("a", "bookings", "2027-02-01", "2027-02-03")] },
    );
    harness.ref.current?.requestCommand({ type: "delete", itemId: "a", expectedVersion: 1 });
    await waitFor(() =>
      expect(harness.onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "READ_ONLY" }),
      ),
    );
    expect(harness.onChangeRequest).not.toHaveBeenCalled();
  });

  it("does not start a touch gesture in auto mode", () => {
    const harness = setup({ interaction: { touchEditing: "auto" } });
    fireEvent.pointerDown(harness.cell("2027-02-01"), {
      ...cellPoint("2027-02-01"),
      pointerId: 1,
      pointerType: "touch",
      button: 0,
    });
    fireEvent.pointerMove(harness.grid, {
      ...cellPoint("2027-02-02"),
      pointerId: 1,
      pointerType: "touch",
    });
    expect(harness.container.querySelector('[data-yp-part="selection-preview"]')).toBeNull();
  });

  it("reflects a controlled selection change in the active date", () => {
    const harness = setup({ selection: { dates: [], items: [], focusDate: "2027-03-04" } });
    expect(harness.cell("2027-03-04")).toHaveAttribute("tabindex", "0");
  });
});

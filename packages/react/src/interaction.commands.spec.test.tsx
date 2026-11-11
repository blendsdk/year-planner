import {
  buildClassicYearLayout,
  type CommandOutcome,
  type PlannerItem,
  type PlannerLayer,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { YearPlannerProps } from "./types.js";
import { YearPlanner } from "./YearPlanner.js";

const layout = (() => {
  const result = buildClassicYearLayout({ year: 2027 });
  if (!result.ok) throw new Error("layout failed");
  return result.layout;
})();

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89", label: "B" },
  { id: "maintenance", name: "Maintenance", channel: "ribbon", color: "#8358c6", label: "M" },
  { id: "highlight", name: "Highlight", channel: "highlight", color: "#ffd166", label: "H" },
];

const booking: PlannerItem = {
  id: "booking",
  kind: "activity",
  layerId: "bookings",
  period: { kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" },
  title: "Booking",
  version: 1,
};

const maintenance: PlannerItem = {
  id: "maintenance",
  kind: "activity",
  layerId: "maintenance",
  period: { kind: "all-day", startDate: "2027-02-03", endDateExclusive: "2027-02-12" },
  title: "Maintenance",
  version: 1,
};

const highlight: PlannerItem = {
  id: "highlight",
  kind: "highlight",
  layerId: "highlight",
  period: { kind: "all-day", startDate: "2027-06-10", endDateExclusive: "2027-06-21" },
  title: "Highlight",
  version: 1,
};

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

function setup(overrides: Partial<YearPlannerProps> = {}) {
  const element = (extra: Partial<YearPlannerProps> = {}): ReactElement => (
    <YearPlanner
      year={2027}
      layers={layers}
      defaultItems={[booking, maintenance, highlight]}
      {...overrides}
      {...extra}
    />
  );
  const view = render(element());
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
  return {
    viewport,
    grid,
    ...view,
    rerenderWith: (extra: Partial<YearPlannerProps>) => view.rerender(element(extra)),
  };
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

function dragItem(
  harness: ReturnType<typeof setup>,
  itemId: string,
  fromDate: string,
  toDate: string,
) {
  const proxy = harness.container.querySelector(
    `[data-yp-part="item-proxy"][data-item-id="${itemId}"]`,
  ) as Element;
  pointer(proxy, "pointerdown", cellPoint(fromDate));
  pointer(harness.grid, "pointermove", cellPoint(toDate));
  pointer(harness.grid, "pointerup", cellPoint(toDate));
  return proxy;
}

function dragCells(harness: ReturnType<typeof setup>, fromDate: string, toDate: string) {
  const cell = harness.container.querySelector(`[data-date="${fromDate}"]`) as Element;
  pointer(cell, "pointerdown", cellPoint(fromDate));
  pointer(harness.grid, "pointermove", cellPoint(toDate));
  pointer(harness.grid, "pointerup", cellPoint(toDate));
}

const previews = (container: HTMLElement) =>
  container.querySelectorAll('[data-yp-part="gesture-preview"]');

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("RD-08 pending previews", () => {
  it("keeps the move preview until the host accepts", async () => {
    const response = deferred<CommandOutcome>();
    const harness = setup({ onChangeRequest: () => response.promise });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThan(0));
    expect(
      harness.container.querySelector('[data-item-id="booking"][data-yp-pending="true"]'),
    ).not.toBeNull();
    response.resolve({ accepted: true, revision: "2" });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    await waitFor(() =>
      expect(
        harness.container.querySelector('[data-yp-part="command-status"]')?.textContent,
      ).toContain("Change accepted"),
    );
  });

  it("clears the preview and restores focus when the host rejects", async () => {
    const harness = setup({
      onChangeRequest: () => ({
        accepted: false,
        diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "Full" }],
      }),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    expect(
      harness.container.querySelector('[data-item-id="booking"]')?.getAttribute("data-yp-pending"),
    ).toBe("false");
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("data-item-id")).toBe("booking"),
    );
    expect(
      harness.container.querySelector('[data-yp-part="command-status"]')?.textContent,
    ).toContain("Change rejected");
  });

  it("clears the preview on timeout", async () => {
    const harness = setup({
      interaction: { commandTimeoutMs: 20 },
      onChangeRequest: () => new Promise<CommandOutcome>(() => {}),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    await waitFor(() => expect(harness.container.textContent).toContain("COMMAND_TIMEOUT"));
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("data-item-id")).toBe("booking"),
    );
  });

  it("clears the preview when the host accepts but props never apply", async () => {
    const harness = setup({
      items: [booking, maintenance, highlight],
      interaction: { commandTimeoutMs: 100 },
      onChangeRequest: () => ({
        accepted: true,
        revision: "2",
        updatedItems: [
          {
            ...booking,
            period: { kind: "all-day", startDate: "2027-02-02", endDateExclusive: "2027-02-12" },
            version: 2,
          },
        ],
      }),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0), { timeout: 5000 });
    await waitFor(() => expect(harness.container.textContent).toContain("ACCEPTED_NOT_APPLIED"), {
      timeout: 5000,
    });
  });

  it("holds a paint preview until the host rejects", async () => {
    const response = deferred<CommandOutcome>();
    const harness = setup({
      activeLayerId: "highlight",
      interaction: { mode: "paint" },
      onChangeRequest: () => response.promise,
    });
    dragCells(harness, "2027-06-12", "2027-06-16");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThan(0));
    response.resolve({
      accepted: false,
      diagnostics: [{ code: "CAPACITY_EXCEEDED", level: "error", message: "No" }],
    });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("data-date")).toBe("2027-06-12"),
    );
  });

  it("holds a create preview until the host rejects", async () => {
    const response = deferred<CommandOutcome>();
    const harness = setup({
      activeLayerId: "bookings",
      interaction: { mode: "create", createDefaults: { kind: "activity", layerId: "bookings" } },
      onChangeRequest: () => response.promise,
    });
    dragCells(harness, "2027-03-01", "2027-03-04");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThan(0));
    response.resolve({
      accepted: false,
      diagnostics: [{ code: "READ_ONLY", level: "error", message: "No" }],
    });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("data-date")).toBe("2027-03-01"),
    );
  });

  it("marks a pending delete item without a preview", async () => {
    const response = deferred<CommandOutcome>();
    const harness = setup({
      interaction: { confirmChange: () => true },
      onChangeRequest: () => response.promise,
    });
    const ref = harness.container.querySelector('[data-yp-part="grid"]');
    expect(ref).not.toBeNull();
    fireEvent.keyDown(ref as Element, { key: "Delete" });
    // Select the item first so Delete has a target.
    fireEvent.click(
      harness.container.querySelector(
        '[data-yp-part="item-proxy"][data-item-id="booking"]',
      ) as Element,
    );
    fireEvent.keyDown(ref as Element, { key: "Delete" });
    await waitFor(() =>
      expect(
        harness.container
          .querySelector('[data-item-id="booking"]')
          ?.getAttribute("data-yp-pending"),
      ).toBe("true"),
    );
    expect(previews(harness.container)).toHaveLength(0);
    response.resolve({ accepted: true, revision: "2" });
  });

  it("renders two pending previews for unrelated items", async () => {
    const first = deferred<CommandOutcome>();
    const second = deferred<CommandOutcome>();
    let call = 0;
    const harness = setup({
      onChangeRequest: () => {
        call += 1;
        return call === 1 ? first.promise : second.promise;
      },
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    dragItem(harness, "maintenance", "2027-02-03", "2027-02-05");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThanOrEqual(2));
    first.resolve({ accepted: true, revision: "2" });
    await waitFor(() => expect(previews(harness.container).length).toBe(1));
    second.resolve({ accepted: true, revision: "3" });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
  });

  it("clears pending on a year change without feedback", async () => {
    const harness = setup({
      onChangeRequest: () => new Promise<CommandOutcome>(() => {}),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThan(0));
    harness.rerenderWith({ year: 2028 });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    expect(harness.container.textContent).not.toContain("COMMAND_TIMEOUT");
  });

  it("clears pending when the source layer is hidden", async () => {
    const harness = setup({
      onChangeRequest: () => new Promise<CommandOutcome>(() => {}),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    await waitFor(() => expect(previews(harness.container).length).toBeGreaterThan(0));
    harness.rerenderWith({
      visibility: {
        hiddenGroupIds: [],
        hiddenLayerIds: ["bookings"],
        hiddenItemIds: [],
      },
    });
    await waitFor(() => expect(previews(harness.container)).toHaveLength(0));
    expect(harness.container.textContent).not.toContain("COMMAND_TIMEOUT");
  });

  it("preserves a newer selection when a command is rejected", async () => {
    const onSelectionChange = vi.fn();
    const harness = setup({
      defaultSelection: { dates: [], items: ["booking"] },
      onSelectionChange,
      onChangeRequest: () => ({
        accepted: false,
        diagnostics: [{ code: "READ_ONLY", level: "error", message: "No" }],
      }),
    });
    dragItem(harness, "booking", "2027-01-28", "2027-02-02");
    const cell = harness.container.querySelector('[data-date="2027-03-01"]') as Element;
    fireEvent.click(cell);
    fireEvent.click(cell);
    await waitFor(() => expect(onSelectionChange).toHaveBeenCalled());
    const last = onSelectionChange.mock.calls.at(-1)?.[0];
    expect(last.dates).toEqual([{ startDate: "2027-03-01", endDateExclusive: "2027-03-02" }]);
  });
});

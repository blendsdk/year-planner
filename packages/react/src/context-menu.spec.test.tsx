import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlannerContextMenuRequest } from "./types.js";
import { YearPlanner } from "./YearPlanner.js";

const layers: PlannerLayer[] = [
  { id: "bookings", name: "Bookings", channel: "ribbon", color: "#1d4e89" },
  { id: "notes", name: "Notes", channel: "annotation", color: "#f6bd60" },
];

function item(
  id: string,
  layerId: string,
  startDate: string,
  endDateExclusive: string,
  kind: PlannerItem["kind"] = "activity",
): PlannerItem {
  return {
    id,
    kind,
    layerId,
    period: { kind: "all-day", startDate, endDateExclusive },
    title: id,
    version: 1,
    ...(kind === "annotation" ? { annotation: { label: "N" } } : {}),
  };
}

const items = [
  item("booking", "bookings", "2027-02-01", "2027-02-05"),
  item("note", "notes", "2027-02-10", "2027-02-11", "annotation"),
];

function renderPlanner(handler?: (request: PlannerContextMenuRequest) => void) {
  return render(
    <YearPlanner
      year={2027}
      layers={layers}
      defaultItems={items}
      activeLayerId="bookings"
      {...(handler ? { onContextMenuRequest: handler } : {})}
    />,
  );
}

function cell(container: HTMLElement, date: string): HTMLElement {
  const element = container.querySelector(`[role="gridcell"][data-date="${date}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`missing cell ${date}`);
  return element;
}

function proxy(container: HTMLElement, itemId: string): HTMLElement {
  const element = container.querySelector(`[data-yp-part="item-proxy"][data-item-id="${itemId}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`missing proxy ${itemId}`);
  return element;
}

describe("RD-13-AC-05: context-menu targets", () => {
  it("raises a date request and prevents the native menu", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const target = cell(container, "2027-02-02");
    const notPrevented = fireEvent.contextMenu(target, { clientX: 42, clientY: 84 });
    expect(notPrevented).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    const request = handler.mock.calls[0]?.[0] as PlannerContextMenuRequest;
    expect(request.target).toEqual({ kind: "date", date: "2027-02-02" });
    expect(request.source).toBe("pointer");
    expect(request.clientX).toBe(42);
    expect(request.clientY).toBe(84);
    expect(request.anchorRect).toBeDefined();
    expect(typeof request.restoreFocus).toBe("function");
  });

  it("raises an item request and selects the item without a gesture", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    fireEvent.contextMenu(proxy(container, "booking"), { clientX: 10, clientY: 20 });
    const request = handler.mock.calls[0]?.[0] as PlannerContextMenuRequest;
    expect(request.target).toEqual({
      kind: "item",
      itemId: "booking",
      date: "2027-02-01",
    });
    expect(
      container.querySelector('[data-yp-item-id="booking"][aria-pressed="true"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-yp-part="marquee"]')).toBeNull();
    expect(container.querySelectorAll(".yp-preview-layer")).toHaveLength(0);
  });

  it("resolves an annotation before an item proxy", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    fireEvent.contextMenu(proxy(container, "note"), { clientX: 10, clientY: 20 });
    const request = handler.mock.calls[0]?.[0] as PlannerContextMenuRequest;
    expect(request.target).toEqual({
      kind: "annotation",
      annotationId: "note",
      date: "2027-02-10",
    });
  });

  it("leaves the native menu alone without a handler or outside a target", () => {
    const { container } = renderPlanner();
    expect(fireEvent.contextMenu(cell(container, "2027-02-02"))).toBe(true);
    const handler = vi.fn();
    const second = renderPlanner(handler);
    expect(fireEvent.contextMenu(second.container.querySelector(".yp-root") as HTMLElement)).toBe(
      true,
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("raises one keyboard request and suppresses the browser contextmenu", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const target = cell(container, "2027-02-02");
    target.focus();
    fireEvent.keyDown(target, { key: "F10", shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    const request = handler.mock.calls[0]?.[0] as PlannerContextMenuRequest;
    expect(request.source).toBe("keyboard");
    expect(request.target).toEqual({ kind: "date", date: "2027-02-02" });
    fireEvent.contextMenu(target);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("raises a keyboard request from an item proxy", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const target = proxy(container, "booking");
    target.focus();
    fireEvent.keyDown(target, { key: "ContextMenu" });
    const request = handler.mock.calls[0]?.[0] as PlannerContextMenuRequest;
    expect(request.source).toBe("keyboard");
    expect(request.target).toEqual({ kind: "item", itemId: "booking", date: "2027-02-01" });
  });

  it("ignores touch-originated context menus", () => {
    const handler = vi.fn();
    const { container } = renderPlanner(handler);
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "sourceCapabilities", {
      value: { firesTouchEvents: true },
    });
    act(() => {
      proxy(container, "booking").dispatchEvent(event);
    });
    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

/** Creates a host container with a controllable border box. */
function createHost(width: number, height: number) {
  const host = document.createElement("div");
  let rect = { width, height };
  host.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
      top: 0,
      left: 0,
      right: rect.width,
      bottom: rect.height,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(host);
  return {
    host,
    resize(nextWidth: number, nextHeight: number) {
      rect = { width: nextWidth, height: nextHeight };
    },
  };
}

/** Reads the first month row's inline height and grid template. */
function rowGeometry(container: HTMLElement) {
  const row = container.querySelector("[data-row-id]") as HTMLElement | null;
  return {
    height: Number.parseFloat(row?.style.height ?? "0"),
    template: row?.style.gridTemplateColumns ?? "",
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("fit internals", () => {
  it("keeps the explicit design units when fit is none", () => {
    const { host } = createHost(1280, 800);
    const { container } = render(
      <YearPlanner year={2027} layers={[layer]} defaultItems={[item]} display={{ fit: "none" }} />,
      { container: host },
    );
    const geometry = rowGeometry(container);
    expect(geometry.height).toBe(90);
    expect(geometry.template.startsWith("70px")).toBe(true);
  });

  it("fits the host box when fit is contain", () => {
    const { host } = createHost(1280, 800);
    const { container } = render(
      <YearPlanner year={2027} layers={[layer]} defaultItems={[item]} />,
      { container: host },
    );
    const geometry = rowGeometry(container);
    // 800 px minus the 36 px header, 36 px footer and 1 px border, over 14 rows.
    expect(geometry.height).toBeGreaterThan(50);
    expect(geometry.height).toBeLessThan(56);
    const band = Number.parseFloat(geometry.template);
    expect(band).toBeGreaterThan(40);
    expect(band).toBeLessThan(50);
  });

  it("keeps the base geometry for a zero-size host", () => {
    const { host } = createHost(0, 0);
    const { container } = render(
      <YearPlanner year={2027} layers={[layer]} defaultItems={[item]} />,
      { container: host },
    );
    const geometry = rowGeometry(container);
    expect(geometry.height).toBe(90);
    expect(geometry.template.startsWith("70px")).toBe(true);
  });

  it("recomputes on a resize and ignores a zero-size observation", async () => {
    const callbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          callbacks.push(callback);
        }
        observe(): void {}
        disconnect(): void {}
      },
    );
    const { host, resize } = createHost(1280, 800);
    const { container } = render(
      <YearPlanner year={2027} layers={[layer]} defaultItems={[item]} />,
      { container: host },
    );
    const initial = rowGeometry(container).height;
    expect(initial).toBeGreaterThan(50);

    resize(1600, 1600);
    await act(async () => {
      for (const callback of callbacks) callback([], {} as ResizeObserver);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });
    await waitFor(() => expect(rowGeometry(container).height).toBeGreaterThan(initial + 20));

    resize(0, 0);
    await act(async () => {
      for (const callback of callbacks) callback([], {} as ResizeObserver);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });
    await waitFor(() => expect(rowGeometry(container).height).toBeGreaterThan(initial + 20));
  });
});

import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

const SECRET_TITLE = "TOPSECRET-HIDDEN";
const SECRET_ID = "secret-item";

const bookings: PlannerLayer = {
  id: "bookings",
  name: "Bookings",
  channel: "ribbon",
  color: "#1d4e89",
};

const notes: PlannerLayer = {
  id: "notes",
  name: "Notes",
  channel: "annotation",
  color: "#f6bd60",
};

/** Builds one valid all-day item. */
function item(id: string, title: string, layerId = "bookings"): PlannerItem {
  return {
    id,
    kind: layerId === "notes" ? "annotation" : "activity",
    layerId,
    period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
    title,
    version: 1,
    ...(layerId === "notes" ? { annotation: { label: "OH" } } : {}),
  };
}

const hidden = item(SECRET_ID, SECRET_TITLE);
const control = item("visible-control", "Visible control");

/** Renders a valid planner with the hidden sentinel and a visible control. */
function renderWithHidden(visibility: {
  hiddenGroupIds: string[];
  hiddenLayerIds: string[];
  hiddenItemIds: string[];
}) {
  return render(
    <YearPlanner
      year={2027}
      groups={[{ id: "ops", name: "Operations" }]}
      layers={[{ ...bookings, groupId: "ops" }, notes]}
      items={[hidden, control]}
      visibility={visibility}
    />,
  );
}

/** Returns the whole document text, including the hidden print tree. */
function documentText(container: HTMLElement): string {
  return container.textContent ?? "";
}

describe("RD-04-AC-18 / RD-05-AC-15 / RD-09-AC-16 / RD-10-AC-08: hidden data never renders", () => {
  it("shows a tooltip for a visible item and clears it when the item is hidden", () => {
    const { container, rerender } = render(
      <YearPlanner year={2027} layers={[bookings]} items={[control]} />,
    );
    const proxy = container.querySelector(
      '[data-yp-part="item-proxy"][data-item-id="visible-control"]',
    );
    if (!proxy) throw new Error("expected a visible proxy");
    fireEvent.focus(proxy);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Visible control");
    rerender(
      <YearPlanner
        year={2027}
        layers={[bookings]}
        items={[control]}
        visibility={{ hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: ["visible-control"] }}
      />,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("omits an item hidden by id from DOM, ARIA, print, list and overflow", () => {
    const { container } = renderWithHidden({
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: [SECRET_ID],
    });
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
    expect(container.querySelector('[data-item-id="visible-control"]')).not.toBeNull();
    expect(documentText(container)).not.toContain(SECRET_TITLE);
    expect(container.innerHTML).not.toContain(SECRET_ID);
    const print = container.querySelector('[data-yp-part="print-pages"]');
    expect(print?.textContent ?? "").not.toContain(SECRET_TITLE);
    const ariaText = Array.from(container.querySelectorAll("[aria-label],[aria-describedby]"))
      .map((node) => node.getAttribute("aria-label") ?? "")
      .join(" ");
    expect(ariaText).not.toContain(SECRET_TITLE);
    expect(container.querySelector('[data-yp-part="overflow-popover"]')).toBeNull();
  });

  it("omits a layer-hidden item even when the item itself is visible", () => {
    const { container } = renderWithHidden({
      hiddenGroupIds: [],
      hiddenLayerIds: ["bookings"],
      hiddenItemIds: [],
    });
    expect(documentText(container)).not.toContain(SECRET_TITLE);
    expect(container.querySelector('[data-item-id="visible-control"]')).toBeNull();
  });

  it("omits a group-hidden item and keeps the annotation outside the group", () => {
    const annotation = item("visible-note", "Visible note", "notes");
    const { container } = render(
      <YearPlanner
        year={2027}
        groups={[{ id: "ops", name: "Operations" }]}
        layers={[{ ...bookings, groupId: "ops" }, notes]}
        items={[hidden, control, annotation]}
        visibility={{ hiddenGroupIds: ["ops"], hiddenLayerIds: [], hiddenItemIds: [] }}
      />,
    );
    expect(documentText(container)).not.toContain(SECRET_TITLE);
    expect(container.querySelector('[data-item-id="visible-control"]')).toBeNull();
    // The annotation layer is outside the hidden group.
    expect(container.textContent).toContain("OH");
  });

  it("never shows a hidden title in a tooltip or the item list", () => {
    const { container } = renderWithHidden({
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: [SECRET_ID],
    });
    const cell = container.querySelector('[role="gridcell"][data-date="2027-02-01"]');
    if (!cell) throw new Error("expected a date cell");
    fireEvent.focus(cell);
    fireEvent.mouseEnter(cell);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(screen.queryByText(SECRET_TITLE)).toBeNull();
    expect(screen.queryByText(new RegExp(SECRET_ID))).toBeNull();
  });
});

describe("RD-10-AC-09: injection payloads stay inert", () => {
  it("renders a hostile title and annotation label as text", () => {
    const hostile = item("hostile", '<img src=x onerror="alert(1)">');
    const annotation = item("hostile-note", "Hostile note", "notes");
    annotation.annotation = { label: "<b>OH</b>" };
    const { container } = render(
      <YearPlanner year={2027} layers={[bookings, notes]} items={[hostile, annotation]} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(documentText(container)).toContain('<img src=x onerror="alert(1)">');
    expect(documentText(container)).toContain("<b>OH</b>");
  });

  it("drops hostile metadata, style values and class names", () => {
    const hostile: PlannerItem = {
      ...item("styled", "Styled"),
      className: 'x" onmouseover="alert(1)',
      metadata: { html: "<script>alert(1)</script>", url: "javascript:alert(1)" },
      style: {
        backgroundImage: "url(https://attacker.example/pixel)",
        background: "javascript:alert(1)",
        color: "#123456",
      } as never,
    };
    const { container } = render(<YearPlanner year={2027} layers={[bookings]} items={[hostile]} />);
    const fragment = container.querySelector('[data-item-id="styled"]') as HTMLElement;
    expect(container.querySelector("script")).toBeNull();
    expect(fragment.style.backgroundImage).not.toContain("url");
    expect(fragment.style.background).not.toContain("javascript");
    expect(fragment.style.color).toBe("rgb(18, 52, 86)");
    expect(fragment.getAttribute("onmouseover")).toBeNull();
    expect(container.innerHTML).not.toContain("attacker.example");
  });

  it("does not let getDateMeta inject raw HTML or a remote URL", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[bookings]}
        getDateMeta={(date) =>
          date === "2027-02-01"
            ? {
                label: "<img src=x onerror=alert(1)>",
                style: {
                  background: "url(https://attacker.example/pixel)",
                  color: "#123456",
                },
              }
            : undefined
        }
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).not.toContain("attacker.example");
    expect(container.querySelector('[data-date="2027-02-01"]')).toHaveStyle({
      color: "rgb(18, 52, 86)",
    });
  });
});

describe("RD-10-AC-10: no network or telemetry", () => {
  it("emits no fetch, XHR, beacon, WebSocket or EventSource call", () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    const socketSpy = vi.fn();
    const sourceSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("XMLHttpRequest", xhrSpy);
    vi.stubGlobal("WebSocket", socketSpy);
    vi.stubGlobal("EventSource", sourceSpy);
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
    try {
      const { container } = render(
        <YearPlanner year={2027} layers={[bookings, notes]} items={[control, hidden]} />,
      );
      const cell = container.querySelector('[role="gridcell"][data-date="2027-02-01"]');
      if (!cell) throw new Error("expected a date cell");
      fireEvent.pointerDown(cell, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerMove(cell, { clientX: 30, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(cell, { clientX: 30, clientY: 10, pointerId: 1 });
      fireEvent.click(cell);
      const proxy = container.querySelector(
        '[data-yp-part="item-proxy"][data-item-id="visible-control"]',
      );
      if (proxy) fireEvent.click(proxy);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
      expect(beacon).not.toHaveBeenCalled();
      expect(socketSpy).not.toHaveBeenCalled();
      expect(sourceSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(navigator, "sendBeacon");
    }
  });
});

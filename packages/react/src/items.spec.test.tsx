import type { PlannerItem, PlannerLayer } from "@blendsdk/year-planner-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

function ItemFragmentSlot({ children }: { children?: ReactNode }) {
  return <span data-testid="item-slot">{children}</span>;
}

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

const markers = (container: HTMLElement) =>
  container.querySelectorAll('[data-yp-part="item-fragment"]');
const proxy = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-yp-part="item-proxy"][data-item-id="${id}"]`);

describe("RD-06 fragment rendering", () => {
  it("splits a cross-month item into two fragments with one identity", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("cross", "ribbon", "2027-01-28", "2027-02-07")]}
      />,
    );
    const fragments = container.querySelectorAll(
      '[data-yp-part="item-fragment"][data-item-id="cross"]',
    );
    expect(fragments).toHaveLength(2);
    expect((fragments[0] as HTMLElement).style.width).toBe("190px");
    expect((fragments[1] as HTMLElement).style.width).toBe("315px");
  });

  it("places overlapping items in lanes 0, 1 and 2", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[
          item("a", "ribbon", "2027-02-01", "2027-02-03"),
          item("b", "ribbon", "2027-02-01", "2027-02-03"),
          item("c", "ribbon", "2027-02-01", "2027-02-03"),
        ]}
      />,
    );
    const wrapper = (id: string): HTMLElement => {
      const parent = proxy(container, id)?.parentElement;
      if (!parent) throw new Error(`missing wrapper for ${id}`);
      return parent as HTMLElement;
    };
    expect(wrapper("a").style.top).toBe("18px");
    expect(wrapper("b").style.top).toBe("36px");
    expect(wrapper("c").style.top).toBe("54px");
  });

  it("uses exact one-day width and lane height", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("one", "ribbon", "2027-02-01", "2027-02-02")]}
      />,
    );
    const fragment = container.querySelector(
      '[data-yp-part="item-fragment"][data-item-id="one"]',
    ) as HTMLElement;
    expect(fragment.style.width).toBe("55px");
    expect(fragment.style.height).toBe("18px");
  });

  it("renders the layer color and item class when no item color is supplied", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon", { color: "#1d4e89", label: "Bookings" })]}
        items={[
          item("colored", "ribbon", "2027-02-01", "2027-02-04", {
            className: "host-item",
          }),
        ]}
      />,
    );
    const fragment = container.querySelector(
      '[data-yp-part="item-fragment"][data-item-id="colored"]',
    ) as HTMLElement;
    expect(fragment.style.background).toBe("rgb(29, 78, 137)");
    expect(fragment).toHaveClass("host-item");
    expect(proxy(container, "colored")?.getAttribute("aria-label")).toContain("Bookings");
  });

  it("gives the first visible proxy a tab stop without a selection", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("first", "ribbon", "2027-02-01", "2027-02-04")]}
      />,
    );
    expect(proxy(container, "first")).toHaveAttribute("tabindex", "0");
  });

  it("gives a foreground-only item a tab stop", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("fg", { channel: "foreground" })]}
        items={[item("preview", "fg", "2027-02-01", "2027-02-04")]}
      />,
    );
    expect(proxy(container, "preview")).toHaveAttribute("tabindex", "0");
  });

  it("keeps one tab stop for a cross-month selected item", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("cross", "ribbon", "2027-01-28", "2027-02-07")]}
        defaultSelection={{ dates: [], items: ["cross"] }}
      />,
    );
    const proxies = container.querySelectorAll('[data-yp-part="item-proxy"][data-item-id="cross"]');
    expect(proxies[0]).toHaveAttribute("tabindex", "0");
    expect(proxies[1]).toHaveAttribute("tabindex", "-1");
  });

  it("keeps one roving tab stop and planner-owned proxy/handles", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[
          item("a", "ribbon", "2027-02-01", "2027-02-03"),
          item("b", "ribbon", "2027-02-01", "2027-02-03"),
        ]}
        defaultSelection={{ dates: [], items: ["a"] }}
      />,
    );
    expect(proxy(container, "a")).toHaveAttribute("tabindex", "0");
    expect(proxy(container, "b")).toHaveAttribute("tabindex", "-1");
    const wrapper = proxy(container, "a")?.parentElement;
    expect(wrapper?.querySelector('[data-yp-part="resize-start"]')).not.toBeNull();
    expect(wrapper?.querySelector('[data-yp-part="resize-end"]')).not.toBeNull();
    expect(proxy(container, "a")?.querySelector("button")).toBeNull();
    expect(proxy(container, "a")).toHaveAttribute("aria-pressed", "true");
  });

  it("omits hidden items from fragments and proxies", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        groups={[{ id: "g", name: "G" }]}
        layers={[layer("ribbon", { groupId: "g" })]}
        items={[item("hidden", "ribbon", "2027-02-01", "2027-02-03")]}
        defaultVisibility={{
          hiddenGroupIds: ["g"],
          hiddenLayerIds: [],
          hiddenItemIds: [],
        }}
      />,
    );
    expect(markers(container)).toHaveLength(0);
    expect(proxy(container, "hidden")).toBeNull();
  });

  it("renders annotation labels and honors showAnnotations", () => {
    const { container, rerender } = render(
      <YearPlanner
        year={2027}
        layers={[layer("notes", { channel: "annotation" })]}
        items={[
          item("holiday", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { label: "OH", background: "#ffd166", priority: 2 },
          }),
        ]}
      />,
    );
    const fragment = container.querySelector(
      '[data-yp-part="item-fragment"][data-item-id="holiday"]',
    ) as HTMLElement;
    expect(fragment.textContent).toContain("OH");
    expect(fragment.style.background).toBe("rgb(255, 209, 102)");
    rerender(
      <YearPlanner
        year={2027}
        display={{ showAnnotations: false }}
        layers={[layer("notes", { channel: "annotation" })]}
        items={[
          item("holiday", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { label: "OH" },
          }),
        ]}
      />,
    );
    expect(container.querySelector('[data-item-id="holiday"]')).toBeNull();
  });

  it("renders backdrop opacity, patterns and layer labels", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[
          layer("bg", {
            channel: "background",
            opacity: 0.5,
            pattern: "hatch",
            label: "Holidays",
          }),
          layer("fg", { channel: "foreground" }),
        ]}
        items={[
          item("highlight", "bg", "2027-02-01", "2027-02-03", { kind: "highlight" }),
          item("preview", "fg", "2027-02-01", "2027-02-03"),
        ]}
      />,
    );
    const backdrop = container.querySelector(
      '[data-yp-part="item-fragment"][data-item-id="highlight"]',
    ) as HTMLElement;
    expect(backdrop.style.opacity).toBe("0.225");
    expect(backdrop).toHaveClass("yp-pattern-hatch");
    expect(backdrop).toHaveAttribute("data-yp-layer-label", "Holidays");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(proxy(container, "preview")).not.toBeNull();
  });

  it("shows the compact overflow button and lists visible items", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${String(index).padStart(2, "0")}`, "ribbon", "2027-02-01", "2027-02-04", {
        title: `Title ${index}`,
      }),
    );
    const { container } = render(
      <YearPlanner year={2027} layers={[layer("ribbon")]} items={items} />,
    );
    expect(container.querySelectorAll('[data-yp-part="item-fragment"]')).toHaveLength(3);
    const button = container.querySelector('[data-yp-part="overflow-button"]');
    expect(button).toHaveTextContent("+17");
    fireEvent.click(button as Element);
    expect(container.querySelectorAll(".yp-overflow-entry")).toHaveLength(17);
    expect(container.querySelector(".yp-overflow-entry")?.textContent).toContain("Title 3");
  });

  it("exposes the overflow render context and closes on Escape", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      item(`item-${index}`, "ribbon", "2027-02-01", "2027-02-04"),
    );
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={items}
        renderOverflow={(context) => (
          <span data-testid="custom-overflow">
            {context.hiddenCount} / {context.items.length}
          </span>
        )}
      />,
    );
    const button = container.querySelector('[data-yp-part="overflow-button"]') as HTMLElement;
    fireEvent.click(button);
    expect(screen.getByTestId("custom-overflow")).toHaveTextContent("17 / 17");
    fireEvent.keyDown(button, { key: "Escape" });
    expect(container.querySelector('[data-yp-part="overflow-popover"]')).toBeNull();
  });

  it("shows a tooltip on focus and supports renderTooltip", () => {
    const { container, rerender } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("tip", "ribbon", "2027-02-01", "2027-02-04", { title: "Tip" })]}
      />,
    );
    fireEvent.focus(proxy(container, "tip") as Element);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tip");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Feb");
    rerender(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("tip", "ribbon", "2027-02-01", "2027-02-04", { title: "Tip" })]}
        renderTooltip={() => <span>Custom tooltip</span>}
      />,
    );
    fireEvent.focus(proxy(container, "tip") as Element);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Custom tooltip");
  });
});

describe("RD-06 cells and slots", () => {
  it("applies getDateMeta background, text, label, aria and disabled state", () => {
    const { container } = render(
      <YearPlanner
        year={2016}
        getDateMeta={(date) => {
          if (date === "2016-01-05") {
            return {
              background: "#abcdef",
              color: "#112233",
              label: "Payday",
              ariaLabel: "Pay day",
              content: <span>extra</span>,
            };
          }
          if (date === "2016-01-06") return { disabled: true };
          if (date === "2016-01-07") return { holiday: true };
          return undefined;
        }}
      />,
    );
    const cell = container.querySelector('[data-date="2016-01-05"]') as HTMLElement;
    expect(cell).toHaveStyle({ background: "#abcdef", color: "#112233" });
    expect(cell).toHaveAttribute("aria-label", "Pay day");
    expect(cell.textContent).toContain("Payday");
    expect(cell.textContent).toContain("extra");
    const disabled = container.querySelector('[data-date="2016-01-06"]');
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(disabled).toHaveAttribute("tabindex", "-1");
    const holiday = container.querySelector('[data-date="2016-01-07"]');
    expect(holiday).toHaveAttribute("data-yp-holiday", "true");
    expect(holiday).toHaveClass("yp-holiday");
  });

  it("composes getDateMeta with annotation overlays", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("notes", { channel: "annotation" })]}
        items={[
          item("holiday", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { label: "OH", background: "#ffd166" },
          }),
        ]}
        getDateMeta={(date) =>
          date === "2027-02-01" ? { background: "#eeeeee", label: "Base" } : undefined
        }
      />,
    );
    expect(container.querySelector('[data-date="2027-02-01"]')).toHaveStyle({
      background: "#eeeeee",
    });
    expect(container.querySelector('[data-item-id="holiday"]')).toHaveTextContent("OH");
  });

  it("keeps cell and proxy surfaces when render slots add content", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("slot", "ribbon", "2027-02-01", "2027-02-04")]}
        components={{ ItemFragment: ItemFragmentSlot }}
        renderCell={() => <span>cell-extra</span>}
        renderItem={() => <span>item-extra</span>}
      />,
    );
    expect(screen.getAllByText("cell-extra").length).toBeGreaterThan(0);
    expect(screen.getByText("item-extra")).toBeInTheDocument();
    expect(screen.getByTestId("item-slot")).toBeInTheDocument();
    expect(container.querySelector('[data-date="2027-02-01"]')).toHaveAttribute("role", "gridcell");
    expect(proxy(container, "slot")).not.toBeNull();
    expect(
      proxy(container, "slot")?.parentElement?.querySelector('[data-yp-part="resize-end"]'),
    ).not.toBeNull();
  });

  it("uses renderAnnotation and renderEmpty", () => {
    const { container, rerender } = render(
      <YearPlanner
        year={2027}
        layers={[layer("notes", { channel: "annotation" })]}
        items={[item("ann", "notes", "2027-02-01", "2027-02-02", { kind: "annotation" })]}
        renderAnnotation={() => <span>Custom annotation</span>}
      />,
    );
    expect(screen.getByText("Custom annotation")).toBeInTheDocument();
    rerender(<YearPlanner renderEmpty={() => <span>Nothing to plan</span>} />);
    expect(screen.getByText("Nothing to plan")).toBeInTheDocument();
    void container;
  });

  it("drops URL values from item and date colors", () => {
    const malicious = "url(https://attacker.example/pixel)";
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon", { color: "#1d4e89" }), layer("notes", { channel: "annotation" })]}
        items={[
          item("colored", "ribbon", "2027-02-01", "2027-02-04", {
            color: malicious,
            textColor: malicious,
            style: {
              background: 'image-set("https://attacker.example/a" 1x)',
              color: "u\\72l(https://attacker.example/b)",
            } as never,
          }),
          item("annotation", "notes", "2027-02-01", "2027-02-02", {
            kind: "annotation",
            annotation: { background: malicious },
          }),
        ]}
        getDateMeta={(date) =>
          date === "2027-02-01"
            ? {
                background: malicious,
                color: malicious,
                style: { background: 'image-set("https://attacker.example/c" 1x)' },
              }
            : undefined
        }
      />,
    );
    const fragment = container.querySelector(
      '[data-yp-part="item-fragment"][data-item-id="colored"]',
    ) as HTMLElement;
    expect(fragment.style.background).toBe("rgb(29, 78, 137)");
    expect(fragment.style.color).toBe("");
    expect(fragment.getAttribute("style")).not.toContain("attacker");
    const cell = container.querySelector('[data-date="2027-02-01"]') as HTMLElement;
    expect(cell.getAttribute("style") ?? "").not.toContain("attacker");
  });

  it("clears a tooltip when its item becomes hidden", () => {
    const { container, rerender } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("tip", "ribbon", "2027-02-01", "2027-02-04")]}
      />,
    );
    fireEvent.focus(proxy(container, "tip") as Element);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    rerender(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("tip", "ribbon", "2027-02-01", "2027-02-04")]}
        visibility={{ hiddenGroupIds: [], hiddenLayerIds: [], hiddenItemIds: ["tip"] }}
      />,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("never renders metadata as HTML and filters unsafe item styles", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[
          item("safe", "ribbon", "2027-02-01", "2027-02-04", {
            metadata: { html: "<img src=x onerror=alert(1)>" },
            style: {
              backgroundImage: "url(javascript:alert(1))",
              color: "#123456",
            } as never,
          }),
        ]}
      />,
    );
    const fragment = container.querySelector('[data-item-id="safe"]') as HTMLElement;
    expect(container.querySelector("img")).toBeNull();
    expect(fragment.innerHTML).not.toContain("<img");
    expect(fragment.style.backgroundImage).not.toContain("url");
    expect(fragment.style.color).toBe("rgb(18, 52, 86)");
  });

  it("keeps proxies and focus in unstyled mode", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        unstyled
        layers={[layer("ribbon")]}
        items={[item("plain", "ribbon", "2027-02-01", "2027-02-04")]}
      />,
    );
    expect(container.querySelector(".yp-root")).toHaveClass("yp-unstyled");
    expect(proxy(container, "plain")).not.toBeNull();
    expect(proxy(container, "plain")).toHaveAttribute("tabindex", "0");
  });

  it("warns when renderItem nests an interactive control in the proxy", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[item("nested", "ribbon", "2027-02-01", "2027-02-04")]}
        renderItem={() => <button type="button">Nested</button>}
      />,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("must not contain interactive controls"),
      ),
    );
    expect(proxy(container, "nested")?.querySelector("button")).not.toBeNull();
    warn.mockRestore();
  });
});

import {
  buildClassicYearLayout,
  buildRibbonLayout,
  type PlannerItem,
  type PlannerLayer,
  type PlannerModel,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { pointToDate, pointToFragment } from "./geometry";
import { YearPlannerProvider } from "./provider";
import type { YearPlannerHandle } from "./types";
import { YearPlanner } from "./YearPlanner";

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
  startDate = "2016-01-04",
  endDateExclusive = "2016-01-08",
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

const hidden = (overrides: Partial<VisibilityState> = {}): VisibilityState => ({
  hiddenGroupIds: [],
  hiddenLayerIds: [],
  hiddenItemIds: [],
  ...overrides,
});

const fragments = (container: HTMLElement) =>
  container.querySelectorAll('[data-yp-part="item-fragment"]');

describe("RD-03/RD-06 classic grid", () => {
  it("renders 14 month rows with 37 cells each and mirrored headers", () => {
    const { container } = render(<YearPlanner year={2016} />);
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(14);
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(14 * 37);
    expect(screen.getAllByRole("columnheader")).toHaveLength(37 * 2);
    expect(container.querySelector('[data-row-id="2016-01"]')).toBeInTheDocument();
    expect(container.querySelector('[data-row-id="2015-12"]')).toBeInTheDocument();
  });

  it("RD-06-AC-01: applies theme classes without changing geometry", () => {
    const { container, rerender } = render(
      <YearPlanner year={2016} display={{ theme: "classic-blue" }} />,
    );
    expect(container.querySelector(".yp-theme-classic-blue")).toBeInTheDocument();
    const cells = container.querySelectorAll("[data-date]").length;
    rerender(<YearPlanner year={2016} display={{ theme: "classic-yellow" }} />);
    expect(container.querySelector(".yp-theme-classic-yellow")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-date]")).toHaveLength(cells);
  });

  it("renders an empty diagnostic state when no year or range is supplied", () => {
    render(<YearPlanner renderEmpty={() => <span>Pick a year</span>} />);
    expect(screen.getByRole("status")).toHaveTextContent("Pick a year");
  });

  it("renders a 36-month window", () => {
    const { container } = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 36 }} />,
    );
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(36);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "38");
  });

  it("counts header and footer in aria-rowcount", () => {
    render(<YearPlanner year={2016} />);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "16");
    expect(screen.getByRole("grid")).toHaveAttribute("aria-colcount", "37");
  });
});

describe("RD-06 theming and geometry", () => {
  it("applies provider geometry tokens and falls back for print scale", () => {
    const { container } = render(
      <YearPlannerProvider theme={{ rowHeight: 100, weekdayWidth: 60, printScale: 0.5 }}>
        <YearPlanner year={2016} />
      </YearPlannerProvider>,
    );
    const root = container.querySelector(".yp-root") as HTMLElement;
    expect(root.style.getPropertyValue("--yp-print-scale")).toBe("0.5");
    const row = container.querySelector('[data-row-id="2016-01"]') as HTMLElement;
    expect(row.style.height).toBe("100px");
    expect(row.style.gridTemplateColumns).toContain("60px");
  });

  it("lets explicit units win over theme geometry", () => {
    const { container } = render(
      <YearPlannerProvider theme={{ rowHeight: 100 }}>
        <YearPlanner year={2016} units={{ rowHeight: 80, monthBand: 80 }} />
      </YearPlannerProvider>,
    );
    const row = container.querySelector('[data-row-id="2016-01"]') as HTMLElement;
    expect(row.style.height).toBe("80px");
    expect(row.style.gridTemplateColumns).toMatch(/^80px /);
  });

  it("RD-06-AC-02: lets an explicit preset win over the provider and cssVars win over both", () => {
    const { container } = render(
      <YearPlannerProvider theme={{ ribbon: "#111111" }}>
        <YearPlanner
          year={2016}
          display={{ theme: "classic-yellow" }}
          cssVars={{ "--yp-ribbon": "#123456" }}
        />
      </YearPlannerProvider>,
    );
    const root = container.querySelector(".yp-root") as HTMLElement;
    expect(root).toHaveAttribute("data-yp-theme", "classic-yellow");
    expect(root.style.getPropertyValue("--yp-ribbon")).toBe("#123456");
  });

  it("RD-06-AC-05: keeps structure and focus in unstyled mode", () => {
    const { container } = render(<YearPlanner year={2016} unstyled />);
    expect(container.querySelector(".yp-root")).toHaveClass("yp-unstyled");
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(14 * 37);
    expect(container.querySelectorAll("[data-date]")[0]).toHaveAttribute("tabindex", "0");
  });

  it("clamps zoom and reports it once", async () => {
    const onDiagnostic = vi.fn();
    const { container } = render(
      <YearPlanner year={2016} display={{ zoom: 0.5 }} onDiagnostic={onDiagnostic} />,
    );
    const row = container.querySelector('[data-row-id="2016-01"]') as HTMLElement;
    expect(row.style.height).toBe("67.5px");
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_RANGE" })),
    );
  });

  it("scales rows and cells at 0.75, 1 and 1.5", () => {
    const { container, rerender } = render(<YearPlanner year={2016} display={{ zoom: 1 }} />);
    const row = () => container.querySelector('[data-row-id="2016-01"]') as HTMLElement;
    expect(row().style.height).toBe("90px");
    rerender(<YearPlanner year={2016} display={{ zoom: 0.75 }} />);
    expect(row().style.height).toBe("67.5px");
    rerender(<YearPlanner year={2016} display={{ zoom: 1.5 }} />);
    expect(row().style.height).toBe("135px");
  });

  it("localizes Gregorian month and weekday labels", () => {
    const { container } = render(<YearPlanner year={2016} display={{ locale: "de-DE" }} />);
    expect(screen.getAllByText(/^Mär/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mo").length).toBeGreaterThan(0);
    expect(container.querySelector(".yp-week-number")).not.toBeNull();
  });

  it("falls back from an invalid locale and reports it", async () => {
    const onDiagnostic = vi.fn();
    render(
      <YearPlanner year={2016} display={{ locale: "not-a-locale" }} onDiagnostic={onDiagnostic} />,
    );
    expect(screen.getAllByText("Jan").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_LOCALE" }),
      ),
    );
  });

  it("RD-03-AC-06 / RD-06-AC-07: isolates two instances and renders ISO weeks with dir=ltr", () => {
    const { container } = render(
      <div>
        <YearPlanner year={2016} display={{ theme: "classic-blue" }} />
        <YearPlanner year={2017} display={{ theme: "classic-yellow" }} />
      </div>,
    );
    const roots = container.querySelectorAll(".yp-root");
    expect(roots).toHaveLength(2);
    expect(roots[0]).toHaveAttribute("data-yp-theme", "classic-blue");
    expect(roots[1]).toHaveAttribute("data-yp-theme", "classic-yellow");
    expect(roots[0]).toHaveAttribute("dir", "ltr");
    const week = (root: Element, date: string): string | null | undefined =>
      root.querySelector(`[data-date="${date}"] .yp-week-number`)?.textContent;
    expect(week(roots[0] as Element, "2016-01-01")).toBe("53");
    expect(week(roots[0] as Element, "2016-01-04")).toBe("1");
    expect(week(roots[1] as Element, "2017-01-01")).toBe("52");
    expect(week(roots[1] as Element, "2017-01-02")).toBe("1");
  });

  it("scrolls to a date and invalidates geometry on resize", () => {
    const callbacks: ResizeObserverCallback[] = [];
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(<YearPlanner ref={ref} year={2016} />);
    const viewport = container.querySelector('[data-yp-part="viewport"]') as HTMLElement;
    const cell = container.querySelector('[data-date="2016-07-01"]') as HTMLElement;
    Object.defineProperty(viewport, "clientWidth", { value: 200, configurable: true });
    Object.defineProperty(cell, "offsetLeft", { value: 500, configurable: true });
    act(() => ref.current?.scrollToDate("2016-07-01"));
    expect(viewport.scrollLeft).toBe(400);
    act(() => {
      for (const callback of callbacks) callback([], {} as ResizeObserver);
    });
    expect(viewport).toHaveAttribute("data-yp-geometry-version", "1");
    vi.unstubAllGlobals();
  });

  it("RD-06-AC-13: maps pointer coordinates to dates and fragments at every zoom", () => {
    const layoutResult = buildClassicYearLayout({ year: 2016 });
    if (!layoutResult.ok) throw new Error("layout");
    const layout = layoutResult.layout;
    const model: PlannerModel = {
      groups: [],
      layers: [layer("ribbon")],
      items: [item("mapped", "ribbon", "2016-02-01", "2016-02-04")],
      resources: [],
    };
    const ribbons = buildRibbonLayout(layout, { model, visibility: hidden() });
    const february = layout.rows[2];
    const column = february?.columns.find((entry) => entry.date === "2016-02-01");
    if (!february || !column) throw new Error("missing column");
    const fragment = ribbons.fragments.find((entry) => entry.itemId === "mapped");
    const row = ribbons.rows.find((entry) => entry.rowId === "2016-02");
    if (!fragment || !row) throw new Error("missing fragment");
    for (const zoom of [0.75, 1, 1.5]) {
      const view = {
        zoom,
        monthBandWidth: 70,
        scrollLeft: 0,
        scrollTop: 0,
        viewportRect: { left: 0, top: 0, width: 1200, height: 900 },
        headerHeight: 36,
      };
      const datePoint = {
        clientX: (70 + column.x + 1) * zoom,
        clientY: 36 + (february.rowIndex * 90 + 5) * zoom,
      };
      expect(pointToDate(layout, datePoint, view)).toBe("2016-02-01");
      const fragmentPoint = {
        clientX: (70 + fragment.x + 1) * zoom,
        clientY: 36 + (row.top + fragment.y + 1) * zoom,
      };
      expect(pointToFragment(ribbons, fragmentPoint, view)?.itemId).toBe("mapped");
    }
  });

  it("falls back from invalid display options without throwing", async () => {
    const onDiagnostic = vi.fn();
    const { container } = render(
      <YearPlanner
        year={2016}
        display={{
          density: "grid" as never,
          compactMaxLanes: 0,
          displayTimeZone: "Mars/Olympus",
          connectorMode: "edge-path",
        }}
        onDiagnostic={onDiagnostic}
      />,
    );
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(14);
    await waitFor(() => {
      const codes = onDiagnostic.mock.calls.map(([diagnostic]) => diagnostic.code);
      expect(codes).toEqual(
        expect.arrayContaining(["INVALID_COMMAND", "INVALID_TIMEZONE", "INVALID_RENDERER_OPTION"]),
      );
    });
  });

  it("warns when items are controlled and a default is supplied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <YearPlanner
        year={2016}
        layers={[layer("ribbon")]}
        items={[item("controlled", "ribbon")]}
        defaultItems={[item("default", "ribbon")]}
      />,
    );
    expect(fragments(container)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`items` is controlled"));
    warn.mockRestore();
  });
});

describe("RD-06 visibility, selection and filter", () => {
  it("seeds visibility from the default preset and reducer actions", () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        groups={[{ id: "g", name: "G" }]}
        layers={[layer("ribbon", { groupId: "g" })]}
        items={[item("hidden", "ribbon")]}
        defaultVisibility={hidden({ hiddenGroupIds: ["g"] })}
      />,
    );
    expect(fragments(container)).toHaveLength(0);
    act(() => ref.current?.showGroup("g"));
    expect(fragments(container)).toHaveLength(1);
  });

  it("seeds defaultVisible=false layers and can show them", () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={[layer("ribbon", { defaultVisible: false })]}
        items={[item("hidden", "ribbon")]}
      />,
    );
    expect(fragments(container)).toHaveLength(0);
    act(() => ref.current?.showLayer("ribbon"));
    expect(fragments(container)).toHaveLength(1);
  });

  it("RD-04-AC-09: emits onVisibilityChange for controlled and imperative changes", () => {
    const onVisibilityChange = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    const controlled = hidden({ hiddenGroupIds: ["g"] });
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        groups={[{ id: "g", name: "G" }]}
        layers={[layer("ribbon", { groupId: "g" })]}
        items={[item("hidden", "ribbon")]}
        visibility={controlled}
        onVisibilityChange={onVisibilityChange}
      />,
    );
    act(() => ref.current?.showGroup("g"));
    expect(onVisibilityChange).toHaveBeenCalledTimes(1);
    expect(onVisibilityChange.mock.calls[0]?.[0]).toMatchObject({ hiddenGroupIds: [] });

    const uncontrolled = vi.fn();
    const second = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={second}
        year={2016}
        layers={[layer("ribbon")]}
        items={[item("hidden", "ribbon")]}
        defaultVisibility={hidden({ hiddenLayerIds: ["ribbon"] })}
        onVisibilityChange={uncontrolled}
      />,
    );
    act(() => second.current?.showLayer("ribbon"));
    expect(uncontrolled).toHaveBeenCalledTimes(1);
  });

  it("keeps channels hidden when showAll clears item/group flags", () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        groups={[{ id: "g", name: "G" }]}
        layers={[layer("ribbon", { groupId: "g" })]}
        items={[item("hidden", "ribbon")]}
        defaultVisibility={hidden({
          hiddenGroupIds: ["g"],
          hiddenChannels: ["ribbon"],
        })}
      />,
    );
    act(() => ref.current?.showAll());
    expect(fragments(container)).toHaveLength(0);
  });

  it("applies selection and rejects ranges containing disabled dates", () => {
    const onSelectionChange = vi.fn();
    const ref = createRef<YearPlannerHandle>();
    render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={[layer("ribbon")]}
        items={[item("selected", "ribbon")]}
        getDateMeta={(date) => (date === "2016-07-01" ? { disabled: true } : undefined)}
        onSelectionChange={onSelectionChange}
      />,
    );
    act(() =>
      ref.current?.selectRange({
        startDate: "2016-07-01",
        endDateExclusive: "2016-07-03",
      }),
    );
    expect(onSelectionChange).not.toHaveBeenCalled();
    act(() =>
      ref.current?.selectRange({
        startDate: "2016-07-04",
        endDateExclusive: "2016-07-06",
      }),
    );
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it("renders controlled and default selection as aria-pressed", () => {
    const { container, rerender } = render(
      <YearPlanner
        year={2016}
        layers={[layer("ribbon")]}
        items={[item("selected", "ribbon")]}
        defaultSelection={{ dates: [], items: ["selected"] }}
      />,
    );
    expect(container.querySelector('[data-item-id="selected"] [role="button"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    rerender(
      <YearPlanner
        year={2016}
        layers={[layer("ribbon")]}
        items={[item("selected", "ribbon")]}
        selection={{ dates: [], items: [] }}
      />,
    );
    expect(container.querySelector('[data-item-id="selected"] [role="button"]')).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("filters by search and updates through the handle", () => {
    const ref = createRef<YearPlannerHandle>();
    const { container } = render(
      <YearPlanner
        ref={ref}
        year={2016}
        layers={[layer("ribbon")]}
        items={[
          item("alpha", "ribbon", "2016-02-01", "2016-02-04", { title: "Alpha" }),
          item("beta", "ribbon", "2016-02-01", "2016-02-04", { title: "Beta" }),
        ]}
        defaultFilter={{ search: "alpha" }}
      />,
    );
    expect(fragments(container)).toHaveLength(1);
    act(() => ref.current?.setFilter({ search: "beta" }));
    expect(fragments(container)).toHaveLength(1);
    act(() => ref.current?.setFilter({}));
    expect(fragments(container)).toHaveLength(2);
  });

  it("projects timed items and keeps their source period", () => {
    const timed = item("timed", "ribbon", "2027-02-01", "2027-02-02", {
      period: {
        kind: "timed",
        start: "2027-01-31T23:30:00Z",
        endExclusive: "2027-02-01T01:00:00Z",
        timeZone: "UTC",
      },
    });
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer("ribbon")]}
        items={[timed]}
        display={{ displayTimeZone: "UTC" }}
      />,
    );
    expect(
      container.querySelectorAll('[data-yp-part="item-fragment"][data-item-id="timed"]'),
    ).toHaveLength(2);
    expect(
      container.querySelector('[data-item-id="timed"] [role="button"]')?.getAttribute("aria-label"),
    ).toContain("timed");
  });

  it("reopens the inspector when showInspector changes from false to true", () => {
    const { rerender } = render(<YearPlanner year={2016} showInspector={false} />);
    expect(screen.queryByRole("complementary", { name: "Planner inspector" })).toBeNull();
    rerender(<YearPlanner year={2016} showInspector />);
    expect(screen.getByRole("complementary", { name: "Planner inspector" })).toBeInTheDocument();
  });

  it("moves date focus with arrow keys", () => {
    const { container } = render(<YearPlanner year={2016} />);
    const first = container.querySelector('[data-date="2015-12-01"]');
    if (!first) throw new Error("missing first date");
    expect(first).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(container.querySelector('[data-date="2015-12-02"]')).toHaveAttribute("tabindex", "0");
  });
});

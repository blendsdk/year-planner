import { A3_LANDSCAPE_INNER_WIDTH } from "@blendsdk/year-planner-core";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

const layer = { id: "ribbon", name: "Ribbon", channel: "ribbon" as const, color: "#1d4e89" };

const item = {
  id: "booking",
  kind: "activity" as const,
  layerId: "ribbon",
  period: { kind: "all-day" as const, startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
  title: "Booking",
  version: 1,
};

const printPages = (container: HTMLElement) =>
  container.querySelectorAll('[data-yp-part="print-page"]');

describe("RD-06 print output", () => {
  it.each([
    [14, 1, [14]],
    [24, 2, [14, 10]],
    [36, 3, [14, 14, 8]],
  ])("plans %i months as %i A3 pages", (months, pageCount, rowCounts) => {
    const { container } = render(
      <YearPlanner
        range={{ start: { year: 2027, month: 0 }, monthCount: months }}
        layers={[layer]}
        items={[item]}
      />,
    );
    const pages = printPages(container);
    expect(pages).toHaveLength(pageCount);
    pages.forEach((page, index) => {
      expect(page.querySelectorAll("[data-print-row-id]")).toHaveLength(rowCounts[index] ?? 0);
    });
  });

  it("uses readable white text for a dark print layer", () => {
    const { container } = render(<YearPlanner year={2027} layers={[layer]} items={[item]} />);
    const fragment = container.querySelector('[data-print-item-id="booking"]') as HTMLElement;
    expect(fragment.style.color).toBe("rgb(255, 255, 255)");
  });

  it("renders labels, weekends, ISO weeks and fragments in print", () => {
    const { container } = render(<YearPlanner year={2027} layers={[layer]} items={[item]} />);
    const tree = container.querySelector('[data-yp-part="print-pages"]') as HTMLElement;
    expect(tree.textContent).toContain("Feb");
    expect(tree.textContent).toContain("Wed");
    expect(tree.querySelector(".yp-print-week")).not.toBeNull();
    expect(tree.querySelector('[data-print-item-id="booking"]')).not.toBeNull();
    expect(tree.querySelector(".yp-print-weekend")).not.toBeNull();
    expect(tree.querySelectorAll(".yp-print-heading")).toHaveLength(74);
  });

  it("prints only visible compact lanes and no overflow fragments", () => {
    const items = Array.from({ length: 20 }, (_, index) => ({
      id: `overflow-${index}`,
      kind: "activity" as const,
      layerId: "ribbon",
      period: { kind: "all-day" as const, startDate: "2027-04-01", endDateExclusive: "2027-04-04" },
      title: `Overflow ${index}`,
      version: 1,
    }));
    const { container } = render(<YearPlanner year={2027} layers={[layer]} items={items} />);
    const tree = container.querySelector('[data-yp-part="print-pages"]') as HTMLElement;
    expect(tree.querySelectorAll('[data-print-item-id^="overflow-"]')).toHaveLength(3);
  });

  it("uses the width-bound fit scale and exposes the print theme", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        display={{ theme: "print" }}
        layers={[layer]}
        items={[item]}
        print={{ mode: "fit" }}
      />,
    );
    const page = printPages(container)[0] as HTMLElement;
    const scale = Number(page.style.getPropertyValue("--yp-print-scale"));
    expect(scale).toBeCloseTo(1542 / 1995, 4);
    expect(container.querySelector(".yp-root")).toHaveAttribute("data-yp-theme", "print");
  });

  it("uses the full ribbon width for non-default units", () => {
    const { container } = render(
      <YearPlanner
        range={{ start: { year: 2027, month: 0 }, monthCount: 14 }}
        units={{ monthBand: 80, weekday: 60 }}
        layers={[layer]}
        items={[item]}
      />,
    );
    const page = printPages(container)[0] as HTMLElement;
    const surface = page.querySelector(".yp-print-surface") as HTMLElement;
    expect(surface.style.width).toBe("2140px");
    const scale = Number(page.style.getPropertyValue("--yp-print-scale"));
    expect(scale).toBeLessThanOrEqual(A3_LANDSCAPE_INNER_WIDTH / 2140);
  });

  it("falls back to a default plan for invalid print options and reports it", async () => {
    const onDiagnostic = vi.fn();
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[layer]}
        items={[item]}
        print={{ rowsPerPage: 0 }}
        onDiagnostic={onDiagnostic}
      />,
    );
    expect(printPages(container)).toHaveLength(1);
    await waitFor(() =>
      expect(onDiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INVALID_PRINT_OPTIONS" }),
      ),
    );
  });
});

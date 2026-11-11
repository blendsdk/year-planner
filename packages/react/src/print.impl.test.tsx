import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

const layer = { id: "ribbon", name: "Ribbon", channel: "ribbon" as const, color: "#1d4e89" };

const pages = (container: HTMLElement) => container.querySelectorAll('[data-yp-part="print-page"]');

describe("print implementation", () => {
  it("paginates 36 rows as 14/14/8 without splitting a month", () => {
    const { container } = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 36 }} />,
    );
    const rendered = pages(container);
    expect(rendered).toHaveLength(3);
    expect(rendered[0]?.querySelectorAll("[data-print-row-id]")).toHaveLength(14);
    expect(rendered[1]?.querySelectorAll("[data-print-row-id]")).toHaveLength(14);
    expect(rendered[2]?.querySelectorAll("[data-print-row-id]")).toHaveLength(8);
  });

  it("warns and keeps one fit page when the date text would be too small", () => {
    const { container } = render(
      <YearPlanner
        range={{ start: { year: 2027, month: 0 }, monthCount: 18 }}
        print={{ mode: "fit" }}
      />,
    );
    const rendered = pages(container);
    expect(rendered).toHaveLength(1);
    const scale = Number((rendered[0] as HTMLElement).style.getPropertyValue("--yp-print-scale"));
    expect(scale).toBeLessThan(1);
    expect(scale * 12 * 0.75).toBeLessThan(7);
  });

  it("renders an annotated booking and a background highlight", () => {
    const { container } = render(
      <YearPlanner
        year={2027}
        layers={[
          layer,
          { id: "notes", name: "Notes", channel: "annotation", color: "#ffd166" },
          { id: "bg", name: "Background", channel: "background", color: "#e3f7fc" },
        ]}
        items={[
          {
            id: "booking",
            kind: "activity",
            layerId: "ribbon",
            period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-04" },
            title: "Booking",
            version: 1,
          },
          {
            id: "holiday",
            kind: "annotation",
            layerId: "notes",
            period: { kind: "all-day", startDate: "2027-02-03", endDateExclusive: "2027-02-04" },
            title: "Holiday",
            version: 1,
            annotation: { label: "OH" },
          },
          {
            id: "tint",
            kind: "highlight",
            layerId: "bg",
            period: { kind: "all-day", startDate: "2027-02-01", endDateExclusive: "2027-02-10" },
            version: 1,
          },
        ]}
      />,
    );
    const tree = container.querySelector('[data-yp-part="print-pages"]') as HTMLElement;
    expect(tree.querySelector('[data-print-item-id="booking"]')?.textContent).toContain("Booking");
    expect(tree.querySelector('[data-print-item-id="holiday"]')?.textContent).toContain("OH");
    expect(tree.querySelector('[data-print-item-id="tint"]')).not.toBeNull();
  });
});

describe("RD-10-AC-06: short-window print pages", () => {
  it("prints a 12-month window as one page and an 18-month window as two", () => {
    const twelve = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 12 }} />,
    );
    expect(pages(twelve.container)).toHaveLength(1);
    expect(pages(twelve.container)[0]?.querySelectorAll("[data-print-row-id]")).toHaveLength(12);
    twelve.unmount();

    const eighteen = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 18 }} />,
    );
    expect(pages(eighteen.container)).toHaveLength(2);
    expect(pages(eighteen.container)[0]?.querySelectorAll("[data-print-row-id]")).toHaveLength(14);
    expect(pages(eighteen.container)[1]?.querySelectorAll("[data-print-row-id]")).toHaveLength(4);
  });
});

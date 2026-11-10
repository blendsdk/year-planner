import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("minimal grid implementation details", () => {
  it("keeps blank slots out of the focus order and date labels mirrored", () => {
    const { container } = render(<YearPlanner year={2016} />);
    const allCells = container.querySelectorAll('[role="gridcell"]');
    const datedCells = container.querySelectorAll("[data-date]");
    expect(allCells.length - datedCells.length).toBe(90);
    expect(container.querySelectorAll(".yp-month")).toHaveLength(28);
    expect(datedCells[0]).toHaveAttribute("tabindex", "0");
    expect(datedCells[1]).toHaveAttribute("tabindex", "-1");
  });

  it("moves date focus with arrow keys", () => {
    const { container } = render(<YearPlanner year={2016} />);
    const first = container.querySelector('[data-date="2015-12-01"]');
    if (!first) throw new Error("missing first date");
    expect(first).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(first, { key: "ArrowRight" });
    const second = container.querySelector('[data-date="2015-12-02"]');
    expect(second).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(second as Element, { key: "ArrowDown" });
    expect(container.querySelector('[data-date="2015-12-09"]')).toHaveAttribute("tabindex", "0");
  });

  it("keeps a 36-month window keyboard reachable", () => {
    const { container } = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 36 }} />,
    );
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(36);
    expect(container.querySelector('[data-date="2027-01-01"]')).toHaveAttribute("tabindex", "0");
  });
});

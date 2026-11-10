import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("RD-03-AC-01/02: minimal classic grid", () => {
  it("renders 14 month rows with 37 cells each and mirrored headers", () => {
    const { container } = render(<YearPlanner year={2016} />);
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(14);
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(14 * 37);
    expect(screen.getAllByRole("columnheader")).toHaveLength(37 * 2);
    expect(container.querySelector('[data-row-id="2016-01"]')).toBeInTheDocument();
    expect(container.querySelector('[data-row-id="2015-12"]')).toBeInTheDocument();
    expect(container.querySelector('[data-row-id="2017-01"]')).toBeInTheDocument();
  });

  it("applies the classic theme classes without changing geometry", () => {
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
    render(<YearPlanner />);
    expect(screen.getByRole("status")).toHaveTextContent(/required/i);
  });

  it("renders a 36-month window", () => {
    const { container } = render(
      <YearPlanner range={{ start: { year: 2027, month: 0 }, monthCount: 36 }} />,
    );
    expect(container.querySelectorAll("[data-row-id]")).toHaveLength(36);
  });
});

import { render } from "@testing-library/react";
import { version } from "react";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("RD-10-AC-04: React 19 runtime", () => {
  it("renders the planner on the React 19 runtime", () => {
    expect(version.startsWith("19.")).toBe(true);
    const { container } = render(<YearPlanner year={2016} />);
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="gridcell"]').length).toBeGreaterThan(0);
  });
});

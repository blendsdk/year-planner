// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("RD-06-AC-10: SSR", () => {
  it("renders the grid and labels without browser globals", () => {
    const html = renderToString(<YearPlanner year={2016} />);
    expect(html).toContain('role="grid"');
    expect(html).toContain('role="gridcell"');
    expect(html).toContain("2015-12");
    expect(html).toContain("2016-01");
    expect(html).not.toContain("ResizeObserver");
  });

  it("produces deterministic markup across calls", () => {
    const first = renderToString(<YearPlanner year={2016} />);
    const second = renderToString(<YearPlanner year={2016} />);
    expect(first).toBe(second);
  });
});

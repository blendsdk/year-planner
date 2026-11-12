import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Demo and evidence contract for the RD-11 close-out.
 *
 * The private demo is the runnable proof of the controlled states; the test
 * report is the durable evidence record. Both are part of the documentation
 * surface even though the demo is not published.
 */

const ROOT = new URL("../../", import.meta.url);

/** Reads a repository file relative to the root. */
function read(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

describe("RD-11-AC-08: demo routes", () => {
  it("renders a shared navigation for every demonstration route", () => {
    const app = read("apps/demo/src/App.tsx");
    expect(app).toContain("DemoNav");
    for (const route of [
      "?commands=1",
      "?interaction=1",
      "?ac3=1",
      "?security=1",
      "?print=prt01",
    ]) {
      expect(app, `demo navigation is missing ${route}`).toContain(route);
    }
  });

  it("documents the routes for a reader", () => {
    for (const path of ["README.md", "docs/getting-started.md"]) {
      const lower = read(path).toLowerCase();
      for (const route of ["?commands=1", "?interaction=1", "?security=1"]) {
        expect(lower, `${path} is missing ${route}`).toContain(route);
      }
    }
  });
});

describe("RD-11-AC-10: evidence report", () => {
  it("records the documentation evidence and its known gaps", () => {
    const report = read("docs/test-report.md");
    expect(report).toContain("RD-11");
    expect(report).toContain("docs:site");
    expect(report.toLowerCase()).toContain("storybook");
    expect(report.toLowerCase()).toMatch(/parked|known gap/);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");
const selectors = css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("}")
  .map((block) => block.split("{")[0]?.trim())
  .filter((selector): selector is string => Boolean(selector && !selector.startsWith("@")));

describe("RD-06 CSS contract", () => {
  it("scopes selectors and avoids !important", () => {
    expect(css).not.toContain("!important");
    for (const selector of selectors) {
      if (!selector.startsWith(".")) continue;
      expect(selector === ":root").toBe(false);
      expect(selector.includes("yp-")).toBe(true);
    }
  });

  it("implements unstyled and combined print tint rules", () => {
    expect(css).toContain(".yp-unstyled .yp-cell");
    expect(css).toContain(".yp-unstyled .yp-fragment");
    expect(css).toContain(".yp-print-context.yp-print-weekend");
    expect(css).toContain(".yp-fragment-ribbon");
  });

  it("declares ordered CSS layers", () => {
    expect(css).toContain(
      "@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;",
    );
  });
});

describe("RD-09 CSS contract", () => {
  it("declares the computed ribbon text colour and a focus halo", () => {
    expect(css).toContain("--yp-ribbon-text");
    expect(css).toContain("color: var(--yp-ribbon-text)");
    expect(css).toContain("outline-offset: 2px");
    expect(css).toContain("box-shadow: 0 0 0 4px var(--yp-surface)");
  });

  it("declares 24 px targets", () => {
    expect(css).toContain("--yp-lane-height: 24px");
    expect(css).toContain("min-width: 24px");
    expect(css).toContain("min-height: 24px");
    expect(css).toContain("width: 24px");
    expect(css).toContain("height: 24px");
  });

  it("declares non-colour cues", () => {
    expect(css).toContain('.yp-cell[aria-selected="true"]');
    expect(css).toContain(".yp-cell.yp-holiday .yp-day-number");
    expect(css).toContain('.yp-proxy[aria-pressed="true"]');
    expect(css).toContain('.yp-item-list-entry[aria-pressed="true"]');
  });

  it("declares forced-colours, reduced-motion and print rules", () => {
    expect(css).toContain("@media (forced-colors: active)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media print");
    expect(css).toContain(".yp-command-status");
    expect(css).toContain(".yp-skip-link");
  });
});

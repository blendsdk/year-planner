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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(join(root, path), "utf8");

const styles = read("packages/react/src/styles.css");
const types = read("packages/react/src/types.ts");
const fit = read("packages/react/src/fit.ts");
const monthRow = read("packages/react/src/render/MonthRow.tsx");

describe("RD-13-AC-04: header typography tokens", () => {
  it("declares the type tokens once in the theme root", () => {
    for (const token of [
      "--yp-font-size-heading",
      "--yp-font-size-month",
      "--yp-font-size-day",
      "--yp-font-size-cell-label",
      "--yp-line-height-tight",
    ]) {
      expect(styles, token).toContain(`${token}:`);
    }
    const rootBlock = styles.slice(
      styles.indexOf(":where(.yp-root)"),
      styles.indexOf(".yp-sr-only"),
    );
    expect(rootBlock).toContain("--yp-font-size-heading");
    expect(rootBlock).toContain("--yp-font-size-month");
  });

  it("uses tokens in the header and removes the old hard-coded sizes", () => {
    const blocks = (selector: string): string[] =>
      [...styles.matchAll(new RegExp(`\\.${selector} \\{([^}]*)\\}`, "g"))].map(
        (match) => match[1] ?? "",
      );
    const heading = blocks("yp-heading").at(-1) ?? "";
    const month = blocks("yp-month")[1] ?? blocks("yp-month")[0] ?? "";
    expect(heading).toContain("font-size: var(--yp-font-size-heading)");
    expect(month).toContain("font-size: var(--yp-font-size-month)");
    expect(month).toContain("line-height: var(--yp-line-height-tight)");
    expect(heading).not.toContain("font-size: 14px");
    expect(month).not.toContain("font-size: 18px");
  });

  it("centres the month label in both axes", () => {
    const month = styles.slice(
      styles.indexOf(".yp-month {"),
      styles.indexOf(".yp-month.yp-context"),
    );
    expect(month).toContain("align-items: center");
    expect(month).toContain("justify-content: center");
    expect(month).toContain("text-align: center");
    expect(monthRow).toContain("String(row.year).slice(-2)");
    expect(monthRow).not.toContain('row.kind === "current" ?');
    expect(monthRow).toContain("title={labelTitle}");
  });

  it("keeps day and week numbers on tabular numerals", () => {
    const rootBlock = styles.slice(
      styles.indexOf(":where(.yp-root)"),
      styles.indexOf(".yp-sr-only"),
    );
    expect(rootBlock).toContain("font-variant-numeric: tabular-nums");
  });
});

describe("RD-13-AC-10: fit contract", () => {
  it("exposes fit with contain as the default", () => {
    expect(types).toContain('fit?: "none" | "contain"');
    expect(types).toContain("defaults to `contain`");
  });

  it("keeps the 24 px floor and the three lane budgets", () => {
    expect(fit).toContain("FIT_MIN_TARGET = 24");
    expect(fit).toContain("lanes: number");
    expect(fit).toContain("zoomY: 1");
    for (const id of ["comfortable", "compact", "dense"]) {
      expect(fit).toContain(`id: "${id}"`);
    }
  });

  it("does not introduce a transform scale or a renderer rewrite", () => {
    // Print keeps its existing A3 scale; the screen fit must not scale the grid.
    expect(fit).not.toContain("transform");
    expect(monthRow).not.toContain("transform");
    for (const path of [
      "packages/react/src/YearPlanner.tsx",
      "packages/core/src/ribbon/fragments.ts",
    ]) {
      const source = read(path);
      expect(source).not.toContain('getContext("2d")');
      expect(source).not.toContain("WebGL");
      expect(source).not.toContain("customElements.define");
    }
  });
});

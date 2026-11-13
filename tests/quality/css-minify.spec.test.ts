import { describe, expect, it } from "vitest";
import { minifyCss } from "../../scripts/minify-css.mjs";

/**
 * Published CSS minifier contract.
 *
 * The package build minifies the readable source stylesheet. These checks prove
 * that the transformation removes only comments and redundant whitespace, so
 * cascade layers, custom properties and calc expressions survive unchanged.
 */

describe("RD-06-AC-06: published CSS minifier", () => {
  it("RD-06-AC-06: removes comments and redundant whitespace without changing values", () => {
    const source = [
      "@layer a, b;",
      "/* explanatory comment */",
      ":root {",
      "  --width: calc(100% - 2px);",
      '  font-family: "Arial", sans-serif;',
      "}",
      "",
    ].join("\n");
    expect(minifyCss(source)).toBe(
      '@layer a,b;:root{--width:calc(100% - 2px);font-family:"Arial",sans-serif}',
    );
  });

  it("keeps descendant and media-query spacing", () => {
    const source = "@media print and (min-width: 10px) { .a .b { color: red; } }";
    expect(minifyCss(source)).toBe("@media print and (min-width:10px){.a .b{color:red}}");
  });
});

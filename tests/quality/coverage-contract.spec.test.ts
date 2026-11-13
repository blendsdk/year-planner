import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

/** Extracts one numeric coverage threshold from a Vitest config source. */
function threshold(source: string, name: "lines" | "branches"): number {
  const match = new RegExp(`${name}:\\s*(\\d+)`).exec(source);
  if (!match?.[1]) throw new Error(`missing ${name} threshold`);
  return Number(match[1]);
}

/**
 * These contracts stop a future change from quietly lowering the measured
 * quality floor that the release evidence depends on.
 */
describe("RD-10-AC-03: coverage floor", () => {
  it("keeps the core floor at or above 90 percent", () => {
    const source = read("packages/core/vitest.config.ts");
    expect(threshold(source, "lines")).toBeGreaterThanOrEqual(90);
    expect(threshold(source, "branches")).toBeGreaterThanOrEqual(90);
  });

  it("keeps the React floor at or above 80 percent", () => {
    const source = read("packages/react/vitest.config.ts");
    expect(threshold(source, "lines")).toBeGreaterThanOrEqual(80);
    expect(threshold(source, "branches")).toBeGreaterThanOrEqual(80);
  });
});

describe("RD-10-AC-12: bundle measurement contract", () => {
  it("measures the React entry plus CSS against 60 kB", () => {
    const source = read("scripts/check-size.mjs");
    const budgets = read("scripts/bench-budgets.mjs");
    expect(budgets).toMatch(/reactEntryCssKb:\s*60/);
    expect(source).toContain("BUDGETS.reactEntryCssKb");
    expect(source).toContain("packages/react/dist/index.js");
    expect(source).toContain("packages/react/dist/styles.css");
  });

  it("keeps the installed total against 72 kB", () => {
    const source = read("scripts/check-size.mjs");
    const budgets = read("scripts/bench-budgets.mjs");
    expect(budgets).toMatch(/totalInstalledKb:\s*72/);
    expect(source).toContain("BUDGETS.totalInstalledKb");
    expect(source).toContain("packages/core/dist");
  });

  it("measures the optional languages package separately", () => {
    const source = read("scripts/check-size.mjs");
    const budgets = read("scripts/bench-budgets.mjs");
    expect(budgets).toMatch(/languagesCataloguesKb:\s*95/);
    expect(budgets).toMatch(/languagePackKb:\s*8/);
    expect(source).toContain("packages/languages/dist/index.js");
    expect(source).toContain("packages/languages/dist/locales");
  });

  it("reports both measurements", () => {
    const source = read("scripts/check-size.mjs");
    expect(source).toContain("React entry + CSS");
    expect(source).toContain("Total installed");
  });
});

describe("RD-10-AC-03: command contract", () => {
  it("exposes the quality, coverage and API report commands", () => {
    const manifest = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    };
    expect(manifest.scripts).toBeDefined();
    for (const name of ["test:coverage", "test:quality", "typecheck:tools", "api-report:ci"]) {
      expect(manifest.scripts?.[name], name).toBeDefined();
    }
  });
});

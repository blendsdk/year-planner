import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUDGETS, CEILING_FACTOR, statusFor } from "../../scripts/bench-budgets.mjs";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("RD-10-AC-11: benchmark command contract", () => {
  it("exposes the perf and bench commands", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts["test:perf"]).toContain("playwright.bench.config.ts");
    expect(scripts["test:perf"]).toContain("bench-preview");
    expect(scripts.bench).toContain("scripts/bench.mjs");
  });

  it("declares the production and development projects on fixed ports", () => {
    const config = read("playwright.bench.config.ts");
    expect(config).toContain("bench-preview");
    expect(config).toContain("bench-dev");
    expect(config).toContain("4174");
    expect(config).toContain("4175");
    expect(config).toContain('testDir: "./tests/perf"');
  });

  it("orchestrates layout, browser, aggregation and the ceiling", () => {
    const source = read("scripts/bench.mjs");
    expect(source).toContain("bench-layout.mjs");
    expect(source).toContain("playwright.bench.config.ts");
    expect(source).toContain("--out");
    expect(source).toContain("STRESS_CEILINGS");
    expect(source).toContain("enforcingCeiling");
    expect(source).toContain("test-results/bench");
    expect(read("tests/perf/bench.spec.ts")).toContain(".cpuprofile");
  });

  it("covers every required scenario", () => {
    const spec = read("tests/perf/bench.spec.ts");
    for (const scenario of [
      "initial render 500/2k/10k compact",
      "initial render 12/14/18/24/36 months",
      "compact drag 500/2k/10k",
      "expanded drag 500",
      "overflow open and close with 10k items",
      "issue-3 production drag",
      "36-month 500-item drag",
      "500-item dev drag",
      "RD-13-AC-03: product-quality performance",
      "initial render 500/2k unthrottled and 4x",
      "drag 2k work per frame and input delay",
      "click-to-select 500/2k",
    ]) {
      expect(spec, scenario).toContain(scenario);
    }
    expect(spec).toContain("expectTarget");
    expect(spec).toContain("workPerFrameMs");
    expect(spec).toContain("measureClick");
  });
});

describe("RD-10-AC-11: benchmark budgets", () => {
  it("exports every RD budget", () => {
    expect(BUDGETS.layout10kP95Ms).toBe(250);
    expect(BUDGETS.layoutP95Ms).toBe(250);
    expect(BUDGETS.dragP95Ms).toBe(16.7);
    expect(BUDGETS.dragWorkPerFrameMs).toBe(8);
    expect(BUDGETS.dragInputDelayP95Ms).toBe(16.7);
    expect(BUDGETS.clickWorkP95Ms).toBe(50);
    expect(BUDGETS.overflowMs).toBe(100);
    expect(BUDGETS.initialRenderP95Ms).toBe(150);
    expect(BUDGETS.reactEntryCssKb).toBe(60);
    expect(BUDGETS.totalInstalledKb).toBe(65);
    expect(CEILING_FACTOR).toBe(2);
  });

  it("classifies pass, miss and fail", () => {
    expect(statusFor(10, 20)).toBe("pass");
    expect(statusFor(30, 20)).toBe("miss");
    expect(statusFor(42, 20)).toBe("fail");
    expect(statusFor(16.8, 16.7, true)).toBe("pass");
    expect(statusFor(33.4, 16.7, true)).toBe("miss");
    expect(statusFor(17.6, 16.7)).toBe("miss");
  });
});

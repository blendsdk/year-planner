import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const manifest = JSON.parse(read("package.json")) as {
  scripts?: Record<string, string>;
};
const scripts = manifest.scripts ?? {};

describe("RD-10-AC-12 / RD-10-AC-14: command and consumer contract", () => {
  it("exposes every documented quality command", () => {
    const expected: Record<string, string> = {
      "typecheck:tools": "tsconfig.tools.json",
      "test:quality": "vitest.quality.config.ts",
      "test:timezones": "scripts/test-timezones.sh",
      "test:audit": "pnpm audit --audit-level high",
      "test:licenses": "scripts/write-licenses.mjs",
      "test:perf": "playwright.bench.config.ts",
      "test:environment": "scripts/ci-environment.mjs",
      bench: "scripts/bench.mjs",
      "test:flaky": "--repeat-each=3",
      "test:a11y": "accessibility.spec.ts",
      "test:mobile": "mobile.spec.ts",
      "test:visual": "@visual",
      "test:print": "@print",
      "test:consumer": "scripts/clean-consumer.sh",
    };
    for (const [name, fragment] of Object.entries(expected)) {
      expect(scripts[name], name).toContain(fragment);
    }
  });

  it("wires the gates into verify and verify:full", () => {
    expect(scripts.verify).toContain("typecheck:tools");
    expect(scripts.verify).toContain("test:quality");
    expect(scripts.verify).toContain("test:licenses");
    expect(scripts["verify:full"]).toContain("test:e2e");
    expect(scripts["verify:full"]).toContain("test:timezones");
    expect(scripts["verify:full"]).toContain("test:audit");
    expect(scripts["verify:full"]).toContain("test:perf");
    expect(scripts["verify:full"]).toContain("bench");
    expect(scripts["verify:full"]).toContain("test:consumer");
  });

  it("proves packed types, the CSS import and a production build in the clean consumer", () => {
    const consumer = read("scripts/clean-consumer.sh");
    expect(consumer).toContain("tsc --noEmit");
    expect(consumer).toContain("vite build");
    expect(consumer).toContain("@blendsdk/react-year-planner/styles.css");
    expect(consumer).toContain("YearPlanner");
  });
});

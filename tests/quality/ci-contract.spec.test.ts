import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const workflow = read(".github/workflows/ci.yml");
const playwright = read("playwright.config.ts");
const report = read("docs/test-report.md");

describe("RD-10-AC-01: release gate evidence", () => {
  it("declares every CI job", () => {
    for (const job of ["verify", "browsers", "security", "performance", "dco"]) {
      expect(workflow, job).toMatch(new RegExp(`^  ${job}:`, "m"));
    }
  });

  it("runs verify, timezones and the consumer in the verify job", () => {
    expect(workflow).toContain("pnpm verify");
    expect(workflow).toContain("pnpm test:timezones");
    expect(workflow).toContain("pnpm test:consumer");
  });

  it("captures the environment and uploads browser evidence", () => {
    expect(workflow).toContain(
      "node scripts/ci-environment.mjs --out test-results/environment.txt",
    );
    expect(workflow).toMatch(/path: \|\s*\n\s+test-results\/\s*\n\s+playwright-report\//);
  });

  it("runs the security and performance evidence jobs", () => {
    expect(workflow).toContain("pnpm test:audit");
    expect(workflow).toContain("pnpm test:licenses");
    expect(workflow).toContain("pnpm bench");
    expect(workflow).toContain(
      "PERF_STRICT=1 pnpm exec playwright test -c playwright.bench.config.ts",
    );
    expect(workflow).toContain("docs/benchmarks/");
  });

  it("publishes list, JSON and HTML Playwright reports", () => {
    expect(playwright).toContain('["list"]');
    expect(playwright).toContain('["json", { outputFile: "test-results/playwright.json" }]');
    expect(playwright).toContain('["html", { open: "never" }]');
  });

  it("records the required report fields", () => {
    for (const field of [
      "Core tests",
      "React tests",
      "Playwright",
      "Browsers",
      "Dependency audit",
      "Licenses",
      "Known gaps",
      "benchmarks/rd10-baseline",
      "A3 print",
      "220 core tests pass",
      "Quality tests | **185 passed**",
      "41.67 kB",
      "65.27 kB",
      "PASS** for RD-01 through RD-12",
    ]) {
      expect(report, field).toContain(field);
    }
  });
});

describe("RD-02-AC-10 / RD-10-AC-05: timezone evidence", () => {
  it("exposes the timezone command and runs it in CI", () => {
    const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    expect(manifest.scripts?.["test:timezones"]).toContain("scripts/test-timezones.sh");
    const script = read("scripts/test-timezones.sh");
    expect(script).toContain("for zone in UTC Pacific/Kiritimati America/Los_Angeles");
    expect(script).toContain(
      'TZ="$zone" pnpm --filter @blendsdk/year-planner-core exec vitest run',
    );
  });
});

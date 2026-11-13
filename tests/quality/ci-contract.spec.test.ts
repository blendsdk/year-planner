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
    for (const job of [
      "verify",
      "browser-plan",
      "browser-build",
      "browsers",
      "security",
      "performance",
      "dco",
    ]) {
      expect(workflow, job).toMatch(new RegExp(`^  ${job}:`, "m"));
    }
  });

  it("plans, builds once and runs the browser matrix", () => {
    expect(workflow).toContain("node scripts/browser-shards.mjs plan");
    expect(workflow).toContain("fromJSON(needs.browser-plan.outputs.matrix)");
    expect(workflow).toContain("actions/download-artifact@");
    expect(workflow).toContain("playwright.ci.config.ts");
    expect(workflow).toContain("pnpm docs:site");
    expect(workflow).toContain("apps/demo/dist");
  });

  it("installs poppler for every group whose specs read a PDF", () => {
    const map = JSON.parse(read("codeops/test-map.json")) as {
      groups: Array<{ id: string; tests?: string[] }>;
    };
    const plan = JSON.parse(read("codeops/browser-plan.json")) as {
      groups: Record<string, { poppler?: boolean; popplerByProject?: Record<string, boolean> }>;
    };
    for (const group of map.groups) {
      const entry = plan.groups[group.id];
      if (!entry) continue;
      const usesPdf = (group.tests ?? []).some((spec) => read(spec).includes('from "./pdf.js"'));
      if (!usesPdf) continue;
      const covered = entry.poppler === true || entry.popplerByProject?.chromium === true;
      expect(covered, `${group.id} reads PDFs but does not request poppler`).toBe(true);
    }
  });

  it("isolates shard ports so local runs cannot collide", () => {
    const shardConfig = read("playwright.ci.config.ts");
    for (const name of [
      "PLAYWRIGHT_DEMO_PORT",
      "PLAYWRIGHT_STORYBOOK_PORT",
      "PLAYWRIGHT_DOCS_PORT",
    ]) {
      expect(shardConfig, name).toContain(name);
    }
    const runner = read("scripts/browser-shards.mjs");
    expect(runner).toContain("shardPorts");
    expect(runner).toContain("PLAYWRIGHT_CI_PORT_BASE");
    for (const path of [
      "tests/e2e/storybook.spec.ts",
      "tests/e2e/site.spec.ts",
      "tests/e2e/full-demo.spec.ts",
    ]) {
      expect(read(path), path).toContain("process.env.PLAYWRIGHT_");
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
    expect(playwright).toContain(
      'process.env.PLAYWRIGHT_JSON_FILE ?? "test-results/playwright.json"',
    );
    expect(playwright).toContain('["json", { outputFile: jsonReport }]');
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
      "226 core tests pass",
      "Quality tests | **255 passed**",
      "46.35 kB",
      "69.59 kB",
      "PASS** for RD-01 through RD-12",
    ]) {
      expect(report, field).toContain(field);
    }
  });
});

describe("RD-13-AC-09: release gate", () => {
  it("runs the full browser, timezone, audit, performance and consumer gates", () => {
    const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    const full = manifest.scripts?.["verify:full"] ?? "";
    for (const script of [
      "pnpm verify",
      "pnpm test:e2e",
      "pnpm test:timezones",
      "pnpm test:audit",
      "pnpm test:perf",
      "pnpm bench",
      "pnpm test:consumer",
    ]) {
      expect(full, `verify:full is missing ${script}`).toContain(script);
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

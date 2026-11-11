import { defineConfig, devices } from "@playwright/test";

/**
 * Production and development benchmark runners.
 *
 * Measurements run one at a time so competing workers do not distort frame
 * times. The preview project carries the budget assertions; the dev project
 * exists only to quantify development-only overhead for the interaction issue.
 */
export default defineConfig({
  testDir: "./tests/perf",
  outputDir: "test-results/playwright-bench",
  timeout: 180_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/bench/playwright.json" }],
  ],
  use: { trace: "off" },
  projects: [
    {
      name: "bench-preview",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4174",
        viewport: { width: 1600, height: 1200 },
      },
    },
    {
      name: "bench-dev",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4175",
        viewport: { width: 1600, height: 1200 },
      },
    },
  ],
  webServer: [
    {
      command:
        "pnpm --filter @blendsdk/year-planner-demo exec vite preview --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command:
        "pnpm --filter @blendsdk/year-planner-demo exec vite --host 127.0.0.1 --port 4175 --strictPort",
      url: "http://127.0.0.1:4175",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

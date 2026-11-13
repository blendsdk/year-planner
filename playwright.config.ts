import { defineConfig, devices } from "@playwright/test";

const demoPort = Number(process.env.PLAYWRIGHT_DEMO_PORT ?? 4173);
const demoUrl = `http://127.0.0.1:${demoPort}`;
/** Storybook and docs preview ports; both can be moved for local isolation. */
const storybookPort = Number(process.env.PLAYWRIGHT_STORYBOOK_PORT ?? 4176);
const docsPort = Number(process.env.PLAYWRIGHT_DOCS_PORT ?? 4177);
/**
 * JSON report destination.
 *
 * The sharded runner sets `PLAYWRIGHT_JSON_FILE` per shard so parallel jobs do
 * not overwrite one another. Playwright's own environment override is ignored
 * when the reporter declares an `outputFile`, so the path is read here.
 */
const jsonReport = process.env.PLAYWRIGHT_JSON_FILE ?? "test-results/playwright.json";

/**
 * End-to-end browser matrix.
 *
 * Desktop Chromium, Firefox and WebKit run the full suite. Two mobile
 * projects run only the short smoke spec, and the Chromium touch project keeps
 * the CDP-driven touch editing coverage. Retries stay at zero so a flake is
 * fixed or quarantined instead of hidden.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright-e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: jsonReport }],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: demoUrl,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `pnpm --filter @blendsdk/year-planner-demo exec vite --host 127.0.0.1 --port ${demoPort} --strictPort`,
      url: demoUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // The Storybook demo checks run against the built catalogue under the
      // GitHub Pages subpath. `pnpm verify` builds it before `pnpm test:e2e`.
      command:
        `node scripts/serve-static.mjs storybook-static ${storybookPort} --base /year-planner/storybook`,
      url: `http://127.0.0.1:${storybookPort}/year-planner/storybook/iframe.html`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      // The combined VitePress + Storybook + API artifact, served at the same
      // project base as GitHub Pages. `pnpm verify` builds it before E2E.
      command: `node scripts/serve-static.mjs docs/.vitepress/dist ${docsPort} --base /year-planner`,
      url: `http://127.0.0.1:${docsPort}/year-planner/`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "touch-chromium",
      testMatch: /interaction-touch\.spec\.ts/,
      use: { ...devices["Pixel 5"], hasTouch: true },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-webkit",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});

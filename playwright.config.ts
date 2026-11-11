import { defineConfig, devices } from "@playwright/test";

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
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "pnpm --filter @blendsdk/year-planner-demo exec vite --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
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

import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Browser configuration for sharded CI runs.
 *
 * The `browser-build` job produces the demo, Storybook and documentation
 * artifacts once. Each shard downloads them and serves the static output, so a
 * shard never spends time rebuilding the applications it tests. The Playwright
 * projects, timeouts and reporters stay identical to the local configuration.
 */
export default defineConfig({
  ...base,
  webServer: [
    {
      command: "node scripts/serve-static.mjs apps/demo/dist 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command:
        "node scripts/serve-static.mjs storybook-static 4176 --base /year-planner/storybook",
      url: "http://127.0.0.1:4176/year-planner/storybook/iframe.html",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "node scripts/serve-static.mjs docs/.vitepress/dist 4177 --base /year-planner",
      url: "http://127.0.0.1:4177/year-planner/",
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});

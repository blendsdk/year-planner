import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Browser configuration for sharded CI runs.
 *
 * The `browser-build` job produces the demo, Storybook and documentation
 * artifacts once. Each shard downloads them and serves the static output, so a
 * shard never spends time rebuilding the applications it tests. The Playwright
 * projects, timeouts and reporters stay identical to the local configuration.
 *
 * Ports are configurable so several shards can run on one developer machine
 * without colliding with each other or with another project. CI runners are
 * isolated, so the defaults are used there.
 */
const demoPort = Number(process.env.PLAYWRIGHT_DEMO_PORT ?? 4173);
const storybookPort = Number(process.env.PLAYWRIGHT_STORYBOOK_PORT ?? 4176);
const docsPort = Number(process.env.PLAYWRIGHT_DOCS_PORT ?? 4177);

export default defineConfig({
  ...base,
  use: {
    ...base.use,
    baseURL: `http://127.0.0.1:${demoPort}`,
  },
  webServer: [
    {
      command: `node scripts/serve-static.mjs apps/demo/dist ${demoPort}`,
      url: `http://127.0.0.1:${demoPort}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `node scripts/serve-static.mjs storybook-static ${storybookPort} --base /year-planner/storybook`,
      url: `http://127.0.0.1:${storybookPort}/year-planner/storybook/iframe.html`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `node scripts/serve-static.mjs docs/.vitepress/dist ${docsPort} --base /year-planner`,
      url: `http://127.0.0.1:${docsPort}/year-planner/`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});

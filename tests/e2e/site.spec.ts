import { expect, test } from "@playwright/test";

/**
 * The combined GitHub Pages artifact, served under the real project base.
 *
 * This is the end-to-end proof that the VitePress site, the Storybook catalogue
 * and the TypeDoc reference work together at `/year-planner/`, not just at the
 * root of a local server.
 *
 * Requires `pnpm docs:site` (run by `pnpm verify` before `pnpm test:e2e`).
 */
const SITE = "http://127.0.0.1:4177/year-planner";

test.describe("GitHub Pages site", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "The combined Pages artifact is checked in Chromium",
  );

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("home, guide and tutorial render under the project base", async ({ page }) => {
    await page.goto(`${SITE}/`);
    await expect(page).toHaveTitle(/Year Planner for React/);
    await expect(page.getByText("Plan the whole year in one component")).toBeVisible();
    const hero = page.locator('img[src*="year-grid"]').first();
    await expect(hero).toBeVisible();
    expect(
      await hero.evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0),
    ).toBe(true);

    await page.getByRole("link", { name: "Get started" }).first().click();
    await expect(page).toHaveURL(/\/year-planner\/getting-started\.html$/);
    await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();

    await page.goto(`${SITE}/tutorials/first-planner.html`);
    await expect(page.getByRole("heading", { name: "Your first planner" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Controlled commands" }).first()).toBeVisible();
  });

  test("the interactive example embeds the Storybook story under the base", async ({ page }) => {
    await page.goto(`${SITE}/examples/interactive.html`);
    const frame = page.locator(".story-frame iframe").first();
    await expect(frame).toBeVisible();
    await expect
      .poll(() => frame.evaluate((element) => (element as HTMLIFrameElement).src))
      .toContain("/year-planner/storybook/iframe.html?id=demos--context-menu");

    const story = page.frameLocator(".story-frame iframe").first();
    await expect(story.getByRole("grid")).toBeVisible({ timeout: 30_000 });
    await expect(story.getByText(/Context menu demo/)).toBeVisible();
  });

  test("the Storybook manager loads its preview under the base", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`${SITE}/storybook/?path=/story/demos--context-menu`);
    const preview = page.locator("#storybook-preview-iframe");
    await expect(preview).toBeVisible({ timeout: 60_000 });
    await expect
      .poll(() => preview.evaluate((element) => (element as HTMLIFrameElement).src))
      .toContain("/year-planner/storybook/iframe.html");
    const story = page.frameLocator("#storybook-preview-iframe");
    await expect(story.getByRole("grid")).toBeVisible({ timeout: 30_000 });
  });

  test("the story index and the TypeDoc reference are served", async ({ page }) => {
    await page.goto(`${SITE}/stories.html`);
    await expect(page.getByText(/183 stories in the catalogue/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Context Menu" }).first()).toBeVisible();

    await page.goto(`${SITE}/api/index.html`);
    await expect(page).toHaveTitle(/Year Planner for React/);
    await expect(page.getByRole("heading", { name: /Year Planner for React/ })).toBeVisible();
  });

  test("the built pages do not emit page errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${SITE}/`);
    await expect(page.getByText("Plan the whole year in one component")).toBeVisible();
    await page.goto(`${SITE}/examples/themes.html`);
    await expect(page.getByRole("heading", { name: "Themes" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

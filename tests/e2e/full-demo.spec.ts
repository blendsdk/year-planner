import { expect, test } from "@playwright/test";

/**
 * The full construction demo.
 *
 * It runs against the built Storybook under the GitHub Pages base. The demo has
 * no play function, so these interactions are the only source of localStorage
 * writes; every test clears the key first.
 */
const STORYBOOK_PORT = process.env.PLAYWRIGHT_STORYBOOK_PORT ?? "4176";
const STORYBOOK = `http://127.0.0.1:${STORYBOOK_PORT}/year-planner/storybook`;
const STORY_URL = `${STORYBOOK}/iframe.html?id=full-demo--full-demo&viewMode=story`;
const STORAGE_KEY = "year-planner.full-demo.v1";

/** Opens the demo with a clean plan. */
async function openDemo(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(STORY_URL, { waitUntil: "networkidle" });
  await expect(page.getByRole("grid")).toBeVisible();
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByText("Northwind Construction")).toBeVisible();
}

/** One item proxy by its visible title. */
function proxy(page: import("@playwright/test").Page, title: string) {
  return page.locator('[data-yp-part="item-proxy"]', { hasText: title }).first();
}

/** Allocates a project from one free date. */
async function allocate(page: import("@playwright/test").Page, title: string): Promise<void> {
  const cell = page.locator('[role="gridcell"][data-date="2027-08-25"]');
  await cell.dblclick();
  const dialog = page.locator("dialog.fd-dialog");
  await expect(dialog).toBeVisible();
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="client"]', "Test client");
  await page.fill('input[name="endDate"]', "2027-09-30");
  await page.fill('input[name="budget"]', "750000");
  await page.getByRole("button", { name: "Allocate project" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.locator('[data-yp-part="item-proxy"]', { hasText: title }).first(),
  ).toBeVisible();
}

test.describe("Full construction demo", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "The full demo checks run in Chromium",
  );

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Storybook opens on the full demo", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`${STORYBOOK}/`);
    const preview = page.locator("#storybook-preview-iframe");
    await expect(preview).toBeVisible({ timeout: 60_000 });
    await expect
      .poll(() => preview.evaluate((element) => (element as HTMLIFrameElement).src))
      .toContain("full-demo--full-demo");
    const story = page.frameLocator("#storybook-preview-iframe");
    await expect(story.getByRole("grid")).toBeVisible({ timeout: 60_000 });
  });

  test("allocates a project and restores it from localStorage", async ({ page }) => {
    await openDemo(page);
    await expect(proxy(page, "Riverside offices")).toBeVisible();
    await expect(page.getByText("Active projects")).toBeVisible();
    await allocate(page, "Test tower");
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(stored).toContain("Test tower");
    expect(stored).toContain("750000");

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(proxy(page, "Test tower")).toBeVisible();
  });

  test("deletes from the context menu, undoes and resets", async ({ page }) => {
    await openDemo(page);
    await allocate(page, "Delete me");
    await proxy(page, "Delete me").click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Delete project" }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.locator('[data-yp-part="item-proxy"]', { hasText: "Delete me" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(
      page.locator('[data-yp-part="item-proxy"]', { hasText: "Delete me" }).first(),
    ).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset demo" }).click();
    await expect(page.getByText("Northwind Construction")).toBeVisible();
    await expect(page.locator('[data-yp-part="item-proxy"]', { hasText: "Delete me" })).toHaveCount(
      0,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    await expect(proxy(page, "Riverside offices")).toBeVisible();
  });

  test("filters projects and switches between all lanes and fit", async ({ page }) => {
    await openDemo(page);
    await page.getByRole("searchbox").fill("Harbor");
    await expect(proxy(page, "Harbor retrofit")).toBeVisible();
    await expect(
      page.locator('[data-yp-part="item-proxy"]', { hasText: "Riverside offices" }),
    ).toHaveCount(0);
    await page.getByRole("searchbox").fill("");
    await page.getByRole("combobox", { name: "Layout" }).selectOption("fit");
    await expect(page.locator(".fd-grid-host")).toHaveAttribute("style", /height:\s*100%/);
  });
});

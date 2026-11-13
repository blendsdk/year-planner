import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    /** Context-menu `defaultPrevented` flags recorded by the target probe. */
    __contextMenuPrevented?: boolean[];
  }
}

/**
 * The Storybook demo checks run against the built catalogue.
 *
 * `pnpm verify` builds `storybook-static` before `pnpm test:e2e`, and the CI
 * browsers job runs `pnpm storybook:build`. A missing build fails the server
 * with `serve-static: ... run pnpm storybook:build first`.
 */
const STORYBOOK_PORT = process.env.PLAYWRIGHT_STORYBOOK_PORT ?? "4176";
const STORYBOOK = `http://127.0.0.1:${STORYBOOK_PORT}/year-planner/storybook`;

/** Opens one story in the Storybook preview iframe. */
function storyUrl(id: string): string {
  return `${STORYBOOK}/iframe.html?id=${id}&viewMode=story`;
}

test.describe("RD-13-AC-06 / RD-13-AC-07: Storybook demo evidence", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Storybook demo evidence runs in Chromium",
  );

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("Demos/Context Menu opens a host menu, reports the target and returns focus", async ({
    page,
  }) => {
    await page.goto(storyUrl("demos--context-menu"));
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByText(/Right-click a date cell or a ribbon item/)).toBeVisible();
    // The story's own play function runs when the preview loads; wait for its
    // final state before interacting so the two runs do not interleave.
    await expect(page.getByTestId("demo-status")).toHaveText(/Dismissed · focus restored/);

    const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
    await proxy.click({ button: "right" });
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu).toContainText("item booking");
    await expect(page.getByTestId("demo-status")).toHaveText(/item booking .* pointer/);

    await menu.getByRole("menuitem", { name: "Hide layer" }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByTestId("demo-status")).toHaveText(/Hide layer · focus restored/);
    await expect(proxy).toBeFocused();

    const cell = page.locator('[role="gridcell"][data-date="2027-03-20"]');
    await cell.click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menu")).toContainText("date 2027-03-20");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(cell).toBeFocused();
  });

  test("Fluent and MUI examples open their host menus at the pointer", async ({ page }) => {
    for (const [id, owner] of [
      ["year-planner-context-menu--fluent-menu-example", "Fluent"],
      ["year-planner-context-menu--mui-menu-example", "MUI"],
    ] as const) {
      await page.goto(storyUrl(id));
      await expect(page.getByRole("grid")).toBeVisible();
      await expect(page.getByText(/Right-click a date cell/)).toBeVisible();
      const cell = page.locator('[role="gridcell"][data-date="2027-03-20"]');
      await cell.click({ button: "right" });
      const menu = page.getByRole("menu");
      await expect(menu, `${owner} menu is visible`).toBeVisible();
      await expect(menu).toContainText("New item here");
      await expect(page.getByTestId("demo-status")).toHaveText(/date 2027-03-20/);
      await page.keyboard.press("Escape");
      await expect(menu, `${owner} menu is closed`).toHaveCount(0);
    }
  });

  test("month band and header keep the native menu", async ({ page }) => {
    await page.goto(storyUrl("demos--context-menu"));
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByTestId("demo-status")).toHaveText(/Dismissed · focus restored/);
    await page.evaluate(() => {
      window.__contextMenuPrevented = [];
      window.addEventListener(
        "contextmenu",
        (event) => {
          setTimeout(() => window.__contextMenuPrevented?.push(event.defaultPrevented), 0);
        },
        true,
      );
    });

    await page.locator(".yp-month").first().click({ button: "right" });
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.__contextMenuPrevented)).toEqual([false]);

    await page.locator(".yp-heading").first().click({ button: "right" });
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.__contextMenuPrevented))
      .toEqual([false, false]);
  });
});

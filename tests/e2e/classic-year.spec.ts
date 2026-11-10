import { expect, test } from "@playwright/test";

test.describe("M1 classic year grid", () => {
  test("renders the 2016 blue 14x37 grid @visual", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator('[role="gridcell"]')).toHaveCount(518);
    await expect(page.getByRole("grid")).toHaveAttribute("aria-colcount", "37");
    await expect(page).toHaveScreenshot("classic-2016-blue.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("renders the 2017 yellow 14-month view @visual", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2017");
    await page.locator("select").nth(1).selectOption("classic-yellow");
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator(".yp-theme-classic-yellow")).toBeVisible();
    await expect(page).toHaveScreenshot("classic-2017-yellow.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("prints the 2016 grid as A3 landscape @print", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "PDF generation is Chromium-only");
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await page.pdf({
      path: "test-results/classic-2016-a3.pdf",
      format: "A3",
      landscape: true,
      printBackground: true,
    });
    await expect(page).toHaveScreenshot("classic-2016-print.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

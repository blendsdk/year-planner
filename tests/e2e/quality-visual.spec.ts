import { expect, test } from "@playwright/test";

const DESKTOP_VIEWPORT = { width: 1600, height: 1200 };

/** Selects a demo window size and waits for the expected row count. */
async function selectWindow(page: import("@playwright/test").Page, months: number): Promise<void> {
  await page.getByTestId("months").selectOption(String(months));
  await expect(page.locator("[data-row-id]")).toHaveCount(months);
}

test.describe("RD-10-AC-04: quality visual matrix", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/");
    await expect(page.getByRole("grid")).toBeVisible();
  });

  test("12-month compact @visual", async ({ page }) => {
    await selectWindow(page, 12);
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-12-months.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("18-month compact @visual", async ({ page }) => {
    await selectWindow(page, 18);
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-18-months.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("24-month compact @visual", async ({ page }) => {
    await selectWindow(page, 24);
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-24-months.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("36-month compact @visual", async ({ page }) => {
    await selectWindow(page, 36);
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-36-months.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("compact overflow open @visual", async ({ page }) => {
    await page.getByTestId("year").selectOption("2027");
    const overflow = page.locator('[data-yp-part="overflow-button"]').first();
    await expect(overflow).toContainText("+17");
    await overflow.click();
    await expect(page.locator('[data-yp-part="overflow-popover"]')).toBeVisible();
    await expect(page.locator(".yp-overflow-entry")).toHaveCount(17);
    await expect(page.locator(".yp-overflow-entry").first()).toBeVisible();
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-overflow-compact.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("expanded overflow @visual", async ({ page }) => {
    await page.getByTestId("year").selectOption("2027");
    await page.getByTestId("density").selectOption("expanded");
    await expect(page.locator('[data-yp-part="overflow-button"]')).toHaveCount(0);
    await expect(page.locator(".yp-root")).toHaveScreenshot("quality-overflow-expanded.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("high-contrast theme @visual", async ({ page }) => {
    await page.getByTestId("year").selectOption("2027");
    await page.getByTestId("theme").selectOption("high-contrast");
    const root = page.locator(".yp-root");
    await expect(root).toHaveClass(/yp-theme-high-contrast/);
    const contrast = await root.evaluate((element) => {
      const style = getComputedStyle(element);
      const cell = element.querySelector('[role="gridcell"][data-date="2027-02-01"]');
      const cellStyle = cell ? getComputedStyle(cell) : undefined;
      return {
        focusRing: style.getPropertyValue("--yp-focus-ring").trim(),
        text: style.getPropertyValue("--yp-text-primary").trim(),
        cellColor: cellStyle?.color ?? "",
        cellBackground: cellStyle?.backgroundColor ?? "",
      };
    });
    expect(contrast.focusRing).not.toBe("");
    expect(contrast.text).not.toBe("");
    expect(contrast.cellColor).not.toBe(contrast.cellBackground);
    await expect(root).toHaveScreenshot("quality-high-contrast.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("print preview @visual", async ({ page }) => {
    await page.emulateMedia({ media: "print" });
    const printPage = page.locator('[data-yp-part="print-page"]').first();
    await expect(printPage).toBeVisible();
    await expect(printPage).toHaveScreenshot("quality-print.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});

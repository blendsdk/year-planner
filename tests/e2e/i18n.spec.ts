import { expect, test } from "@playwright/test";

/**
 * Demo localization smoke test.
 *
 * The demo is the only integration surface that wires a language selector to
 * both `display.locale` and the message catalogue. This proves the switch
 * reaches the region label, the grid label and the date-cell names.
 */
test.describe("demo language selector", () => {
  test("renders German and switches to Eastern Armenian", async ({ page }) => {
    await page.goto("/?fit=none&lang=de");
    await expect(page.getByTestId("language")).toHaveValue("de");
    await expect(page.getByRole("region", { name: "Jahresplaner 2016" })).toBeVisible();
    await expect(page.getByRole("grid")).toHaveAttribute("aria-label", "Jahresplaner 2016-Raster");
    await expect(page.locator('[data-date="2016-01-04"]')).toContainText("ISO-Woche");

    await page.getByTestId("language").selectOption("hy");
    await expect(page.getByTestId("language")).toHaveValue("hy");
    await expect(page.getByRole("region", { name: /2016/ })).toBeVisible();
    await expect(page.locator('[data-date="2016-01-04"]')).not.toContainText("ISO-Woche");

    await page.getByTestId("language").selectOption("ja");
    await expect(page.getByTestId("language")).toHaveValue("ja");
    await expect(page.getByRole("grid")).toBeVisible();
  });
});

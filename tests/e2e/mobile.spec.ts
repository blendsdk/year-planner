import { expect, test } from "@playwright/test";

test.describe("RD-10-AC-04: mobile smoke", () => {
  test("renders, selects a date and keeps the page inside the viewport", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto("/?interaction=1");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator("[data-row-id]")).toHaveCount(14);

    const cell = page.locator('[role="gridcell"][data-date="2027-01-28"]');
    await cell.tap();
    await expect(cell).toHaveAttribute("aria-selected", "true");

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
});

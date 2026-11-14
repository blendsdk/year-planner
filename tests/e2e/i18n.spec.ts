import { expect, test } from "@playwright/test";

/**
 * Demo localization smoke test.
 *
 * The demo is the only integration surface that wires a language selector to
 * both `display.locale` and the message catalogue. This proves the switch
 * reaches the region label, the grid label and the date-cell names.
 */
test.describe("demo language selector", () => {
  test("preserves Armenian numeric preferences in the built Storybook component", async ({
    page,
  }) => {
    const port = process.env.PLAYWRIGHT_STORYBOOK_PORT ?? "4176";
    await page.goto(
      `http://127.0.0.1:${port}/year-planner/storybook/iframe.html?id=classic-year-grid--armenian-locale&args=display.locale:hy-AM-u-nu-arab`,
    );
    await expect(page.getByRole("columnheader").first()).toHaveText("շբթ");
    await expect(page.locator('[data-date="2016-01-04"]')).toContainText("٤ հնվ, ٢٠١٦ թ.");
    await expect(page.locator('[data-date="2016-01-04"] .yp-day-number')).toHaveText("٤");
  });

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
    await expect(page.getByRole("columnheader").first()).toHaveText("շբթ");
    await expect(page.locator('[data-row-id="2016-01"] .yp-month').first()).toContainText("հնվ");
    await expect(page.locator('[data-date="2016-01-04"]')).toContainText("4 հնվ, 2016 թ.");

    await page.getByTestId("language").selectOption("ja");
    await expect(page.getByTestId("language")).toHaveValue("ja");
    await expect(page.getByRole("grid")).toBeVisible();
  });

  for (const language of [
    { id: "hy", month: "հնվ", weekday: "շբթ", date: "4 հնվ, 2016 թ." },
    { id: "ka", month: "იან", weekday: "შაბ", date: "4 იან. 2016" },
    { id: "is", month: "jan.", weekday: "lau.", date: "4. jan. 2016" },
  ]) {
    test(`renders ${language.id} calendar and print labels in the selected language`, async ({
      page,
    }) => {
      await page.goto(`/?fit=none&lang=${language.id}`);
      await expect(page.getByRole("columnheader").first()).toHaveText(language.weekday);
      await expect(page.locator('[data-row-id="2016-01"] .yp-month').first()).toContainText(
        language.month,
      );
      await expect(page.locator('[data-date="2016-01-04"]')).toContainText(language.date);
      await page.emulateMedia({ media: "print" });
      await expect(page.locator(".yp-print-heading").first()).toBeVisible();
      await expect(page.locator(".yp-print-heading").first()).toHaveText(language.weekday);
      await expect(
        page.locator('[data-print-row-id="2016-01"] .yp-print-month').first(),
      ).toContainText(language.month);
    });
  }
});

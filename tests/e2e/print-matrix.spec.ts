import { expect, test } from "@playwright/test";
import { expectA3Pdf, expectRowsInsidePages, readPdfText } from "./pdf.js";

/** Page counts required for the classic paginated A3 output. */
const WINDOWS: readonly (readonly [number, number])[] = [
  [12, 1],
  [14, 1],
  [18, 2],
  [24, 2],
  [36, 3],
];

test.describe("RD-10-AC-06: A3 print matrix", () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "PDF generation is Chromium-only");
    await page.setViewportSize({ width: 1600, height: 1400 });
    await page.goto("/");
    await page.getByTestId("year").selectOption("2027");
  });

  for (const [months, pages] of WINDOWS) {
    test(`${months} months prints ${pages} A3 page(s)`, async ({ page }) => {
      await page.getByTestId("months").selectOption(String(months));
      await page.emulateMedia({ media: "print" });
      await expect(page.locator('[data-yp-part="print-page"]')).toHaveCount(pages);
      await expectRowsInsidePages(page);
      const path = `test-results/rd10-print-${months}-months-a3.pdf`;
      await page.pdf({
        path,
        format: "A3",
        landscape: true,
        printBackground: true,
      });
      expectA3Pdf(path, pages);
      const text = readPdfText(path);
      expect(text).toContain("Jan");
      expect(text).toContain("Dec");
    });
  }

  test("PRT-01 keeps the 2017 yellow fixture on one A3 page", async ({ page }) => {
    await page.goto("/?print=prt01");
    await expect(page.getByTestId("year")).toHaveValue("2017");
    await expect(page.getByTestId("theme")).toHaveValue("classic-yellow");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator('[data-yp-part="print-page"]')).toHaveCount(1);
    await expectRowsInsidePages(page);
    const path = "test-results/rd10-prt01-a3.pdf";
    await page.pdf({ path, format: "A3", landscape: true, printBackground: true });
    expectA3Pdf(path, 1);
    const text = readPdfText(path);
    expect(text).toContain("PRT-01 booking");
    expect(text).toContain("OH");
    expect(text).toContain("Jan");
  });
});

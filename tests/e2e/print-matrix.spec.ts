import { expect, test } from "@playwright/test";
import { expectA3Pdf, expectRowsInsidePages, readPdfText } from "./pdf.js";

/** Short month names used by the planner formatter. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Page counts required for the classic paginated A3 output. */
const WINDOWS: readonly (readonly [number, number])[] = [
  [12, 1],
  [14, 1],
  [18, 2],
  [24, 2],
  [36, 3],
];

test.describe("RD-10-AC-06: A3 print matrix @print", () => {
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
      const pageNodes = page.locator('[data-yp-part="print-page"]');
      await expect(pageNodes).toHaveCount(pages);
      for (let index = 0; index < pages; index += 1) {
        const pageNode = pageNodes.nth(index);
        const expectedRows = Math.min(14, months - index * 14);
        await expect(pageNode.locator("[data-print-row-id]")).toHaveCount(expectedRows);
        await expect(pageNode.locator(".yp-print-heading")).toHaveCount(74);
        expect(await pageNode.locator(".yp-print-week").count()).toBeGreaterThan(0);
      }
      expect(await page.locator(".yp-print-fragment").count()).toBeGreaterThan(0);
      await expectRowsInsidePages(page);
      const path = `test-results/rd10-print-${months}-months-a3.pdf`;
      await page.pdf({
        path,
        format: "A3",
        landscape: true,
        printBackground: true,
      });
      expectA3Pdf(path, pages);
      const pageTexts = readPdfText(path)
        .split("\f")
        .filter((entry) => entry.trim().length > 0);
      expect(pageTexts).toHaveLength(pages);
      for (let index = 0; index < pages; index += 1) {
        const firstRowId = await pageNodes
          .nth(index)
          .locator("[data-print-row-id]")
          .first()
          .getAttribute("data-print-row-id");
        const month = MONTHS[Number((firstRowId ?? "2027-01").slice(5, 7)) - 1];
        expect(pageTexts[index], `page ${index + 1} month`).toContain(month);
        expect(pageTexts[index], `page ${index + 1} weekdays`).toContain("Sat");
        expect(pageTexts[index], `page ${index + 1} weekdays`).toContain("Sun");
      }
    });
  }

  test("RD-05-AC-11 / RD-10-AC-06: PRT-01 keeps the 2017 yellow fixture on one A3 page", async ({
    page,
  }) => {
    await page.goto("/?print=prt01");
    await expect(page.getByTestId("year")).toHaveValue("2017");
    await expect(page.getByTestId("theme")).toHaveValue("classic-yellow");
    await page.emulateMedia({ media: "print" });
    const prtPage = page.locator('[data-yp-part="print-page"]');
    await expect(prtPage).toHaveCount(1);
    await expect(prtPage.locator("[data-print-row-id]")).toHaveCount(14);
    await expect(prtPage.locator(".yp-print-heading")).toHaveCount(74);
    expect(await prtPage.locator(".yp-print-week").count()).toBeGreaterThan(0);
    await expectRowsInsidePages(page);
    const path = "test-results/rd10-prt01-a3.pdf";
    await page.pdf({ path, format: "A3", landscape: true, printBackground: true });
    expectA3Pdf(path, 1);
    const text = readPdfText(path);
    expect(text).toContain("PRT-01 booking");
    expect(text).toContain("OH");
    expect(text).toContain("Feb");
    expect(text).toContain("Sat");
  });
});

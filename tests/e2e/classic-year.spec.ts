import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/** Reads the page count and page size from a generated PDF with `pdfinfo`. */
function readPdfInfo(path: string): { pages: number; pageSize: string } {
  const output = execFileSync("pdfinfo", [path], { encoding: "utf8" });
  const pages = Number(/^Pages:\s+(\d+)$/m.exec(output)?.[1] ?? "0");
  const pageSize = /^Page size:\s+(.+)$/m.exec(output)?.[1]?.trim() ?? "";
  return { pages, pageSize };
}

test.describe("M1 classic year grid", () => {
  test("renders the 2016 blue 14x37 grid @visual", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator('[role="gridcell"]')).toHaveCount(518);
    await expect(page.getByRole("grid")).toHaveAttribute("aria-colcount", "37");
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2016-blue.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("renders the 2017 yellow 14-month view @visual", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2017");
    await page.locator("select").nth(1).selectOption("classic-yellow");
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator(".yp-theme-classic-yellow")).toBeVisible();
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2017-yellow.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("prints the 2016 grid as A3 landscape @print", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "PDF generation is Chromium-only");
    await page.goto("/");
    await page.setViewportSize({ width: 1600, height: 1400 });
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await page.pdf({
      path: "test-results/classic-2016-a3.pdf",
      format: "A3",
      landscape: true,
      printBackground: true,
    });
    const pdf = readPdfInfo("test-results/classic-2016-a3.pdf");
    expect(pdf.pages).toBe(1);
    expect(pdf.pageSize).toContain("1191.12 x 842.88 pts");
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2016-print.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

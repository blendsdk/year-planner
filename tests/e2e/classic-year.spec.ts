import { expect, test } from "@playwright/test";
import { expectA3Pdf } from "./pdf.js";

test.describe("M1 classic year grid", () => {
  test("renders the 2016 material-teal 14x37 grid @visual", async ({ page }) => {
    await page.goto("/?fit=none");
    await page.addStyleTag({ content: ".yp-inspector { display: none !important; }" });
    await expect(page.locator(".yp-inspector")).toBeHidden();
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator('[role="gridcell"]')).toHaveCount(518);
    await expect(page.getByRole("grid")).toHaveAttribute("aria-colcount", "37");
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2016-teal.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("renders the 2017 fluent-marigold 14-month view @visual", async ({ page }) => {
    await page.goto("/?fit=none");
    await page.addStyleTag({ content: ".yp-inspector { display: none !important; }" });
    await expect(page.locator(".yp-inspector")).toBeHidden();
    await page.getByTestId("year").selectOption("2017");
    await page.getByTestId("theme").selectOption("fluent-marigold");
    await expect(page.locator("[data-row-id]")).toHaveCount(14);
    await expect(page.locator(".yp-theme-fluent-marigold")).toBeVisible();
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2017-marigold.png", {
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
    expectA3Pdf("test-results/classic-2016-a3.pdf", 1);
    await expect(page.locator(".yp-root")).toHaveScreenshot("classic-2016-print.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("RD-06 items, inspector and print", () => {
  test("renders ribbons, an annotation and inspector details @visual", async ({ page }) => {
    await page.goto("/?fit=none");
    await page.getByTestId("year").selectOption("2027");
    await page.getByTestId("theme").selectOption("material-teal");
    await expect(
      page.locator('[data-yp-part="item-fragment"][data-item-id="booking"]'),
    ).toHaveCount(2);
    await expect(
      page.locator('[data-yp-part="item-fragment"][data-item-id="holiday"]'),
    ).toContainText("OH");
    await page.locator('[data-yp-part="item-proxy"][data-item-id="maintenance"]').click();
    await expect(page.getByRole("complementary", { name: "Planner inspector" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maintenance window" })).toBeVisible();
    await expect(
      page.locator('[data-yp-part="item-fragment"][data-item-id="booking"]').last(),
    ).toBeVisible();
    await expect(
      page.locator('[data-yp-part="item-fragment"][data-item-id="holiday"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-yp-part="item-fragment"][data-item-id^="overflow-"]'),
    ).toHaveCount(3);
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(page.locator(".yp-root")).toHaveScreenshot("rd06-items-2027.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("opens the overflow popover and a tooltip", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("year").selectOption("2027");
    const overflow = page.locator('[data-yp-part="overflow-button"]').first();
    const count = Number(((await overflow.textContent()) ?? "+0").replace("+", ""));
    await overflow.click();
    await expect(page.locator('[data-yp-part="overflow-popover"]')).toBeVisible();
    await expect(page.locator(".yp-overflow-entry")).toHaveCount(count);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-yp-part="overflow-popover"]')).toHaveCount(0);
    await page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first().hover();
    await expect(page.getByRole("tooltip")).toContainText("Winter booking");
  });

  test("prints 24 and 36 months as two and three A3 pages @print", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "PDF generation is Chromium-only");
    await page.goto("/");
    await page.getByTestId("year").selectOption("2027");
    await page.setViewportSize({ width: 1600, height: 1400 });
    await page.getByTestId("months").selectOption("24");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator('[data-yp-part="print-page"]')).toHaveCount(2);
    await page.pdf({
      path: "test-results/rd06-24-months-a3.pdf",
      format: "A3",
      landscape: true,
      printBackground: true,
    });
    expectA3Pdf("test-results/rd06-24-months-a3.pdf", 2);

    await page.emulateMedia({ media: "screen" });
    await page.getByTestId("months").selectOption("36");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator('[data-yp-part="print-page"]')).toHaveCount(3);
    await page.pdf({
      path: "test-results/rd06-36-months-a3.pdf",
      format: "A3",
      landscape: true,
      printBackground: true,
    });
    expectA3Pdf("test-results/rd06-36-months-a3.pdf", 3);
  });

  test("keeps zoomed geometry inside a scrollable viewport", async ({ page }) => {
    await page.goto("/?fit=none");
    await page.getByTestId("year").selectOption("2027");
    const zoom = page.locator('input[type="range"]');
    await zoom.fill("1.5");
    const row = page.locator('[data-row-id="2027-02"]');
    await expect(row).toHaveCSS("height", "135px");
    const dimensions = await page.locator('[data-yp-part="viewport"]').evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  });

  test("RD-06-AC-11: renders under the documented CSP attribute allowance", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("attacker.example")) requests.push(request.url());
    });
    await page.route("**/", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "content-security-policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:",
        },
      });
    });
    await page.goto("/?security=1");
    await page.getByTestId("year").selectOption("2027");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator('[data-yp-part="item-fragment"]').first()).toBeVisible();
    await expect(page.locator('[data-item-id="security-probe"]').first()).not.toHaveAttribute(
      "style",
      /attacker/,
    );
    expect(requests).toEqual([]);
  });
});

test.describe("AC3 design-system fixtures", () => {
  test("renders real Fluent UI v9 and MUI buttons in cells and the inspector", async ({ page }) => {
    await page.goto("/?ac3=1");
    await page.getByTestId("year").selectOption("2027");
    await expect(page.getByRole("button", { name: "Fluent cell button" })).toBeVisible();
    await expect(page.getByRole("button", { name: "MUI cell button" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fluent inspector button" })).toBeVisible();
    await expect(page.getByRole("button", { name: "MUI inspector button" })).toBeVisible();
    await expect(page.locator('[data-yp-part="item-proxy"] button')).toHaveCount(0);
    await expect(page.locator('[data-yp-part="day-cell"] button')).toHaveCount(2);
  });
});

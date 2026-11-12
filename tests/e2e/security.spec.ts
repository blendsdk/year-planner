import { expect, test } from "@playwright/test";

const APP_ORIGIN = "http://127.0.0.1:4173";

test.describe("RD-10-AC-08/10/13: security and privacy", () => {
  test("renders only visible data and makes no external request", async ({ page }) => {
    const unexpected: string[] = [];
    let loaded = false;
    page.on("request", (request) => {
      if (!loaded) return;
      const url = new URL(request.url());
      if (url.protocol === "data:" || url.protocol === "blob:") return;
      const allowed =
        url.origin === APP_ORIGIN &&
        (url.pathname === "/" ||
          url.pathname.startsWith("/src/") ||
          url.pathname.startsWith("/@vite/") ||
          url.pathname.startsWith("/@react-refresh") ||
          url.pathname.startsWith("/node_modules/") ||
          url.pathname.endsWith(".css") ||
          url.pathname.endsWith(".ico"));
      if (!allowed) unexpected.push(request.url());
    });

    await page.goto("/?security=1");
    await expect(page.getByRole("grid")).toBeVisible();
    await page.getByTestId("year").selectOption("2027");
    await expect(
      page.locator('[data-yp-part="item-proxy"][data-item-id="security-probe"]'),
    ).toHaveCount(1);
    await page.waitForTimeout(500);
    loaded = true;

    await page.locator('[role="gridcell"][data-date="2027-03-01"]').click();
    const overflow = page.locator('[data-yp-part="overflow-button"]').first();
    if ((await overflow.count()) > 0) {
      await overflow.click();
      await page.keyboard.press("Escape");
    }
    await page
      .locator('[data-yp-part="item-proxy"][data-item-id="security-probe"]')
      .first()
      .click();
    await expect(page.locator('[data-yp-part="inspector"]')).toBeVisible();

    const html = await page.locator("body").innerHTML();
    expect(html).not.toContain("TOPSECRET-HIDDEN");
    expect(html).not.toContain("security-secret");
    expect(html).not.toContain("attacker.example");
    expect(unexpected).toEqual([]);
  });

  test("renders under the documented CSP attribute allowance", async ({ page }) => {
    const attackerRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("attacker.example")) attackerRequests.push(request.url());
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
    await expect(page.getByRole("grid")).toBeVisible();
    await page.getByTestId("year").selectOption("2027");
    await expect(page.locator('[data-item-id="security-probe"]').first()).toBeVisible();
    await expect(page.locator('[data-item-id="security-probe"]').first()).not.toHaveAttribute(
      "style",
      /attacker/,
    );
    expect(attackerRequests).toEqual([]);
  });
});

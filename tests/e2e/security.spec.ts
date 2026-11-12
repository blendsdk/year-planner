import { expect, test } from "@playwright/test";

const APP_ORIGIN = "http://127.0.0.1:4173";

test.describe("RD-10-AC-08/10/13: security and privacy", () => {
  test("RD-11-AC-08: renders only visible data and makes no external request", async ({ page }) => {
    const unexpected: string[] = [];
    const leaks: string[] = [];
    const sockets: string[] = [];
    page.on("websocket", (socket) => sockets.push(socket.url()));
    page.on("request", (request) => {
      if (
        request.url().includes("TOPSECRET-HIDDEN") ||
        request.url().includes("security-secret") ||
        (request.postData() ?? "").includes("TOPSECRET-HIDDEN") ||
        (request.postData() ?? "").includes("security-secret")
      ) {
        leaks.push(request.url());
      }
      const url = new URL(request.url());
      if (url.protocol === "data:" || url.protocol === "blob:") return;
      const allowed =
        url.origin === APP_ORIGIN &&
        (url.pathname === "/" ||
          url.pathname.startsWith("/src/") ||
          url.pathname.startsWith("/@vite/") ||
          url.pathname.startsWith("/@fs/") ||
          url.pathname.startsWith("/@id/") ||
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

    await page.locator('[role="gridcell"][data-date="2027-03-01"]').click();
    const overflow = page.locator('[data-yp-part="overflow-button"]').first();
    if ((await overflow.count()) > 0) {
      await overflow.click();
      const popover = page.locator('[data-yp-part="overflow-popover"]');
      await expect(popover).toBeVisible();
      const popoverHtml = await popover.innerHTML();
      expect(popoverHtml).not.toContain("TOPSECRET-HIDDEN");
      expect(popoverHtml).not.toContain("security-secret");
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
    expect(leaks).toEqual([]);
    expect(unexpected).toEqual([]);
    expect(sockets.filter((url) => !url.startsWith("ws://127.0.0.1:4173"))).toEqual([]);
  });

  test("renders under the documented CSP attribute allowance", async ({ page }) => {
    const attackerRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("attacker.example")) attackerRequests.push(request.url());
    });
    // The dev server needs ws: for HMR and an inline bootstrap script; the
    // production baseline is `script-src 'self'` and `connect-src 'self'`.
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();
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
    const navigation = await page.goto("/?security=1");
    expect(navigation?.headers()["content-security-policy"]).toContain("style-src-attr");
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

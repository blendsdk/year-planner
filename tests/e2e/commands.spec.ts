import { expect, type Page, test } from "@playwright/test";

const cell = (page: Page, date: string) => page.locator(`[data-date="${date}"]`).first();

async function dragBookingTo(page: Page, targetDate: string) {
  const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
  await expect(proxy).toBeVisible();
  await proxy.scrollIntoViewIfNeeded();
  await cell(page, targetDate).scrollIntoViewIfNeeded();
  const start = await proxy.boundingBox();
  const target = await cell(page, targetDate).boundingBox();
  if (!start || !target) throw new Error("missing drag geometry");
  await page.mouse.move(start.x + 20, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
}

const items = async (page: Page) =>
  JSON.parse((await page.getByTestId("commands-items").textContent()) ?? "[]") as Array<{
    id: string;
    period: { startDate: string; endDateExclusive: string };
  }>;
const diagnostics = async (page: Page) =>
  JSON.parse((await page.getByTestId("commands-diagnostics").textContent()) ?? "[]") as string[];

test.describe("RD-08 controlled command fixture", () => {
  test.use({ viewport: { width: 2400, height: 1400 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/?commands=1");
  });

  test("accepts a controlled move and clears pending", async ({ page }) => {
    await dragBookingTo(page, "2027-02-02");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-02-02");
    await expect(page.locator('[data-item-id="booking"][data-yp-pending="true"]')).toHaveCount(0);
    await expect(page.locator('[data-yp-part="command-status"]')).toContainText("Change accepted");
  });

  test("rejects a move and keeps the source period", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("reject");
    await dragBookingTo(page, "2027-02-02");
    await expect.poll(async () => diagnostics(page)).toContain("CAPACITY_EXCEEDED");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-01-28");
    await expect(page.locator('[data-yp-part="inspector-feedback"]')).toContainText(
      "CAPACITY_EXCEEDED",
    );
  });

  test("reports a stale revision without moving the item", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("stale");
    await dragBookingTo(page, "2027-02-02");
    await expect.poll(async () => diagnostics(page)).toContain("STALE_REVISION");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-01-28");
  });

  test("times out a stalled host and rolls back", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("timeout");
    await dragBookingTo(page, "2027-02-02");
    await expect
      .poll(async () => diagnostics(page), { timeout: 5000 })
      .toContain("COMMAND_TIMEOUT");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-01-28");
  });

  test("reports accepted-not-applied when props never change", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("never-apply");
    await dragBookingTo(page, "2027-02-02");
    await expect
      .poll(async () => page.locator('[data-yp-part="inspector-feedback"]').textContent(), {
        timeout: 5000,
      })
      .toContain("ACCEPTED_NOT_APPLIED");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-01-28");
  });

  test("displays a warning without blocking the move", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("warning");
    await dragBookingTo(page, "2027-02-02");
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-02-02");
    await expect(page.locator('[data-yp-part="inspector-notices"]')).toContainText(
      "Check the range",
    );
  });

  test("keeps a pending preview while the host is delayed", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("delay");
    await dragBookingTo(page, "2027-02-02");
    await expect(page.locator('[data-yp-part="gesture-preview"]').first()).toBeVisible();
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
        { timeout: 5000 },
      )
      .toBe("2027-02-02");
    await expect(page.locator('[data-yp-part="gesture-preview"]')).toHaveCount(0);
  });

  test("rejects a third dock booking through the mock capacity host", async ({ page }) => {
    await page.getByTestId("commands-mode").selectOption("capacity");
    const before = (await items(page)).length;
    await page.getByTestId("commands-add-dock").click();
    await expect.poll(async () => diagnostics(page)).toContain("CAPACITY_EXCEEDED");
    expect((await items(page)).length).toBe(before);
  });
});

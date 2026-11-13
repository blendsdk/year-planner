import { expect, type Page, test } from "@playwright/test";

const cell = (page: Page, date: string) => page.locator(`[data-date="${date}"]`);

const selection = async (page: Page) =>
  JSON.parse((await page.getByTestId("selection-json").textContent()) ?? "{}");

async function touchDrag(page: Page, from: string, to: string) {
  await cell(page, from).scrollIntoViewIfNeeded();
  await cell(page, to).scrollIntoViewIfNeeded();
  await cell(page, from).scrollIntoViewIfNeeded();
  const start = await cell(page, from).boundingBox();
  const end = await cell(page, to).boundingBox();
  if (!start || !end) throw new Error(`missing cell ${from} or ${to}`);
  // Aim below the 24 px item lane so the drag starts on the date cell, not on
  // an item proxy or resize handle.
  await touchDragPoints(
    page,
    { x: start.x + start.width / 2, y: start.y + start.height - 8 },
    { x: end.x + end.width / 2, y: end.y + end.height - 8 },
  );
}

async function touchDragPoints(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [from],
  });
  for (let step = 1; step <= 6; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: from.x + ((to.x - from.x) * step) / 6,
          y: from.y + ((to.y - from.y) * step) / 6,
        },
      ],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test.describe("RD-07-AC-12: touch interaction", () => {
  test("touch editing is scroll-first until explicitly enabled", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CDP touch input is Chromium-only");
    test.skip(!test.info().project.name.startsWith("touch"), "touch project only");
    await page.goto("/?interaction=1");
    await page.getByTestId("interaction-mode").selectOption("select");
    const grid = page.locator('[data-yp-part="grid"]');
    await expect(grid).toHaveCSS("touch-action", "auto");

    await page.getByTestId("touch-mode").selectOption("off");
    await touchDrag(page, "2027-02-01", "2027-02-05");
    await expect.poll(async () => (await selection(page)).dates).toEqual([]);

    await page.getByTestId("touch-mode").selectOption("auto");
    await expect(grid).toHaveCSS("touch-action", "auto");
    await touchDrag(page, "2027-02-01", "2027-02-05");
    await expect.poll(async () => (await selection(page)).dates).toEqual([]);

    await page.getByTestId("touch-mode").selectOption("on");
    await expect(grid).toHaveCSS("touch-action", "none");
    await touchDrag(page, "2027-02-01", "2027-02-05");
    await expect.poll(async () => (await selection(page)).dates.length).toBeGreaterThan(0);
  });
});

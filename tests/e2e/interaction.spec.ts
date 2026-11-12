import { expect, type Page, test } from "@playwright/test";

const cell = (page: Page, date: string) => page.locator(`[data-date="${date}"]`);

async function dragCells(page: Page, from: string, to: string) {
  const start = await cell(page, from).boundingBox();
  const end = await cell(page, to).boundingBox();
  if (!start || !end) throw new Error(`missing cell ${from} or ${to}`);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
  await page.mouse.up();
}

const selection = async (page: Page) =>
  JSON.parse((await page.getByTestId("selection-json").textContent()) ?? "{}");

const items = async (page: Page) =>
  JSON.parse((await page.getByTestId("items-json").textContent()) ?? "[]");

const diagnostics = async (page: Page) =>
  JSON.parse((await page.getByTestId("diagnostics-json").textContent()) ?? "[]");

const selectionText = async (page: Page) =>
  page.evaluate(() => window.getSelection()?.toString() ?? "");

test.describe("RD-07-AC-01/05/06/07/08/11: interaction demo", () => {
  test.use({ viewport: { width: 2400, height: 1400 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/?interaction=1");
  });

  test("RD-11-AC-08: drags a cross-month date range with two previews", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: "Demo routes" })).toBeVisible();
    await page.getByTestId("interaction-mode").selectOption("select");
    await cell(page, "2027-01-28").scrollIntoViewIfNeeded();
    await cell(page, "2027-02-06").scrollIntoViewIfNeeded();
    await cell(page, "2027-01-28").scrollIntoViewIfNeeded();
    const start = (await cell(page, "2027-01-28").boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const end = (await cell(page, "2027-02-06").boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
    await expect(page.locator('[data-yp-part="selection-preview"]')).toHaveCount(2);
    await page.mouse.up();
    await expect
      .poll(async () => (await selection(page)).dates)
      .toEqual([{ startDate: "2027-01-28", endDateExclusive: "2027-02-07" }]);
    expect(await selectionText(page)).toBe("");
  });

  test("does not leave a native text selection after a date drag", async ({ page }) => {
    await page.getByTestId("interaction-mode").selectOption("select");
    await cell(page, "2027-01-28").scrollIntoViewIfNeeded();
    await cell(page, "2027-02-06").scrollIntoViewIfNeeded();
    await cell(page, "2027-01-28").scrollIntoViewIfNeeded();
    const start = await cell(page, "2027-01-28").boundingBox();
    const end = await cell(page, "2027-02-06").boundingBox();
    if (!start || !end) throw new Error("missing selection drag geometry");
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await selectionText(page)).toBe("");
  });

  test("marquees three intersecting ribbons", async ({ page }) => {
    const startCell = await cell(page, "2027-02-01").boundingBox();
    const endCell = await cell(page, "2027-01-05").boundingBox();
    if (!startCell || !endCell) throw new Error("missing marquee cells");
    // Start below the February proxies so the rectangle starts on a cell, then
    // sweep upward-left across the three overlapping ribbons.
    await page.mouse.move(startCell.x + startCell.width / 2, startCell.y + startCell.height - 5);
    await page.mouse.down();
    await page.mouse.move(endCell.x + endCell.width / 2, endCell.y + endCell.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    await expect
      .poll(async () => ((await selection(page)).items ?? []).sort())
      .toEqual(["booking", "maintenance", "training"]);
    expect(await selectionText(page)).toBe("");
  });

  test("moves a ten-day item to a cross-month target", async ({ page }) => {
    const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
    await expect(proxy).toBeVisible();
    await proxy.scrollIntoViewIfNeeded();
    await cell(page, "2027-02-20").scrollIntoViewIfNeeded();
    const start = await proxy.boundingBox();
    const target = await cell(page, "2027-02-20").boundingBox();
    if (!start || !target) throw new Error("missing move target");
    await page.mouse.move(start.x + 40, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(
        async () =>
          (await items(page)).find((entry: { id: string }) => entry.id === "booking")?.period,
      )
      .toEqual({ kind: "all-day", startDate: "2027-02-20", endDateExclusive: "2027-03-02" });
    expect(await selectionText(page)).toBe("");
  });

  test("resizes an item from its end handle", async ({ page }) => {
    const handle = page
      .locator('[data-yp-part="item-fragment"][data-item-id="booking"] [data-yp-part="resize-end"]')
      .first();
    await expect(handle).toBeAttached();
    await handle.scrollIntoViewIfNeeded();
    await cell(page, "2027-02-04").scrollIntoViewIfNeeded();
    const start = await handle.boundingBox();
    const target = await cell(page, "2027-02-04").boundingBox();
    if (!start || !target) throw new Error("missing resize target");
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(
        async () =>
          (await items(page)).find((entry: { id: string }) => entry.id === "booking")?.period,
      )
      .toEqual({ kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-05" });
    expect(await selectionText(page)).toBe("");
  });

  test("erases a highlight range and undo restores it", async ({ page }) => {
    await page.getByTestId("interaction-mode").selectOption("erase");
    await cell(page, "2027-06-14").scrollIntoViewIfNeeded();
    await cell(page, "2027-06-16").scrollIntoViewIfNeeded();
    await dragCells(page, "2027-06-14", "2027-06-16");
    const highlightPeriods = async () =>
      (await items(page))
        .map((entry: { period: { startDate: string; endDateExclusive: string } }) => entry.period)
        .filter(
          (period: { startDate: string; endDateExclusive: string }) =>
            period.startDate >= "2027-06-10" && period.startDate < "2027-06-21",
        )
        .sort((left: { startDate: string }, right: { startDate: string }) =>
          left.startDate.localeCompare(right.startDate),
        );
    await expect.poll(highlightPeriods).toEqual([
      { kind: "all-day", startDate: "2027-06-10", endDateExclusive: "2027-06-14" },
      { kind: "all-day", startDate: "2027-06-17", endDateExclusive: "2027-06-21" },
    ]);
    expect(await selectionText(page)).toBe("");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect
      .poll(highlightPeriods)
      .toEqual([{ kind: "all-day", startDate: "2027-06-10", endDateExclusive: "2027-06-21" }]);
  });

  test("supports keyboard range, toggle, inspect and select-all", async ({ page }) => {
    await cell(page, "2027-02-01").focus();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect
      .poll(async () => (await selection(page)).dates)
      .toEqual([{ startDate: "2027-02-01", endDateExclusive: "2027-02-04" }]);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("complementary", { name: "Planner inspector" })).toBeVisible();
    await cell(page, "2027-02-01").focus();
    await page.keyboard.press("Control+a");
    await expect
      .poll(async () => ((await selection(page)).items ?? []).sort())
      .toEqual(["booking", "highlight", "holiday", "maintenance", "training"]);
  });

  test("paints a new highlight range", async ({ page }) => {
    await page.getByTestId("interaction-mode").selectOption("paint");
    await cell(page, "2027-07-01").scrollIntoViewIfNeeded();
    await cell(page, "2027-07-03").scrollIntoViewIfNeeded();
    await dragCells(page, "2027-07-01", "2027-07-03");
    await expect
      .poll(async () =>
        (await items(page)).some(
          (entry: { period: { startDate: string; endDateExclusive: string } }) =>
            entry.period.startDate === "2027-07-01" &&
            entry.period.endDateExclusive === "2027-07-04",
        ),
      )
      .toBe(true);
    expect(await selectionText(page)).toBe("");
  });

  test("shows an invalid resize diagnostic and keeps the item", async ({ page }) => {
    const handle = page
      .locator('[data-yp-part="item-fragment"][data-item-id="booking"] [data-yp-part="resize-end"]')
      .first();
    await expect(handle).toBeAttached();
    await handle.scrollIntoViewIfNeeded();
    await cell(page, "2027-01-27").scrollIntoViewIfNeeded();
    const start = await handle.boundingBox();
    const target = await cell(page, "2027-01-27").boundingBox();
    if (!start || !target) throw new Error("missing invalid resize target");
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await diagnostics(page)).includes("INVALID_COMMAND")).toBe(true);
    await expect
      .poll(
        async () =>
          (await items(page)).find((entry: { id: string }) => entry.id === "booking")?.period,
      )
      .toEqual({ kind: "all-day", startDate: "2027-01-28", endDateExclusive: "2027-02-07" });
  });

  test("supports arrow focus, Space toggle and inspector move-by-week", async ({ page }) => {
    await cell(page, "2027-02-01").focus();
    await page.keyboard.press("ArrowRight");
    await expect(cell(page, "2027-02-02")).toHaveAttribute("tabindex", "0");
    await page.keyboard.press(" ");
    await expect
      .poll(async () => (await selection(page)).dates)
      .toEqual([{ startDate: "2027-02-02", endDateExclusive: "2027-02-03" }]);

    await page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first().click();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Move later" }).click();
    await expect
      .poll(
        async () =>
          (await items(page)).find((entry: { id: string }) => entry.id === "booking")?.period,
      )
      .toEqual({ kind: "all-day", startDate: "2027-02-04", endDateExclusive: "2027-02-14" });
  });
});

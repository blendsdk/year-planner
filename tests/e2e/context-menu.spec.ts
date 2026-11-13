import { expect, test } from "@playwright/test";

interface LoggedRequest {
  target: { kind: string; date: string; itemId?: string; annotationId?: string };
  source: "pointer" | "keyboard";
  clientX: number;
  clientY: number;
}

/** Reads the demo's context-menu event log. */
async function readLog(page: import("@playwright/test").Page): Promise<LoggedRequest[]> {
  const text = await page.getByTestId("context-log").textContent();
  return JSON.parse(text ?? "[]") as LoggedRequest[];
}

test.describe("RD-13-AC-05: host-owned context menu", () => {
  test("raises pointer and keyboard requests without a built-in menu", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto("/?context=1&year=2027");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByTestId("context-log")).toHaveText("[]");

    const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
    await expect(proxy).toBeVisible();
    await proxy.click({ button: "right" });

    await expect(page.locator('[data-yp-part="context-menu"]')).toHaveCount(0);
    let log = await readLog(page);
    expect(log).toHaveLength(1);
    expect(log[0]?.source).toBe("pointer");
    expect(log[0]?.target.kind).toBe("item");
    expect(log[0]?.target.itemId).toBe("booking");
    expect(log[0]?.target.date).toMatch(/^2027-0[12]-\d{2}$/);
    await expect(proxy).toHaveAttribute("aria-pressed", "true");

    const cell = page.locator('[role="gridcell"][data-date="2027-02-02"]');
    await cell.focus();
    await page.keyboard.press("Shift+F10");
    log = await readLog(page);
    expect(log).toHaveLength(2);
    expect(log[1]?.source).toBe("keyboard");
    expect(log[1]?.target).toEqual({ kind: "date", date: "2027-02-02" });
  });
});

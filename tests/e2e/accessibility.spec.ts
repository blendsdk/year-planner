import { expect, type Page, test } from "@playwright/test";
import axe, { type AxeResults } from "axe-core";

declare global {
  interface Window {
    axe: {
      run(context: Element, options: object): Promise<AxeResults>;
    };
  }
}

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scanPlanner(page: Page, label: string): Promise<void> {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(async (tags) => {
    const root = document.querySelector(".yp-root");
    if (!root) throw new Error("planner root not found");
    return window.axe.run(root, {
      runOnly: { type: "tag", values: tags },
    });
  }, TAGS);
  const serious = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
        html: node.html.slice(0, 300),
      })),
    })),
    `${label}: serious or critical axe violations`,
  ).toEqual([]);
}

async function selection(page: Page): Promise<{ dates: { startDate: string }[]; items: string[] }> {
  return JSON.parse((await page.getByTestId("selection-json").textContent()) ?? "{}");
}

async function items(page: Page): Promise<{ id: string; period: { startDate: string } }[]> {
  return JSON.parse((await page.getByTestId("items-json").textContent()) ?? "[]");
}

test.describe("RD-09-AC-07/15: axe matrix", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "axe matrix is Chromium-only");
  });

  test("classic-blue compact", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await scanPlanner(page, "classic-blue compact");
  });

  test("classic-yellow compact", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await page.locator("select").nth(1).selectOption("classic-yellow");
    await scanPlanner(page, "classic-yellow compact");
  });

  test("high-contrast compact", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await page.locator("select").nth(1).selectOption("high-contrast");
    await scanPlanner(page, "high-contrast compact");
  });

  test("expanded density", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await page.getByTestId("density").selectOption("expanded");
    await scanPlanner(page, "expanded density");
  });

  test("open overflow dialog", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await page.locator('[data-yp-part="overflow-button"]').first().click();
    await expect(page.locator('[data-yp-part="overflow-popover"]')).toBeVisible();
    await scanPlanner(page, "overflow dialog");
  });

  test("command error state", async ({ page }) => {
    await page.goto("/?commands=1");
    await page.getByTestId("commands-mode").selectOption("reject");
    await page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first().click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator('[data-yp-part="inspector-feedback"]')).toBeVisible();
    await scanPlanner(page, "command error");
  });

  test("AC3 design-system buttons", async ({ page }) => {
    await page.goto("/?ac3=1");
    await page.locator("select").nth(0).selectOption("2027");
    await expect(page.getByRole("button", { name: "Fluent cell button" })).toBeVisible();
    await scanPlanner(page, "AC3 design-system fixtures");
  });

  test("36-month window", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    await page.locator("select").nth(2).selectOption("36");
    await expect(page.locator("[data-row-id]")).toHaveCount(36);
    await scanPlanner(page, "36-month window");
  });
});

test.describe("RD-09-AC-01/02/05/11/14: keyboard evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?interaction=1");
  });

  test("moves, extends, toggles and inspects with the keyboard", async ({ page }) => {
    await page.locator('[data-date="2027-02-01"]').focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect
      .poll(async () => (await selection(page)).dates)
      .toContainEqual({ startDate: "2027-02-01", endDateExclusive: "2027-02-04" });
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-yp-part="inspector"]')).toBeVisible();
    await expect(page.locator('[data-yp-part="inspector"]')).toContainText("Inspector");
  });

  test("keeps one tab stop per composite", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").nth(0).selectOption("2027");
    expect(await page.locator('[role="gridcell"][tabindex="0"]').count()).toBe(1);
    expect(await page.locator('[data-yp-part="item-proxy"][tabindex="0"]').count()).toBe(1);
    await page.locator('[data-date="2027-04-01"]').focus();
    expect(await page.locator('[data-yp-part="overflow-button"][tabindex="0"]').count()).toBe(1);
  });

  test("skip link focuses the item list", async ({ page }) => {
    const link = page.locator(".yp-skip-link");
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-yp-part="item-list"]')).toBeFocused();
  });

  test("moves an item by a week from the inspector", async ({ page }) => {
    await page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first().click();
    await expect(page.locator('[data-yp-part="inspector"]')).toBeVisible();
    await page.getByRole("button", { name: "Move later" }).click();
    await expect
      .poll(
        async () => (await items(page)).find((entry) => entry.id === "booking")?.period.startDate,
      )
      .toBe("2027-02-04");
  });

  test("removes a hidden item from the DOM and announces the focus fallback", async ({ page }) => {
    await page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first().click();
    await page.getByTestId("hide-focused-item").click();
    await expect(page.locator('[data-item-id="booking"]')).toHaveCount(0);
    await expect(page.locator('[data-yp-item-id="booking"]')).toHaveCount(0);
    await expect(page.locator('[data-yp-part="focus-status"]')).toContainText(/focus moved/i);
    await page.getByTestId("show-all-items").click();
    await expect(page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]')).toHaveCount(
      2,
    );
  });

  test("shows an unclipped proxy focus ring and a distinct selected-cell focus", async ({
    page,
  }) => {
    const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
    await proxy.focus();
    const proxyStyle = await proxy.evaluate((element) => {
      const fragment = element.closest('[data-yp-part="item-fragment"]');
      const proxyStyle = getComputedStyle(element);
      return {
        overflow: fragment ? getComputedStyle(fragment).overflow : "",
        outline: proxyStyle.outlineStyle,
        halo: proxyStyle.boxShadow,
      };
    });
    expect(proxyStyle.overflow).toBe("visible");
    expect(proxyStyle.outline).toBe("solid");
    expect(proxyStyle.halo).toContain("rgb(255, 255, 255)");

    const cell = page.locator('[data-date="2027-02-01"]');
    await cell.focus();
    expect(await cell.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("dashed");
  });

  test("keeps focus visible in forced-colors mode", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "forced-colors emulation is Chromium-only");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/?interaction=1");
    const proxy = page.locator('[data-yp-part="item-proxy"][data-item-id="booking"]').first();
    await proxy.focus();
    const style = await proxy.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { outlineStyle: computed.outlineStyle, outlineWidth: computed.outlineWidth };
    });
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).not.toBe("0px");
  });

  test("contains no nested interactive controls inside item proxies", async ({ page }) => {
    const nested = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-yp-part="item-proxy"]')).filter((proxy) =>
          proxy.querySelector("button, a, input, select, textarea, [tabindex]"),
        ).length,
    );
    expect(nested).toBe(0);
  });
});

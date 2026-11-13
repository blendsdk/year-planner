import { expect, test } from "@playwright/test";

/** One host size from the RD-13 fit acceptance matrix. */
const CASES = [
  { width: 1280, height: 800, months: 14 },
  { width: 1440, height: 900, months: 14 },
  { width: 1024, height: 768, months: 12 },
] as const;

interface FitMetrics {
  page: { width: number; height: number; scrollWidth: number; scrollHeight: number };
  viewport: {
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
  };
  cells: Array<{ width: number; height: number }>;
  proxies: Array<{ width: number; height: number }>;
  rows: number;
  monthAlign: string;
  monthJustify: string;
  monthFont: string;
  headingFont: string;
  monthFits: boolean;
  laneTops: number[];
}

/** Reads the rendered fit metrics from the page. */
async function readMetrics(page: import("@playwright/test").Page): Promise<FitMetrics> {
  return page.evaluate(() => {
    const viewport = document.querySelector('[data-yp-part="viewport"]') as HTMLElement;
    const cells = [...document.querySelectorAll('[role="gridcell"]')].map((entry) => {
      const rect = entry.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    const proxies = [
      ...document.querySelectorAll('[data-yp-channel="ribbon"] [data-yp-part="item-proxy"]'),
    ].map((entry) => {
      const rect = entry.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    const month = document.querySelector(".yp-month") as HTMLElement;
    const monthStyle = getComputedStyle(month);
    const heading = document.querySelector(".yp-heading") as HTMLElement;
    // offsetTop is relative to the row's item overlay, so one visible lane
    // produces one value near the lane top and two lanes produce a second
    // value at least 24 px lower.
    const laneTops = [
      ...new Set(
        [...document.querySelectorAll('[data-yp-channel="ribbon"]')].map((entry) =>
          Math.round((entry as HTMLElement).offsetTop),
        ),
      ),
    ].sort((left, right) => left - right);
    return {
      page: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      viewport: {
        clientWidth: viewport.clientWidth,
        clientHeight: viewport.clientHeight,
        scrollWidth: viewport.scrollWidth,
        scrollHeight: viewport.scrollHeight,
      },
      cells,
      proxies,
      rows: document.querySelectorAll("[data-row-id]").length,
      monthAlign: monthStyle.alignItems,
      monthJustify: monthStyle.justifyContent,
      monthFont: monthStyle.fontSize,
      headingFont: getComputedStyle(heading).fontSize,
      monthFits: month.scrollWidth <= month.clientWidth,
      laneTops,
    };
  });
}

test.describe("RD-13-AC-01 / RD-13-AC-02: host-region fit", () => {
  for (const size of CASES) {
    test(`fits ${size.width} x ${size.height} with ${size.months} months @visual`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(`/?fit=1&months=${size.months}&year=2027`);
      await expect(page.getByRole("grid")).toBeVisible();
      await page.waitForTimeout(300);
      const metrics = await readMetrics(page);

      expect(metrics.rows).toBe(size.months);
      // The page itself never scrolls: the planner fills its host.
      expect(metrics.page.scrollWidth).toBeLessThanOrEqual(metrics.page.width);
      expect(metrics.page.scrollHeight).toBeLessThanOrEqual(metrics.page.height);
      // The component fits or scrolls inside its own viewport, never clips.
      expect(metrics.viewport.scrollWidth).toBeLessThanOrEqual(metrics.viewport.clientWidth + 1);
      expect(metrics.viewport.scrollHeight).toBeLessThanOrEqual(metrics.viewport.clientHeight + 1);

      // Every date cell keeps the 24 px interaction floor.
      expect(Math.min(...metrics.cells.map((cell) => cell.width))).toBeGreaterThanOrEqual(24);
      expect(Math.min(...metrics.cells.map((cell) => cell.height))).toBeGreaterThanOrEqual(24);

      // Ribbon item proxies keep the 24 px floor.
      if (metrics.proxies.length > 0) {
        expect(Math.min(...metrics.proxies.map((proxy) => proxy.width))).toBeGreaterThanOrEqual(24);
        expect(Math.min(...metrics.proxies.map((proxy) => proxy.height))).toBeGreaterThanOrEqual(
          24,
        );
      }

      // One visible ribbon lane and centred, token-driven header typography.
      expect(metrics.laneTops.length, "one ribbon lane").toBeLessThanOrEqual(1);
      expect(metrics.monthAlign).toBe("center");
      expect(metrics.monthJustify).toBe("center");
      expect(metrics.monthFont).toBe("13px");
      expect(metrics.headingFont).toBe("11px");
      expect(metrics.monthFits).toBe(true);

      await expect(page.locator('[data-testid="fit-host"]')).toHaveScreenshot(
        `fit-${size.width}x${size.height}.png`,
        { maxDiffPixelRatio: 0.02, animations: "disabled" },
      );
    });
  }
});

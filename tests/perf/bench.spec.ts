import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { BUDGETS, CEILING_FACTOR, statusFor } from "../../scripts/bench-budgets.mjs";

/**
 * Browser benchmark and budget gate.
 *
 * The preview project measures production builds and records every scenario.
 * The dev project runs one matching drag so the development-only overhead is
 * visible instead of being guessed. Results are written as JSON files that the
 * `bench` orchestrator aggregates into the checked-in report.
 */

const OUT = "test-results/bench";
const PROFILE_DIR = `${OUT}/profiles`;

/** Returns a nearest-rank percentile. */
function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

/** Summarises a numeric sample. */
function stats(values: readonly number[]) {
  return {
    count: values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    max: values.length ? Math.max(...values) : 0,
  };
}

/** Writes one scenario result for the orchestrator. */
function writeResult(name: string, payload: Record<string, unknown>): void {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/results-${name}.json`, `${JSON.stringify(payload, null, 2)}\n`);
}

/** Waits for the benchmark route to report its first painted frame. */
async function waitForBench(page: Page): Promise<NonNullable<Window["__YP_BENCH__"]>> {
  await page.waitForFunction(() => window.__YP_BENCH__?.ready === true, undefined, {
    timeout: 120_000,
  });
  const ready = await page.evaluate(() => window.__YP_BENCH__);
  if (!ready) throw new Error("benchmark route did not report readiness");
  return ready;
}

/** Measures five fresh loads of one benchmark route. */
async function measureInitialRender(
  page: Page,
  query: string,
  repeats = 5,
): Promise<ReturnType<typeof stats> & { domNodes: number }> {
  const samples: number[] = [];
  let domNodes = 0;
  for (let index = 0; index < repeats; index += 1) {
    await page.goto(`/?bench=1&${query}`);
    const ready = await waitForBench(page);
    samples.push(ready.readyMs);
    domNodes = ready.domNodes;
  }
  return { ...stats(samples), domNodes };
}

/** Installs the frame, long-task and input-delay collectors. */
async function startCollectors(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__YP_FRAMES__ = { deltas: [], longTasks: [], inputDelays: [] };
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__YP_FRAMES__?.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    });
    observer.observe({ type: "longtask", buffered: false });
    document.querySelector('[data-yp-part="grid"]')?.addEventListener(
      "pointermove",
      (event) => {
        window.__YP_FRAMES__?.inputDelays.push(performance.now() - event.timeStamp);
      },
      true,
    );
    window.__YP_RUNNING__ = true;
    let previous = performance.now();
    const tick = (now: number): void => {
      window.__YP_FRAMES__?.deltas.push(now - previous);
      previous = now;
      if (window.__YP_RUNNING__) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Stops the collectors and returns their samples. */
async function stopCollectors(page: Page) {
  return page.evaluate(() => {
    window.__YP_RUNNING__ = false;
    const frames = window.__YP_FRAMES__ ?? { deltas: [], longTasks: [], inputDelays: [] };
    return {
      deltas: frames.deltas.slice(1),
      longTasks: frames.longTasks,
      inputDelays: frames.inputDelays,
    };
  });
}

/** Drags from one date cell to another with one pointer move per frame. */
async function dragDates(page: Page, fromDate: string, toDate: string, steps = 60): Promise<void> {
  const from = page.locator(`[role="gridcell"][data-date="${fromDate}"]`);
  const to = page.locator(`[role="gridcell"][data-date="${toDate}"]`);
  await from.scrollIntoViewIfNeeded();
  await to.scrollIntoViewIfNeeded();
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error("drag target is not visible");
  const startX = start.x + start.width / 2;
  const startY = start.y + start.height / 2;
  const endX = end.x + end.width / 2;
  const endY = end.y + end.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  const previewStep = Math.max(1, Math.floor(steps / 2));
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(
      startX + ((endX - startX) * step) / steps,
      startY + ((endY - startY) * step) / steps,
      { steps: 1 },
    );
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    if (step === previewStep) {
      expect(
        await page.locator('[data-yp-part="selection-preview"]').count(),
        "drag preview is active",
      ).toBeGreaterThan(0);
    }
  }
  await page.mouse.up();
}

/** Measures one drag and records its frame, input-delay and long-task data. */
async function measureDrag(
  page: Page,
  query: string,
  profileLabel?: string,
  steps = 60,
  minSamples = 55,
): Promise<{
  frames: ReturnType<typeof stats>;
  inputDelays: ReturnType<typeof stats>;
  longTasks: number;
  longTaskMax: number;
}> {
  await page.goto(`/?bench=1&${query}`);
  await waitForBench(page);
  await startCollectors(page);
  let profile: unknown;
  if (profileLabel) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
    await dragDates(page, "2027-01-28", "2027-02-16", steps);
    const stopped = await cdp.send("Profiler.stop");
    profile = stopped.profile;
  } else {
    await dragDates(page, "2027-01-28", "2027-02-16", steps);
  }
  const samples = await stopCollectors(page);
  if (profileLabel && profile) {
    mkdirSync(PROFILE_DIR, { recursive: true });
    writeFileSync(`${PROFILE_DIR}/${profileLabel}.cpuprofile`, JSON.stringify(profile));
  }
  expect(samples.deltas.length, "frame samples").toBeGreaterThanOrEqual(minSamples);
  expect(samples.inputDelays.length, "pointer samples").toBeGreaterThanOrEqual(minSamples);
  const longTaskMax = samples.longTasks.reduce((max, entry) => Math.max(max, entry.duration), 0);
  return {
    frames: stats(samples.deltas),
    inputDelays: stats(samples.inputDelays),
    longTasks: samples.longTasks.length,
    longTaskMax,
  };
}

/**
 * Enforces the 2x ceiling only in strict mode.
 *
 * The first baseline run records the pre-optimization state, which may be
 * above the ceiling; strict mode is the post-optimization gate.
 */
function expectWithinCeiling(value: number, budget: number, label: string): void {
  if (process.env.PERF_STRICT !== "1") return;
  expect(value, `${label} above the 2x ceiling`).toBeLessThanOrEqual(budget * CEILING_FACTOR);
}

/** Returns the checked-in baseline drag p95, if a baseline exists. */
function baselineDragP95(): number | undefined {
  try {
    const baseline = JSON.parse(readFileSync("docs/benchmarks/rd10-baseline.json", "utf8")) as {
      results?: { scenario?: string; frames?: { p95?: number } }[];
    };
    return baseline.results?.find((entry) => entry.scenario === "issue3-production")?.frames?.p95;
  } catch {
    return undefined;
  }
}

test.describe("RD-10-AC-11: production budgets", () => {
  test("initial render 500/2k/10k compact", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    test.setTimeout(420_000);
    for (const items of [500, 2000, 10000]) {
      // The reference host cannot keep five 10k-item documents alive without
      // exhausting its memory, so the largest case records three loads.
      const result = await measureInitialRender(
        page,
        `items=${items}&months=14`,
        items >= 10000 ? 3 : 5,
      );
      writeResult(`initial-${items}`, {
        scenario: "initial-render",
        project: testInfo.project.name,
        parameters: { items, months: 14 },
        ...result,
        budget: BUDGETS.initialRenderP95Ms,
        status: statusFor(result.p95, BUDGETS.initialRenderP95Ms),
      });
      expectWithinCeiling(result.p95, BUDGETS.initialRenderP95Ms, `${items} item initial render`);
    }
  });

  test("initial render 12/14/18/24/36 months", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    for (const months of [12, 14, 18, 24, 36]) {
      const result = await measureInitialRender(page, `items=500&months=${months}`);
      writeResult(`initial-${months}-months`, {
        scenario: "initial-render-window",
        project: testInfo.project.name,
        parameters: { items: 500, months },
        ...result,
        budget: BUDGETS.initialRenderP95Ms,
        status: statusFor(result.p95, BUDGETS.initialRenderP95Ms),
      });
      expectWithinCeiling(result.p95, BUDGETS.initialRenderP95Ms, `${months} month initial render`);
    }
  });

  test("compact drag 500/2k/10k", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    test.setTimeout(600_000);
    for (const items of [500, 2000, 10000]) {
      // A 10k-item document needs seconds per frame on the reference host, so
      // the largest drag records 25 frames over 30 steps instead of 55.
      const large = items >= 10000;
      const result = await measureDrag(
        page,
        `items=${items}&months=14`,
        undefined,
        large ? 30 : 60,
        large ? 25 : 55,
      );
      writeResult(`drag-${items}`, {
        scenario: "drag",
        project: testInfo.project.name,
        parameters: { items, months: 14, density: "compact" },
        ...result,
        budget: BUDGETS.dragP95Ms,
        status: statusFor(result.frames.p95, BUDGETS.dragP95Ms),
      });
      expectWithinCeiling(result.frames.p95, BUDGETS.dragP95Ms, `${items} item drag`);
    }
  });

  test("expanded drag 500", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    const result = await measureDrag(page, "items=500&months=14&density=expanded");
    writeResult("drag-expanded-500", {
      scenario: "drag-expanded",
      project: testInfo.project.name,
      parameters: { items: 500, months: 14, density: "expanded" },
      ...result,
      budget: BUDGETS.dragP95Ms,
      status: statusFor(result.frames.p95, BUDGETS.dragP95Ms),
    });
    expectWithinCeiling(result.frames.p95, BUDGETS.dragP95Ms, "expanded drag");
  });

  test("overflow open and close with 10k items", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    await page.goto("/?bench=1&items=10000&months=14");
    await waitForBench(page);
    const samples: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      const elapsed = await page.evaluate(async () => {
        const button = document.querySelector('[data-yp-part="overflow-button"]');
        if (!button) throw new Error("overflow button missing");
        const started = performance.now();
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return performance.now() - started;
      });
      await expect(page.locator('[data-yp-part="overflow-popover"]')).toBeVisible();
      samples.push(elapsed);
      await page.keyboard.press("Escape");
      await expect(page.locator('[data-yp-part="overflow-popover"]')).toHaveCount(0);
    }
    const result = stats(samples);
    writeResult("overflow-10000", {
      scenario: "overflow",
      project: testInfo.project.name,
      parameters: { items: 10000, months: 14 },
      ...result,
      budget: BUDGETS.overflowMs,
      status: statusFor(result.p95, BUDGETS.overflowMs),
    });
    expectWithinCeiling(result.p95, BUDGETS.overflowMs, "overflow open");
  });

  test("issue-3 production drag with three repeats and profile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    const repeats = [];
    for (let index = 0; index < 3; index += 1) {
      repeats.push(
        await measureDrag(
          page,
          "items=500&months=14",
          index === 0 ? "issue-3-production" : undefined,
        ),
      );
    }
    const p95s = repeats.map((entry) => entry.frames.p95);
    const result = {
      scenario: "issue3-production",
      project: testInfo.project.name,
      parameters: { items: 500, months: 14 },
      frames: { p95: percentile(p95s, 50), samples: p95s },
      inputDelayP95: percentile(
        repeats.map((entry) => entry.inputDelays.p95),
        50,
      ),
      longTasks: repeats.reduce((total, entry) => total + entry.longTasks, 0),
      longTaskMax: Math.max(...repeats.map((entry) => entry.longTaskMax)),
      budget: BUDGETS.dragP95Ms,
      status: statusFor(percentile(p95s, 50), BUDGETS.dragP95Ms),
      cpuProfile: "test-results/bench/profiles/issue-3-production.cpuprofile",
    };
    writeResult("issue3-production", result);
    expectWithinCeiling(result.frames.p95, BUDGETS.dragP95Ms, "issue-3 production drag");

    if (process.env.PERF_STRICT === "1") {
      const baseline = baselineDragP95();
      expect(baseline, "strict mode needs docs/benchmarks/rd10-baseline.json").toBeDefined();
      const improved = result.frames.p95 <= (baseline ?? Infinity) * 0.9;
      expect(
        improved || result.frames.p95 <= BUDGETS.dragP95Ms,
        `issue-3 oracle: ${result.frames.p95.toFixed(2)} ms against baseline ${String(baseline)}`,
      ).toBe(true);
      expect(result.longTasks, "no new long tasks").toBe(0);
    }
  });

  test("36-month 500-item drag with profile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "bench-dev", "production scenario");
    const result = await measureDrag(page, "items=500&months=36", "36-month-500");
    writeResult("drag-36-months-500", {
      scenario: "drag-36-months",
      project: testInfo.project.name,
      parameters: { items: 500, months: 36 },
      ...result,
      budget: BUDGETS.dragP95Ms,
      status: statusFor(result.frames.p95, BUDGETS.dragP95Ms),
      cpuProfile: "test-results/bench/profiles/36-month-500.cpuprofile",
    });
    expectWithinCeiling(result.frames.p95, BUDGETS.dragP95Ms, "36-month drag");
  });
});

test.describe("issue-3: development overhead", () => {
  test("500-item dev drag with profile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "bench-dev", "dev project only");
    const result = await measureDrag(page, "items=500&months=14", "issue-3-dev");
    writeResult("issue3-dev", {
      scenario: "issue3-dev",
      project: testInfo.project.name,
      parameters: { items: 500, months: 14 },
      ...result,
      budget: BUDGETS.dragP95Ms,
      status: statusFor(result.frames.p95, BUDGETS.dragP95Ms),
      cpuProfile: "test-results/bench/profiles/issue-3-dev.cpuprofile",
    });
  });
});

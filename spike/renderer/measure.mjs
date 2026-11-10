import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium, firefox, webkit } from "@playwright/test";

const ROOT = resolve("dist");
const EVIDENCE = resolve("evidence");
const PORT = 4180;
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = { chromium, firefox, webkit };
const BROWSER_NAMES = ["chromium", "firefox", "webkit"];
const VARIANTS = [
  { id: "html-only", label: "HTML-only" },
  { id: "html-svg", label: "HTML + SVG shape plane" },
  { id: "svg-shapes", label: "SVG shapes + HTML proxies" },
  { id: "full-svg-row", label: "Limited full-SVG row" },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serve() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", BASE);
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = normalize(join(ROOT, decodeURIComponent(requested)));
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    response.setHeader("content-type", MIME[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(response);
  });
  return new Promise((resolveListen) =>
    server.listen(PORT, "127.0.0.1", () => resolveListen(server)),
  );
}

function gzipSize(file) {
  return gzipSync(readFileSync(join(ROOT, file))).byteLength;
}

function bundleSizes() {
  const manifest = JSON.parse(readFileSync(join(ROOT, ".vite", "manifest.json"), "utf8"));
  const cssFile = Object.values(manifest)
    .flatMap((entry) => entry.css ?? [])
    .find((file) => file.endsWith(".css"));
  const collect = (key, seen = new Set()) => {
    const entry = manifest[key];
    if (!entry || seen.has(entry.file)) return seen;
    seen.add(entry.file);
    for (const imported of entry.imports ?? []) collect(imported, seen);
    return seen;
  };
  const mainFiles = collect("index.html");
  const sizes = {};
  for (const variant of VARIANTS) {
    const key = Object.keys(manifest).find((candidate) =>
      candidate.endsWith(`variants/${variant.id}.ts`),
    );
    const files = new Set([...mainFiles, ...(key ? collect(key) : [])]);
    const js = [...files].reduce((total, file) => total + gzipSize(file), 0);
    const css = cssFile ? gzipSize(cssFile) : 0;
    sizes[variant.id] = {
      jsGzipKb: Number((js / 1024).toFixed(2)),
      cssGzipKb: Number((css / 1024).toFixed(2)),
      totalGzipKb: Number(((js + css) / 1024).toFixed(2)),
      chunks: [...files],
    };
  }
  return sizes;
}

function codeLines() {
  const files = [
    "src/grid.ts",
    "src/render.ts",
    "src/variants/html-only.ts",
    "src/variants/html-svg.ts",
    "src/variants/svg-shapes.ts",
    "src/variants/full-svg-row.ts",
  ];
  return Object.fromEntries(
    files.map((file) => [file, readFileSync(file, "utf8").split("\n").length]),
  );
}

function readPdfInfo(path) {
  const output = execFileSync("pdfinfo", [path], { encoding: "utf8" });
  return {
    pages: Number(/^Pages:\s+(\d+)$/m.exec(output)?.[1] ?? "0"),
    pageSize: /^Page size:\s+(.+)$/m.exec(output)?.[1]?.trim() ?? "",
  };
}

async function inspect(page, variant, browserName) {
  await page.goto(`${BASE}/?variant=${variant.id}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__spikeReady === true);
  await page.waitForTimeout(100);

  const counts = await page.evaluate(() => ({
    rows: document.querySelectorAll(".spike-row").length,
    slots: document.querySelectorAll(".spike-cell, .spike-cell-rect").length,
    datedCells: document.querySelectorAll("[data-date]").length,
    ribbons: document.querySelectorAll("[data-ribbon]").length,
    proxies: document.querySelectorAll("[data-proxy-item]").length,
    domNodes: document.querySelectorAll("*").length,
  }));

  const alignment = await page.evaluate(() => {
    const results = [];
    for (const ribbon of document.querySelectorAll("[data-ribbon], [data-proxy-item]")) {
      const rowId = ribbon.dataset.rowId;
      const last = ribbon.dataset.lastDate;
      const start = ribbon.dataset.start;
      const row = document.querySelector(`.spike-row[data-row-id="${rowId}"]`);
      if (!row || !start || !last) continue;
      const startCell = row.querySelector(`[data-date="${start}"]`);
      const endCell = row.querySelector(`[data-date="${last}"]`);
      if (!startCell || !endCell) continue;
      const startRect = startCell.getBoundingClientRect();
      const endRect = endCell.getBoundingClientRect();
      const actual = ribbon.getBoundingClientRect();
      results.push({
        itemId: ribbon.dataset.itemId,
        rowId,
        kind: ribbon.dataset.proxyItem !== undefined ? "proxy" : "ribbon",
        left: Number(Math.abs(actual.left - startRect.left).toFixed(2)),
        right: Number(Math.abs(actual.right - endRect.right).toFixed(2)),
      });
    }
    return results;
  });
  const misaligned = alignment.filter((entry) => entry.left > 1.5 || entry.right > 1.5);

  const crossMonth = await page.evaluate(() => {
    const shapes = [...document.querySelectorAll('[data-ribbon][data-item-id="hl-cross-month"]')];
    return {
      fragments: shapes.length,
      rows: [...new Set(shapes.map((shape) => shape.dataset.rowId))],
    };
  });

  const focus = {};
  const first = page.locator("[data-date]").first();
  await first.focus();
  focus.firstDate = await page.evaluate(
    () => document.activeElement?.getAttribute("data-date") ?? null,
  );
  await page.keyboard.press("ArrowRight");
  focus.afterArrow = await page.evaluate(
    () => document.activeElement?.getAttribute("data-date") ?? null,
  );
  await page.locator('[data-row-id="2027-02"] [data-date="2027-02-01"]').focus();
  await page.keyboard.press("ArrowRight");
  focus.svgRowAfterArrow = await page.evaluate(
    () => document.activeElement?.getAttribute("data-date") ?? null,
  );

  const nestedInteractive = await page.evaluate(() => {
    const selector = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    return [...document.querySelectorAll("[data-ribbon], [data-proxy-item]")].reduce(
      (count, node) => count + node.querySelectorAll(selector).length,
      0,
    );
  });

  const axeSource = readFileSync(resolve("../../node_modules/axe-core/axe.min.js"), "utf8");
  await page.addScriptTag({ content: axeSource });
  const axeViolations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ["violations"] });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
  });

  mkdirSync(EVIDENCE, { recursive: true });
  const screenshotName =
    browserName === "chromium" ? `${variant.id}.png` : `${browserName}-${variant.id}.png`;
  await page.screenshot({ path: join(EVIDENCE, screenshotName), fullPage: true });
  let print = null;
  if (browserName === "chromium") {
    await page.emulateMedia({ media: "print" });
    const pdfPath = join(EVIDENCE, `${variant.id}-a3.pdf`);
    await page.pdf({ path: pdfPath, format: "A3", landscape: true, printBackground: true });
    await page.emulateMedia({ media: "screen" });
    print = readPdfInfo(pdfPath);
  }

  return {
    ...counts,
    alignment: {
      checked: alignment.length,
      misaligned: misaligned.length,
      maxDeviation: Number(
        Math.max(0, ...alignment.map((entry) => Math.max(entry.left, entry.right))).toFixed(2),
      ),
      failures: misaligned.slice(0, 5),
    },
    crossMonth,
    focus,
    nestedInteractive,
    axe: {
      seriousCritical: axeViolations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      ).length,
      violations: axeViolations,
    },
    print,
  };
}

const server = await serve();
const results = {};
for (const browserName of BROWSER_NAMES) {
  const browser = await BROWSERS[browserName].launch();
  const page = await browser.newPage({ viewport: { width: 2040, height: 1400 } });
  results[browserName] = {};
  for (const variant of VARIANTS) {
    results[browserName][variant.id] = await inspect(page, variant, browserName);
  }
  await browser.close();
}
server.close();

const output = {
  generatedAt: new Date().toISOString(),
  browsers: results,
  bundle: bundleSizes(),
  codeLines: codeLines(),
};
writeFileSync(join(EVIDENCE, "measurements.json"), `${JSON.stringify(output, null, 2)}\n`);

const rows = [];
for (const browserName of BROWSER_NAMES) {
  for (const variant of VARIANTS) {
    const result = results[browserName][variant.id];
    rows.push({
      browser: browserName,
      variant: variant.id,
      rows: result.rows,
      slots: result.slots,
      datedCells: result.datedCells,
      ribbons: result.ribbons,
      alignment: `${result.alignment.checked} checked / ${result.alignment.misaligned} bad / max ${result.alignment.maxDeviation}px`,
      focus: `${result.focus.firstDate}→${result.focus.afterArrow}; SVG 02-01→${result.focus.svgRowAfterArrow}`,
      axe: `${result.axe.seriousCritical} serious/critical`,
      print: result.print ? `${result.print.pages}p, ${result.print.pageSize}` : "n/a",
      bundle: `${output.bundle[variant.id].totalGzipKb} kB gzip`,
    });
  }
}
console.log(JSON.stringify(rows, null, 2));

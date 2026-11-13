#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
/**
 * Serves one built static site for the browser checks.
 *
 * The Storybook gate needs the static build (`storybook-static`), because the
 * Storybook dev server and the built site export the same story URLs. Playwright
 * starts this server; the script fails with a clear message when the build is
 * missing instead of serving an empty directory.
 *
 * Usage: `node scripts/serve-static.mjs <directory> <port>`
 */
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const [directory, portText] = process.argv.slice(2);
const port = Number(portText);
if (!directory || !Number.isInteger(port) || port <= 0) {
  console.error("usage: node scripts/serve-static.mjs <directory> <port>");
  process.exit(2);
}

const root = resolve(directory);
if (!existsSync(join(root, "index.html"))) {
  console.error(`serve-static: ${root} has no index.html; run \`pnpm storybook:build\` first.`);
  process.exit(1);
}

/** Content types the built Storybook and docs site serve. */
const MIME = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".woff", "font/woff"],
  [".ico", "image/x-icon"],
]);

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("bad request");
    return;
  }
  const requested = resolve(join(root, path));
  // Reject path traversal outside the served directory.
  if (requested !== root && !requested.startsWith(root + sep)) {
    response.writeHead(403).end("forbidden");
    return;
  }
  let file = requested;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // Storybook routes live in the query string; unknown paths get the shell.
    file = join(root, "index.html");
  }
  try {
    response.writeHead(200, {
      "content-type": MIME.get(extname(file)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404).end("not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`serve-static: ${root} on http://127.0.0.1:${port}`);
});

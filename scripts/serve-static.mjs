#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
/**
 * Serves one built static site for the browser checks.
 *
 * The Storybook and VitePress gates need the built artifacts, because both use
 * absolute asset paths under the GitHub Pages project base. Playwright starts
 * this server; the script fails with a clear message when the build is missing
 * instead of serving an empty directory.
 *
 * Usage: `node scripts/serve-static.mjs <directory> <port> [--base /path/]`
 */
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const positional = [];
let base = "/";
for (let index = 0; index < args.length; index += 1) {
  const token = args[index];
  if (token === "--base") {
    const value = args[index + 1];
    if (!value) {
      console.error("serve-static: --base needs a path");
      process.exit(2);
    }
    base = value;
    index += 1;
  } else {
    positional.push(token);
  }
}

const [directory, portText] = positional;
const port = Number(portText);
if (!directory || !Number.isInteger(port) || port <= 0) {
  console.error("usage: node scripts/serve-static.mjs <directory> <port> [--base /path/]");
  process.exit(2);
}

// Normalise the public base: leading slash, no trailing slash except `/`.
base = `/${base.replace(/^\/+|\/+$/g, "")}`;
if (base === "/") base = "";

const root = resolve(directory);
if (!existsSync(join(root, "index.html"))) {
  console.error(`serve-static: ${root} has no index.html; build the site first.`);
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
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("bad request");
    return;
  }

  if (base && pathname === base) {
    response.writeHead(301, { location: `${base}/` }).end();
    return;
  }
  if (base && !pathname.startsWith(`${base}/`)) {
    response.writeHead(404).end("not found");
    return;
  }
  const path = base ? pathname.slice(base.length) : pathname;
  const requested = resolve(join(root, path));
  // Reject path traversal outside the served directory.
  if (requested !== root && !requested.startsWith(root + sep)) {
    response.writeHead(403).end("forbidden");
    return;
  }
  let file = requested;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // A bare directory gets its index; an unknown route gets the shell.
    const index = join(requested, "index.html");
    file = existsSync(index) ? index : join(root, "index.html");
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
  console.log(`serve-static: ${root}${base || "/"} on http://127.0.0.1:${port}${base}/`);
});

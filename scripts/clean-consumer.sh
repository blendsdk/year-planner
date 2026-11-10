#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/year-planner-consumer.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/packs" "$TMP/app/src"
(cd "$ROOT/packages/core" && pnpm pack --pack-destination "$TMP/packs" >/dev/null)
(cd "$ROOT/packages/react" && pnpm pack --pack-destination "$TMP/packs" >/dev/null)

CORE_PACK="$(find "$TMP/packs" -name 'blendsdk-year-planner-core-*.tgz' -print -quit)"
REACT_PACK="$(find "$TMP/packs" -name 'blendsdk-react-year-planner-*.tgz' -print -quit)"
test -n "$CORE_PACK"
test -n "$REACT_PACK"

cat >"$TMP/app/package.json" <<JSON
{
  "name": "year-planner-clean-consumer",
  "private": true,
  "type": "module",
  "dependencies": {
    "@blendsdk/year-planner-core": "file:${CORE_PACK}",
    "@blendsdk/react-year-planner": "file:${REACT_PACK}",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "5.2.0",
    "vite": "7.3.8"
  },
  "overrides": {
    "@blendsdk/year-planner-core": "file:${CORE_PACK}"
  }
}
JSON

cat >"$TMP/app/index.html" <<'HTML'
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Consumer</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
HTML

cat >"$TMP/app/src/main.tsx" <<'TSX'
import { createRoot } from "react-dom/client";
import { YearPlanner } from "@blendsdk/react-year-planner";
import "@blendsdk/react-year-planner/styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <YearPlanner year={2016} display={{ theme: "classic-blue" }} />
);
TSX

cat >"$TMP/app/vite.config.ts" <<'TS'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [react()] });
TS

cd "$TMP/app"
npm install --no-audit --no-fund >/dev/null
./node_modules/.bin/vite build >/dev/null
test -f dist/index.html
echo "PASS clean consumer: packed core + react installed and built"

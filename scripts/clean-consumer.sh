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
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "5.2.0",
    "esbuild": "0.28.2",
    "typescript": "6.0.3",
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

cat >"$TMP/app/src/types.tsx" <<'TSX'
import type { PlannerItem } from "@blendsdk/year-planner-core";
import { YearPlanner, type YearPlannerProps } from "@blendsdk/react-year-planner";

const item: PlannerItem = {
  id: "consumer-item",
  kind: "activity",
  layerId: "consumer-layer",
  period: { kind: "all-day", startDate: "2027-01-01", endDateExclusive: "2027-01-02" },
  title: "Consumer item",
  version: 1,
};
const props: YearPlannerProps = { year: 2027, defaultItems: [item] };
export const element = <YearPlanner {...props} />;
TSX

cat >"$TMP/app/src/treeshake.ts" <<'TS'
import { createTheme } from "@blendsdk/react-year-planner";
export const theme = createTheme({ surface: "#ffffff" });
TS

cat >"$TMP/app/src/styles.d.ts" <<'DTS'
declare module "*.css";
DTS

cat >"$TMP/app/vite.treeshake.config.ts" <<'TS'
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    lib: { entry: "src/treeshake.ts", formats: ["es"], fileName: "treeshake" },
    outDir: "dist-treeshake",
    emptyOutDir: true,
    minify: "esbuild",
  },
});
TS

cat >"$TMP/app/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/main.tsx", "src/types.tsx", "src/treeshake.ts", "src/styles.d.ts"]
}
JSON

cd "$TMP/app"
npm install --no-audit --no-fund >/dev/null
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build >/dev/null
test -f dist/index.html
./node_modules/.bin/vite build --config vite.treeshake.config.ts >/dev/null
test -f dist-treeshake/treeshake.js
FULL_JS=$(find dist/assets -name '*.js' -exec cat {} + | wc -c)
TREE_JS=$(wc -c < dist-treeshake/treeshake.js)
if [ "$TREE_JS" -ge $((FULL_JS * 85 / 100)) ]; then
  echo "FAIL clean consumer: createTheme bundle ${TREE_JS} bytes is not smaller than 85% of ${FULL_JS}"
  exit 1
fi
echo "PASS clean consumer: packed types, CSS import and smaller createTheme entry (${TREE_JS} / ${FULL_JS} bytes)"

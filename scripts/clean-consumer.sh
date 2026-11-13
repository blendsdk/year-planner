#!/usr/bin/env bash
set -euo pipefail

# Consumer proof for the packed tarballs or the published registry packages.
#
#   bash scripts/clean-consumer.sh            # packed tarballs (pre-release)
#   bash scripts/clean-consumer.sh --registry # exact published versions (post-release)
#
# The registry mode waits for propagation, installs the exact package versions
# from npm and runs the same typecheck and production Vite build.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="packed"
if [ "${1:-}" = "--registry" ]; then
  MODE="registry"
elif [ -n "${1:-}" ]; then
  echo "usage: $0 [--registry]" >&2
  exit 2
fi

TMP="$(mktemp -d "${TMPDIR:-/tmp}/year-planner-consumer.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/app/src"

CORE_VERSION="$(node -p "require('$ROOT/packages/core/package.json').version")"
REACT_VERSION="$(node -p "require('$ROOT/packages/react/package.json').version")"

if [ "$MODE" = "packed" ]; then
  mkdir -p "$TMP/packs"
  (cd "$ROOT/packages/core" && pnpm pack --pack-destination "$TMP/packs" >/dev/null)
  (cd "$ROOT/packages/react" && pnpm pack --pack-destination "$TMP/packs" >/dev/null)
  CORE_PACK="$(find "$TMP/packs" -name 'blendsdk-year-planner-core-*.tgz' -print -quit)"
  REACT_PACK="$(find "$TMP/packs" -name 'blendsdk-react-year-planner-*.tgz' -print -quit)"
  test -n "$CORE_PACK"
  test -n "$REACT_PACK"
  CORE_DEP="file:${CORE_PACK}"
  REACT_DEP="file:${REACT_PACK}"
  OVERRIDES=""
else
  echo "waiting for @blendsdk/year-planner-core@$CORE_VERSION on npm"
  for attempt in $(seq 1 12); do
    if npm view "@blendsdk/year-planner-core@$CORE_VERSION" version >/dev/null 2>&1; then
      break
    fi
    if [ "$attempt" -eq 12 ]; then
      echo "registry did not expose @blendsdk/year-planner-core@$CORE_VERSION" >&2
      exit 1
    fi
    sleep 5
  done
  echo "waiting for @blendsdk/react-year-planner@$REACT_VERSION on npm"
  for attempt in $(seq 1 12); do
    if npm view "@blendsdk/react-year-planner@$REACT_VERSION" version >/dev/null 2>&1; then
      break
    fi
    if [ "$attempt" -eq 12 ]; then
      echo "registry did not expose @blendsdk/react-year-planner@$REACT_VERSION" >&2
      exit 1
    fi
    sleep 5
  done
  CORE_DEP="$CORE_VERSION"
  REACT_DEP="$REACT_VERSION"
  OVERRIDES=$(cat <<JSON
  ,"overrides": {
    "@blendsdk/year-planner-core": "$CORE_VERSION"
  }
JSON
)
fi

cat >"$TMP/app/package.json" <<JSON
{
  "name": "year-planner-clean-consumer",
  "private": true,
  "type": "module",
  "dependencies": {
    "@blendsdk/year-planner-core": "$CORE_DEP",
    "@blendsdk/react-year-planner": "$REACT_DEP",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "5.2.0",
    "typescript": "6.0.3",
    "vite": "7.3.8"
  }$OVERRIDES
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
  <YearPlanner year={2016} display={{ theme: "material-teal" }} />
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

cat >"$TMP/app/src/styles.d.ts" <<'DTS'
declare module "*.css";
DTS

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
echo "PASS clean consumer ($MODE): types, CSS import and production build"

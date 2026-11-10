#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

test -f package.json
test -f pnpm-workspace.yaml
test -f turbo.json
test -f tsconfig.base.json
test -f packages/core/package.json
test -f packages/react/package.json

node -e "const p=require('./package.json'); if(!p.scripts?.verify) process.exit(1)"
node -e "const p=require('./packages/core/package.json'); if(p.type!=='module'||p.license!=='MIT') process.exit(1)"
node -e "const p=require('./packages/react/package.json'); if(p.type!=='module'||p.license!=='MIT') process.exit(1)"
node -e "const p=require('./packages/react/package.json'); if(!p.peerDependencies?.react) process.exit(1)"

test -f .github/workflows/ci.yml
test -f .github/CODEOWNERS

echo "PASS toolchain checks"

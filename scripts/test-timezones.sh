#!/usr/bin/env bash
# Runs the date-sensitive core suite under the three time zones the quality
# contract names. Node caches the time-zone setting, so each zone needs its own
# process; the script therefore invokes Vitest three times.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for zone in UTC Pacific/Kiritimati America/Los_Angeles; do
  echo "== TZ=$zone =="
  TZ="$zone" pnpm --filter @blendsdk/year-planner-core exec vitest run
done

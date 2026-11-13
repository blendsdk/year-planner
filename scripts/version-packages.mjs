import { execFileSync } from "node:child_process";
import { Lockstep } from "@blendsdk/lockstep";
import { pendingChangesets } from "./lib/release-manifest.mjs";

/**
 * Produces one lockstep version for every workspace.
 *
 * Changesets still owns the published-package bump and the generated
 * changelogs. Lockstep then aligns the private workspace packages (root, demo,
 * Storybook, renderer spike) to the highest version found, so the whole
 * repository carries one version. Lockstep also refreshes `pnpm-lock.yaml`.
 *
 * Changesets exits non-zero when there is nothing to release. That is a normal
 * no-op for this wrapper, not a failure.
 */
const pending = pendingChangesets(process.cwd());
if (pending.length > 0) {
  execFileSync("pnpm", ["exec", "changeset", "version"], { stdio: "inherit" });
} else {
  console.log("No pending changesets; keeping the current published versions.");
}

const lockstep = new Lockstep({
  root: process.cwd(),
  packagesDirs: ["packages", "apps", "spike"],
});
await lockstep.syncVersions();

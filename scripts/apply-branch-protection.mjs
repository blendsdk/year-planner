#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Applies or checks the `main` branch protection.
 *
 * GitHub cannot protect branches on a private repository on the current plan,
 * and the sole code owner cannot approve their own pull request. Both are
 * reported as prerequisites instead of being hidden. `--record` exits zero so
 * the state can be recorded in release evidence; `--check` and `--apply` fail
 * when the protection is unavailable or incomplete.
 */

const REQUIRED_CHECKS = ["verify", "browsers", "docs-site", "dco", "security"];

/** Runs gh and returns stdout. */
function gh(args, input) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    input,
  });
}

/** Resolves the repository slug. */
function repository(argument) {
  if (argument) return argument;
  return gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
}

/** Returns the current protection, or a status reason. */
function readProtection(repo) {
  try {
    const output = gh(["api", `repos/${repo}/branches/main/protection`]);
    return { protection: JSON.parse(output) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("403")) {
      return {
        reason:
          "branch protection is unavailable: the repository is private on a plan without protection",
      };
    }
    return { reason: message.split("\n")[0] ?? "branch protection is unavailable" };
  }
}

/** Counts collaborators with push access. */
function reviewerCount(repo) {
  try {
    const output = gh(["api", `repos/${repo}/collaborators?permission=push`, "--jq", "length"]);
    return Number(output.trim());
  } catch {
    return 1;
  }
}

/** Returns the differences between current and required settings. */
function differences(protection) {
  const issues = [];
  const checks = protection.required_status_checks;
  if (!checks) {
    issues.push("missing required status checks");
  } else {
    for (const check of REQUIRED_CHECKS) {
      if (!checks.contexts?.includes(check)) issues.push(`missing required check ${check}`);
    }
    if (checks.strict !== true) issues.push("status checks are not strict");
  }
  if (protection.enforce_admins?.enabled !== true) issues.push("admins can bypass protection");
  if (protection.allow_force_pushes?.enabled !== false) issues.push("force pushes are allowed");
  if (protection.allow_deletions?.enabled !== false) issues.push("branch deletion is allowed");
  if (protection.required_conversation_resolution?.enabled !== true) {
    issues.push("conversation resolution is not required");
  }
  const reviews = protection.required_pull_request_reviews;
  if (!reviews) {
    issues.push("pull-request reviews are not required");
  } else {
    if ((reviews.required_approving_review_count ?? 0) < 1) {
      issues.push("at least one approving review is required");
    }
    if (reviews.dismiss_stale_reviews !== true) issues.push("stale reviews are not dismissed");
    if (reviews.require_code_owner_reviews === true) {
      issues.push("code-owner review would block the sole code owner");
    }
  }
  return issues;
}

/** Builds the PUT payload. */
function payload() {
  return JSON.stringify({
    required_status_checks: { strict: true, contexts: REQUIRED_CHECKS },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_conversation_resolution: true,
  });
}

/**
 * Runs the protection command.
 *
 * @param options - Mode, repository and record behavior.
 * @returns Process exit code.
 * @example
 * run({ mode: "check", repo: "blendsdk/year-planner", record: false })
 */
export function run(options) {
  const repo = repository(options.repo);
  const { protection, reason } = readProtection(repo);
  const reviewers = reviewerCount(repo);
  const issues = [];
  if (reason) issues.push(reason);
  if (protection) issues.push(...differences(protection));
  if (reviewers < 2) {
    issues.push(
      "a second reviewer or collaborator must exist; the sole code owner cannot approve their own PR",
    );
  }
  for (const issue of issues) console.log(`branch-protection: ${issue}`);
  if (options.record) return 0;
  if (options.mode === "apply") {
    if (issues.length > 0) return 1;
    gh(
      ["api", "--method", "PUT", `repos/${repo}/branches/main/protection`, "--input", "-"],
      payload(),
    );
    console.log(`branch-protection: applied to ${repo}/main`);
    return 0;
  }
  return issues.length === 0 ? 0 : 1;
}

/** Parses the command line. */
function parse(argv) {
  const options = { mode: "check", repo: undefined, record: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--check") options.mode = "check";
    else if (token === "--apply") options.mode = "apply";
    else if (token === "--record") options.record = true;
    else if (token === "--repo") {
      options.repo = argv[index + 1];
      if (!options.repo) throw new Error("--repo needs owner/name");
      index += 1;
    } else {
      throw new Error(`unknown option: ${token}`);
    }
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = run(parse(process.argv.slice(2)));
  } catch (error) {
    console.error(`branch-protection: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

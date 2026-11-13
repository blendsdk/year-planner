import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseReleaseFlags } from "../../scripts/release-publish.mjs";

/**
 * Parses flags with `CI` unset.
 *
 * The parser rejects `--bootstrap` in CI by design. This helper keeps the
 * bootstrap contract testable without depending on the machine's CI variable.
 */
function parseOutsideCi(argv: string[]): ReturnType<typeof parseReleaseFlags> {
  const previous = process.env.CI;
  delete process.env.CI;
  try {
    return parseReleaseFlags(argv);
  } finally {
    if (previous === undefined) delete process.env.CI;
    else process.env.CI = previous;
  }
}

/**
 * Release workflow contract.
 *
 * The release path is configuration and command shape: a human release PR, a
 * manual main-only workflow, a credential-free build job and an
 * environment-guarded publish job with npm provenance over OIDC.
 */

const ROOT = new URL("../../", import.meta.url);

/** Reads a repository file relative to the root. */
function read(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

/** Parses package.json scripts. */
function scripts(): Record<string, string> {
  return (JSON.parse(read("package.json")) as { scripts?: Record<string, string> }).scripts ?? {};
}

/** Returns the YAML block for one top-level job. */
function job(workflow: string, name: string): string {
  const start = workflow.indexOf(`\n  ${name}:`);
  expect(start, `job ${name} is missing`).toBeGreaterThanOrEqual(0);
  const rest = workflow.slice(start + 1);
  const next = /\n {2}[a-z][\w-]*:\s*\n/.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

describe("RD-12-AC-02: human release PR", () => {
  it("documents a signed-off release PR instead of the Changesets action", () => {
    const guide = read("docs/releasing.md");
    for (const token of [
      "pnpm version-packages",
      "release/",
      "Signed-off-by",
      "DCO",
      "release.yml",
    ]) {
      expect(guide, `release guide is missing ${token}`).toContain(token);
    }
    expect(guide).not.toContain("changesets/action");
  });
});

describe("RD-12-AC-02: manual main-only release", () => {
  it("uses workflow_dispatch, a main guard and an approval environment", () => {
    const workflow = read(".github/workflows/release.yml");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow.match(/github\.ref == 'refs\/heads\/main'/g)?.length).toBeGreaterThanOrEqual(3);
    expect(workflow).toContain("npm-production");
    expect(workflow).toContain("publish:");
    expect(workflow).toContain("default: false");
    expect(workflow).toContain("deploy-docs:");
  });

  it("separates the credential-free build, the publish and the smoke jobs", () => {
    const workflow = read(".github/workflows/release.yml");
    const build = job(workflow, "build");
    const publish = job(workflow, "publish");
    const smoke = job(workflow, "smoke");
    expect(build).not.toContain("id-token");
    expect(build).toContain("release-packs");
    expect(publish).toContain("id-token: write");
    expect(publish).toContain("contents: write");
    expect(publish).toContain("actions: write");
    expect(publish).toContain("npm-production");
    expect(publish).not.toContain("pnpm install");
    expect(publish).not.toContain("pnpm build");
    expect(publish).toContain("release-publish.mjs");
    expect(publish).toContain("RELEASE_GITHUB_TOKEN");
    expect(publish).toContain("persist-credentials: false");
    expect(publish).toContain("timeout-minutes: 30");
    expect(publish).toContain("gh workflow run pages.yml");
    expect(smoke).toContain("release:smoke");
    expect(smoke).not.toContain("id-token");
  });

  it("RD-12-AC-13: uses no token secret or registry credential", () => {
    const workflow = read(".github/workflows/release.yml");
    for (const forbidden of [
      "secrets.",
      "NPM_TOKEN",
      "NODE_AUTH_TOKEN",
      "//registry.npmjs.org/:_authToken",
    ]) {
      expect(workflow, `release workflow contains ${forbidden}`).not.toContain(forbidden);
    }
  });
});

describe("RD-12-AC-02: publish script", () => {
  it("publishes core, then React, then languages with provenance", () => {
    const script = read("scripts/release-publish.mjs");
    expect(script).toContain("npm");
    expect(script).toContain("--provenance");
    expect(script).toContain("--access");
    expect(script).toContain("dist.integrity");
    const core = script.indexOf("year-planner-core");
    const react = script.indexOf("react-year-planner");
    const languages = script.indexOf("year-planner-languages");
    expect(core).toBeGreaterThanOrEqual(0);
    expect(react).toBeGreaterThan(core);
    expect(languages).toBeGreaterThan(react);
  });

  it("supports the documented flags and rejects unsafe combinations", () => {
    expect(parseReleaseFlags(["--dry-run", "--allow-dirty"])).toMatchObject({
      dryRun: true,
      allowDirty: true,
    });
    expect(parseReleaseFlags(["--packs", "release-packs"]).packs).toMatch(/release-packs$/);
    expect(() => parseReleaseFlags(["--allow-dirty"])).toThrow(/dry-run/);
    expect(() => parseReleaseFlags(["--skip-github-release"])).toThrow(/bootstrap/);
    expect(parseOutsideCi(["--bootstrap", "--skip-github-release"])).toMatchObject({
      bootstrap: true,
      skipGithubRelease: true,
    });
  });
});

describe("RD-12-AC-02: bootstrap", () => {
  it("documents the manual first publish and the two-day validation window", () => {
    const guide = read("docs/releasing.md");
    for (const token of [
      "npm login",
      "--bootstrap",
      "--skip-github-release",
      "npm trust github",
      "release.yml",
      "npm-production",
      "0.3.1",
      "two days",
    ]) {
      expect(guide, `bootstrap guide is missing ${token}`).toContain(token);
    }
    expect(read("scripts/release-publish.mjs")).toContain("bootstrap");
  });
});

describe("RD-12-AC-11: action pinning", () => {
  it("pins every workflow action to a full commit SHA with a version comment", () => {
    const directory = new URL(".github/workflows/", ROOT);
    for (const entry of readdirSync(directory).filter((name) => name.endsWith(".yml"))) {
      const workflow = readFileSync(new URL(entry, directory), "utf8");
      for (const match of workflow.matchAll(/uses:\s*([^\s#]+)/g)) {
        const reference = match[1] ?? "";
        if (reference.startsWith("./")) continue;
        expect(reference, `${entry}: ${reference}`).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
        const line = workflow.slice(workflow.lastIndexOf("\n", match.index) + 1).split("\n")[0];
        expect(line, `${entry}: ${reference} has no version comment`).toMatch(/#\s*v?\d/);
      }
    }
  });
});

describe("RD-12-AC-02: changeset status", () => {
  it("reports changesets without blocking docs-only PRs", () => {
    const workflow = read(".github/workflows/ci.yml");
    const changeset = job(workflow, "changeset");
    expect(changeset).toContain("fetch-depth: 0");
    expect(changeset).toContain("continue-on-error: true");
    expect(changeset).toContain("changeset status --since=origin/main");
  });
});

describe("RD-12-AC-04: registry smoke", () => {
  it("installs the exact published versions from npm with a retry", () => {
    expect(scripts()["release:smoke"]).toContain("clean-consumer.sh --registry");
    const consumer = read("scripts/clean-consumer.sh");
    expect(consumer).toContain("--registry");
    expect(consumer).toContain("npm view");
    expect(consumer).toContain("sleep");
    expect(consumer).toContain('CORE_DEP="$CORE_VERSION"');
    expect(consumer).toContain('REACT_DEP="$REACT_VERSION"');
  });
});

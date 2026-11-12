import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Governance and support contract.
 *
 * The public repository promises review ownership, best-effort support, a
 * coordinated vulnerability process, grouped dependency updates and a release
 * checklist that covers the owner-only publication steps.
 */

const ROOT = new URL("../../", import.meta.url);

/** Reads a repository file relative to the root. */
function read(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

/** Reports whether a repository path exists. */
function exists(path: string): boolean {
  return existsSync(new URL(path, ROOT));
}

describe("RD-12-AC-07: review ownership", () => {
  it("covers the release, package, workflow and policy paths", () => {
    const owners = read(".github/CODEOWNERS");
    expect(owners).toContain("* @blendsdk");
    for (const path of [
      "/packages/",
      "/.github/workflows/",
      "/.changeset/",
      "/SECURITY.md",
      "/docs/releasing.md",
    ]) {
      expect(owners, `CODEOWNERS is missing ${path}`).toContain(path);
    }
    for (const path of [
      "packages",
      ".github/workflows",
      ".changeset",
      "SECURITY.md",
      "docs/releasing.md",
    ]) {
      expect(exists(path), path).toBe(true);
    }
  });
});

describe("RD-12-AC-08: support policy", () => {
  it("states best-effort support with no SLA", () => {
    const support = read("SUPPORT.md").toLowerCase();
    for (const token of [
      "best-effort",
      "no sla",
      "no guaranteed response",
      "github issues",
      "security",
      "0.x",
      "no commercial",
    ]) {
      expect(support, `SUPPORT.md is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-12-AC-07: security process", () => {
  it("covers reporting, triage, disclosure and dependency updates", () => {
    const security = read("SECURITY.md").toLowerCase();
    for (const token of [
      "private vulnerability reporting",
      "acknowledge",
      "triage",
      "coordinated",
      "dependency updates",
      "90 days",
    ]) {
      expect(security, `SECURITY.md is missing ${token}`).toContain(token);
    }
    const guide = read("docs/releasing.md");
    expect(guide).toContain("private-vulnerability-reporting");
    expect(guide).toContain("vulnerability-alerts");
  });

  it("links the issue and pull-request templates from the README", () => {
    const readme = read("README.md");
    expect(readme).toContain("issues/new/choose");
    expect(exists(".github/ISSUE_TEMPLATE/bug_report.md")).toBe(true);
    expect(exists(".github/ISSUE_TEMPLATE/feature_request.md")).toBe(true);
    expect(exists(".github/PULL_REQUEST_TEMPLATE.md")).toBe(true);
  });
});

describe("RD-12-AC-09: release checklist", () => {
  it("includes the development, docs, print and evidence gates", () => {
    const guide = read("docs/releasing.md");
    for (const token of [
      "pnpm verify:full",
      "pnpm api-report:ci",
      "pnpm docs:site",
      "Storybook",
      "print sample",
      "browser/React matrix",
      "CHANGELOG",
      "provenance",
      "npm pack --dry-run",
      "DEFERRED.md",
      "renderer-spike.md",
      "0001-renderer-strategy.md",
    ]) {
      expect(guide, `release guide is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-12-AC-10: visibility and license review", () => {
  it("names the owner-only setup and the asset review", () => {
    const guide = read("docs/releasing.md").toLowerCase();
    for (const token of [
      "visibility public",
      "private-vulnerability-reporting",
      "vulnerability-alerts",
      "github pages",
      "npm-production",
      "trusted publisher",
      "branch protection",
      "reference-image material",
      "third_party_notices.md",
    ]) {
      expect(guide, `release guide is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-12-AC-06: branch protection", () => {
  it("applies the required checks and reviewer settings", () => {
    const script = read("scripts/apply-branch-protection.mjs");
    for (const token of [
      "--check",
      "--apply",
      "--record",
      "verify",
      "browsers",
      "docs-site",
      "dco",
      "security",
      "required_approving_review_count",
      "enforce_admins",
      "allow_force_pushes",
      "allow_deletions",
      "second reviewer",
    ]) {
      expect(script, `protection script is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-12-AC-07: community links", () => {
  it("links the contribution, conduct, security, support and release guides", () => {
    for (const path of ["README.md", "CONTRIBUTING.md"]) {
      const text = read(path);
      const targets = [
        "CONTRIBUTING.md",
        "CODE_OF_CONDUCT.md",
        "SECURITY.md",
        "SUPPORT.md",
        "releasing.md",
      ].filter((target) => target !== path);
      for (const target of targets) {
        expect(text, `${path} is missing ${target}`).toContain(target);
      }
    }
  });
});

describe("RD-12-AC-12: dependency audit", () => {
  it("gates high and critical advisories in the release path", () => {
    const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    expect(manifest.scripts?.["test:audit"]).toContain("pnpm audit --audit-level high");
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toContain("pnpm test:audit");
    expect(read("docs/releasing.md")).toContain("pnpm audit --audit-level high");
  });
});

describe("RD-12-AC-12: dependency updates", () => {
  it("groups weekly npm and action updates", () => {
    const dependabot = read(".github/dependabot.yml");
    expect(dependabot).toContain("package-ecosystem: npm");
    expect(dependabot).toContain("package-ecosystem: github-actions");
    expect(dependabot).toContain("interval: weekly");
    expect(dependabot).toContain("groups:");
    expect(dependabot).toContain("minor");
    expect(dependabot).toContain("patch");
  });
});

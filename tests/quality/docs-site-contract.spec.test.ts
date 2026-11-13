import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Docs-site contract: the build command, the artifact checks and the GitHub
 * Pages workflow. The real artifact proof lives in `docs:site`; this file stays
 * fast and reads scripts and configuration only.
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

const PAGES = ".github/workflows/pages.yml";

describe("RD-11-AC-06: docs-site command", () => {
  it("RD-11-AC-01: builds the API report and the static site", () => {
    const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    expect(manifest.scripts?.docs).toContain("api-report");
    expect(manifest.scripts?.docs).toContain("docs:build");
    expect(manifest.scripts?.["storybook:build"]).toContain("storybook build");
    expect(manifest.scripts?.verify).toContain("docs:site");
  });

  it("RD-11-AC-05: verifies the API tree under /api", () => {
    expect(read("scripts/build-docs-site.mjs")).toContain("api/core/index.html");
    expect(read("scripts/build-docs-site.mjs")).toContain("api/react/index.html");
  });

  it("exposes docs:site and a script with the check flags", () => {
    const manifest = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    expect(manifest.scripts?.["docs:site"]).toBe("node scripts/build-docs-site.mjs");
    expect(exists("scripts/build-docs-site.mjs")).toBe(true);
    const script = read("scripts/build-docs-site.mjs");
    for (const token of [
      "--check-only",
      "--root",
      "pnpm build",
      "docs:build",
      "storybook-static",
      "docs/.vitepress/dist",
      "storybook/iframe.html",
      "vitepress",
      "api",
    ]) {
      expect(script, `script is missing ${token}`).toContain(token);
    }
  });

  it("RD-11-AC-06: builds the VitePress site under the Pages base", () => {
    const config = read("docs/.vitepress/config.ts");
    for (const token of ["/year-planner/", "DOCS_BASE_PATH", "srcExclude", "sitemap"]) {
      expect(config, `VitePress config is missing ${token}`).toContain(token);
    }
    expect(read("docs/.vitepress/theme/components/StoryFrame.vue")).toContain(
      "/storybook/iframe.html",
    );
    expect(exists("docs/index.md")).toBe(true);
    expect(exists("docs/tutorials/first-planner.md")).toBe(true);
    expect(exists("docs/how-to/fit-to-host.md")).toBe(true);
    expect(exists("docs/public/logo.svg")).toBe(true);
    expect(exists("docs/public/screenshots/year-grid.png")).toBe(true);
  });

  it("RD-11-AC-06: runs the combined artifact through a subpath browser check", () => {
    expect(exists("tests/e2e/site.spec.ts")).toBe(true);
    const spec = read("tests/e2e/site.spec.ts");
    for (const token of ["/year-planner", "/storybook/iframe.html", "/api/index.html"]) {
      expect(spec, `site spec is missing ${token}`).toContain(token);
    }
    const config = read("playwright.config.ts");
    expect(config).toContain("docs/.vitepress/dist");
    expect(config).toContain("--base /year-planner");
  });
});

describe("RD-11-AC-06: Pages workflow", () => {
  it("uses the three Pages actions with least privilege", () => {
    const workflow = read(PAGES);
    for (const action of [
      "actions/configure-pages",
      "actions/upload-pages-artifact",
      "actions/deploy-pages",
    ]) {
      expect(workflow).toContain(action);
    }
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).not.toContain("write-all");
    expect(workflow).not.toContain("secrets.");
  });

  it("publishes only through a manual deploy on main", () => {
    const workflow = read(PAGES);
    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("deploy:");
    expect(workflow).toContain("needs: build");
    expect(workflow).toContain(
      "if: github.event_name == 'workflow_dispatch' && inputs.deploy && github.ref == 'refs/heads/main'",
    );
    expect(workflow).toContain("path: docs/.vitepress/dist");
    expect(workflow).toContain("environment:");
    expect(workflow).toContain("github-pages");
  });
});

describe("RD-11-AC-06: pull-request proof", () => {
  it("builds and checks the artifact in CI", () => {
    const workflow = read(".github/workflows/ci.yml");
    expect(workflow).toContain("docs-site:");
    expect(workflow).toContain("pnpm docs:site");
    expect(workflow).toContain("docs:site -- --check-only");
  });
});

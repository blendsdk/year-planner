import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Public documentation site contract.
 *
 * The site is one GitHub Pages artifact: VitePress at `/year-planner/`,
 * Storybook at `/year-planner/storybook/` and TypeDoc at `/year-planner/api/`.
 * These checks keep the structure, the base path and the content honest; the
 * browser proof lives in `tests/e2e/site.spec.ts`.
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

describe("site structure", () => {
  it("mounts VitePress under the GitHub Pages project path", () => {
    const config = read("docs/.vitepress/config.ts");
    for (const token of [
      'process.env.DOCS_BASE_PATH ?? "/year-planner/"',
      "srcExclude",
      "sitemap",
      'logo: "/logo.svg"',
      'search: { provider: "local" }',
      "https://blendsdk.github.io",
    ]) {
      expect(config, `config is missing ${token}`).toContain(token);
    }
    expect(read("package.json")).toContain('"docs:dev": "vitepress dev docs"');
    expect(read("package.json")).toContain('"docs:site": "node scripts/build-docs-site.mjs"');
  });

  it("links the guide, tutorials, examples, Storybook and API", () => {
    const config = read("docs/.vitepress/config.ts");
    for (const token of [
      "/getting-started",
      "/tutorials/first-planner",
      "/how-to/fit-to-host",
      "/examples/",
      "/stories",
      "storybook/",
      "api/",
    ]) {
      expect(config, `navigation is missing ${token}`).toContain(token);
    }
  });

  it("ships a real home page with a screenshot and an honest status note", () => {
    const home = read("docs/index.md");
    expect(home).toContain("layout: home");
    expect(home).toContain("Plan the whole year in one component");
    expect(home).toContain("/screenshots/full-demo-hero.png");
    expect(home).toContain("/screenshots/full-demo.png");
    expect(home.toLowerCase()).toContain("not yet published");
    expect(exists("docs/public/screenshots/year-grid.png")).toBe(true);
    expect(exists("docs/public/logo.svg")).toBe(true);
  });
});

describe("tutorials and how-tos", () => {
  it("covers the first planner, controlled commands, theming and print", () => {
    for (const path of [
      "docs/tutorials/first-planner.md",
      "docs/tutorials/controlled-commands.md",
      "docs/tutorials/theming-and-adapters.md",
      "docs/tutorials/print-a3-plan.md",
    ]) {
      expect(exists(path), `missing ${path}`).toBe(true);
      expect(read(path)).toMatch(/^# /);
    }
  });

  it("covers fit, context menus, custom inspectors and the full demo", () => {
    for (const path of [
      "docs/how-to/fit-to-host.md",
      "docs/how-to/context-menu.md",
      "docs/how-to/custom-inspector.md",
    ]) {
      expect(exists(path), `missing ${path}`).toBe(true);
      expect(read(path)).toMatch(/^# /);
    }
    const demoPage = read("docs/examples/full-demo.md");
    expect(demoPage).toContain('story="full-demo--full-demo"');
    expect(demoPage.toLowerCase()).toContain("localstorage");
    expect(exists("apps/storybook/stories/FullDemo.stories.tsx")).toBe(true);
    const story = read("apps/storybook/stories/FullDemo.stories.tsx");
    expect(story).toContain('title: "Full Demo"');
    // Storybook runs play functions on load; the demo must not write storage
    // before the user acts.
    expect(story).not.toContain("play:");
  });
});

describe("Storybook and API integration", () => {
  it("embeds stories through the base-aware production iframe", () => {
    const frame = read("docs/.vitepress/theme/components/StoryFrame.vue");
    for (const token of ["withBase", "/storybook/iframe.html?id=", "viewMode=story"]) {
      expect(frame, `StoryFrame is missing ${token}`).toContain(token);
    }
    const gallery = read("docs/.vitepress/theme/components/StoryGallery.vue");
    expect(gallery).toContain("/storybook/?path=/story/");
    expect(gallery).toContain("stories.data");
  });

  it("generates the story index from the built Storybook", () => {
    const data = read("docs/.vitepress/data/stories.data.ts");
    expect(data).toContain("storybook-static/index.json");
    expect(data).toContain("available");
    expect(read("docs/stories.md")).toContain("<StoryGallery />");
  });

  it("builds one artifact with Storybook and TypeDoc inside it", () => {
    const script = read("scripts/build-docs-site.mjs");
    for (const token of [
      "docs/.vitepress/dist",
      'run("pnpm", ["storybook:build"]',
      'run("pnpm", ["docs:build"]',
      '"vitepress", "build", "docs"',
      'cpSync(storybook, join(artifact, "storybook")',
      'cpSync(api, join(artifact, "api")',
      "STORYBOOK_BASE",
      "DOCS_BASE_PATH",
    ]) {
      expect(script, `build script is missing ${token}`).toContain(token);
    }
    const workflow = read(".github/workflows/pages.yml");
    expect(workflow).toContain("path: docs/.vitepress/dist");
    expect(workflow).toContain("pnpm docs:site -- --check-only");
  });
});

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Documentation contract for the developer guide set.
 *
 * The guides are checked-in product documentation: a missing page, a stub, a
 * broken link or an unmeasured claim is a real defect. These tests read the
 * repository files rather than a built artifact, so they can run before the
 * build step and stay fast.
 */

const ROOT = new URL("../../", import.meta.url);

/** Reads a repository file relative to the repository root. */
function read(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

/** Reports whether a repository path exists. */
function exists(path: string): boolean {
  return existsSync(new URL(path, ROOT));
}

/** Lists markdown files under a repository directory. */
function markdownFiles(directory: string): string[] {
  if (!exists(directory)) return [];
  return readdirSync(new URL(directory, ROOT), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `${directory}/${entry.name}`)
    .sort();
}

/** Returns the H2 headings of a markdown document, trimmed and lowercased. */
function headings(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => /^##\s+(.+?)\s*$/.exec(line)?.[1])
    .filter((heading): heading is string => heading !== undefined)
    .map((heading) => heading.toLowerCase());
}

/** Removes fenced code blocks so link and claim scans ignore examples. */
function prose(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

/**
 * Returns the relative links in a markdown document.
 *
 * Fenced code blocks are removed first so an example URL is never treated as a
 * real link. External URLs, mail links and pure anchors are out of scope.
 */
function relativeLinks(markdown: string): string[] {
  const links: string[] = [];
  for (const match of prose(markdown).matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1]?.split("#")[0] ?? "";
    if (!target || /^[a-z]+:/i.test(target) || target.startsWith("#")) continue;
    links.push(target);
  }
  return links;
}

/** Resolves a link relative to the document that contains it. */
function linkTarget(document: string, link: string): string {
  return join(document, "..", link).replace(/^\.\//, "");
}

/** The fourteen topics RD-11 requires the guide set to own. */
const TOPICS = [
  "Getting started",
  "Controlled API",
  "Visibility semantics",
  "Selection and keyboard",
  "Theming",
  "Customization and holidays",
  "Inspector and tooltip",
  "Dynamic months",
  "Print",
  "Accessibility status",
  "Performance status",
  "Limitations",
  "Migration",
  "FAQ",
] as const;

/** Required H2 headings per guide page; a stub page cannot satisfy these. */
const REQUIRED_SECTIONS: Record<string, readonly string[]> = {
  "docs/getting-started.md": [
    "install",
    "render a 14-month view",
    "styles",
    "controlled selection",
    "controlled visibility",
    "print",
    "ssr",
    "storybook",
    "esm-only",
  ],
  "docs/controlled-api.md": [
    "controlled vs uncontrolled",
    "items",
    "selection",
    "visibility",
    "filter",
    "command lifecycle",
  ],
  "docs/visibility.md": ["precedence", "groups", "layers", "items", "filters", "channels"],
  "docs/interaction.md": ["modes", "selection", "keyboard"],
  "docs/theming.md": ["css variables", "presets", "createTheme", "fluent ui", "mui"],
  "docs/customization.md": ["slots", "annotations", "holidays", "item content"],
  "docs/inspector-tooltip.md": ["default inspector", "custom inspector", "tooltip", "actions"],
  "docs/dynamic-months.md": ["year", "range", "context months", "windows", "density", "zoom"],
  "docs/print.md": ["paginate", "fit", "prt-01", "print css"],
  "docs/accessibility.md": ["conformance claim", "keyboard map", "known limitations"],
  "docs/performance.md": ["measured status", "budgets", "known misses", "reproduce"],
  "docs/limitations.md": ["deferred", "bundle", "browsers", "manual audit"],
  "docs/migration.md": ["pre-rd-06", "semver", "api reports"],
  "docs/faq.md": ["?"],
  "docs/architecture.md": ["mermaid"],
};

/** Extracts the `topic → page` rows from the documentation index. */
function topicMap(markdown: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 3) continue;
    const topic = cells[1] ?? "";
    const link = /\]\(([^)]+)\)/.exec(cells[2] ?? "")?.[1];
    if (topic && link) map.set(topic, link);
  }
  return map;
}

describe("RD-11-AC-07: documentation index", () => {
  it("maps every required topic to an existing page with one H1", () => {
    expect(exists("docs/README.md")).toBe(true);
    const map = topicMap(read("docs/README.md"));
    for (const topic of TOPICS) {
      const page = map.get(topic);
      expect(page, `topic ${topic}`).toBeDefined();
      if (!page) continue;
      const path = `docs/${page}`;
      expect(exists(path), path).toBe(true);
      const markdown = read(path);
      expect(markdown.match(/^#\s+/gm)?.length, `${path} H1`).toBe(1);
    }
  });

  it("gives every guide page its required sections", () => {
    for (const [path, required] of Object.entries(REQUIRED_SECTIONS)) {
      expect(exists(path), path).toBe(true);
      const found = headings(read(path));
      for (const heading of required) {
        expect(
          found.some((candidate) => candidate.includes(heading.toLowerCase())),
          `${path} is missing a "${heading}" section`,
        ).toBe(true);
      }
    }
  });

  it("resolves every relative documentation link", () => {
    const documents = [
      "README.md",
      "DEFERRED.md",
      ...markdownFiles("docs"),
      ...markdownFiles("docs/adr"),
    ];
    for (const document of documents) {
      for (const link of relativeLinks(read(document))) {
        const target = linkTarget(document, link);
        expect(exists(target), `${document} links to missing ${target}`).toBe(true);
      }
    }
  });
});

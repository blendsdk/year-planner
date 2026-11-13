import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { anchoredLinks, headingAnchors, linkTarget, relativeLinks } from "./markdown-links.js";

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
  "docs/migration.md": ["early preview", "semver", "api reports"],
  "docs/faq.md": ["questions"],
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
      for (const { path, anchor } of anchoredLinks(read(document))) {
        const target = linkTarget(document, path);
        expect(exists(target), `${document} links to missing ${target}`).toBe(true);
        expect(
          headingAnchors(read(target)).has(anchor.toLowerCase()),
          `${document} links to missing #${anchor} in ${target}`,
        ).toBe(true);
      }
    }
  });
});

/** The deferred capabilities RD-11 requires the public documentation to name. */
const DEFERRED_CAPABILITIES = [
  "resource timeline",
  "recurrence",
  "scenarios",
  "dependencies",
  "split/merge",
  "batch multi-move",
  "data provider",
  "controlled-host undo",
  "timed editing",
  "rtl",
  "week start",
  "aggregated density",
  "svg/pdf export",
  "optimizer",
  "full headless composition",
  "shadow dom",
  "milestones",
  "parent/child",
  "non-gregorian",
  "drag between layers",
  "second demo",
  "cjs/umd",
  "commercial support",
] as const;

/** Extracts fenced code blocks with their language tag. */
function codeBlocks(markdown: string): Array<{ language: string; body: string }> {
  const blocks: Array<{ language: string; body: string }> = [];
  for (const match of markdown.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)) {
    blocks.push({ language: (match[1] ?? "").trim(), body: match[2] ?? "" });
  }
  return blocks;
}

/** Counts the story exports and story files under the Storybook stories directory. */
function storyInventory(): { stories: number; files: number } {
  const directory = new URL("apps/storybook/stories/", ROOT);
  let stories = 0;
  let files = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".stories.tsx")) continue;
    const source = readFileSync(new URL(entry.name, directory), "utf8");
    stories += source.match(/^export const \w+: Story/gm)?.length ?? 0;
    files += 1;
  }
  return { stories, files };
}

describe("RD-11-AC-07: README quickstart", () => {
  it("contains one complete controlled example with a print action", () => {
    const readme = read("README.md");
    const block = codeBlocks(readme).find((candidate) => candidate.body.includes("YearPlanner"));
    expect(block, "README has no YearPlanner example").toBeDefined();
    const body = block?.body ?? "";
    for (const token of [
      "@blendsdk/react-year-planner",
      "styles.css",
      "PlannerItem",
      "useState",
      "selection",
      "onSelectionChange",
      "visibility",
      "onVisibilityChange",
      "window.print",
    ]) {
      expect(body, `quickstart is missing ${token}`).toContain(token);
    }
    expect(body).toMatch(/year=\{?20\d\d\}?|year:\s*20\d\d/);
    expect(readme.toLowerCase()).toMatch(/not (yet )?published|packed tarball|packed install/);
  });
});

describe("RD-11-AC-09: deferred capabilities", () => {
  it("lists every deferred capability and does not present one as implemented", () => {
    expect(exists("DEFERRED.md")).toBe(true);
    const deferred = read("DEFERRED.md").toLowerCase();
    for (const capability of DEFERRED_CAPABILITIES) {
      expect(deferred, `DEFERRED.md is missing ${capability}`).toContain(capability);
    }

    for (const document of markdownFiles("docs")) {
      if (document.endsWith("limitations.md")) continue;
      for (const line of read(document).split("\n")) {
        const lower = line.toLowerCase();
        if (lower.trimStart().startsWith("#") || lower.includes("?")) continue;
        if (/not |no |never|deferred|out of scope|does not|unsupported/.test(lower)) continue;
        for (const capability of DEFERRED_CAPABILITIES) {
          const claims =
            lower.includes(capability) &&
            /\b(supports?|implemented|available|works?)\b/.test(lower);
          expect(claims, `${document} presents "${capability}" as implemented`).toBe(false);
        }
      }
    }
  });
});

describe("RD-11-AC-10: honest status", () => {
  it("states the conformance position without a positive claim", () => {
    for (const path of ["docs/accessibility.md", "docs/performance.md"]) {
      const normalized = read(path).replace(/\*/g, "").toLowerCase();
      expect(normalized, path).toContain("conformance claim: none");
    }
    const forbidden = [
      "is compliant",
      "meets wcag",
      "conforms to",
      "certified",
      "wcag conformance is covered",
    ];
    for (const document of markdownFiles("docs")) {
      const lower = read(document).toLowerCase();
      for (const phrase of forbidden) {
        expect(lower.includes(phrase), `${document} contains "${phrase}"`).toBe(false);
      }
    }
  });

  it("names the measured performance misses and links the evidence", () => {
    const performance = read("docs/performance.md");
    expect(performance.toLowerCase()).toContain("initial render");
    expect(performance.toLowerCase()).toMatch(/10[,. ]?000|10k/);
    expect(performance).toContain("test-report.md");
  });

  it("keeps the story count in sync with the story files", () => {
    const { stories, files } = storyInventory();
    const phrase = new RegExp(`\\b${stories} stories across ${files} files\\b`);
    for (const path of ["README.md", "docs/getting-started.md", "docs/test-report.md"]) {
      expect(
        read(path),
        `${path} does not state "${stories} stories across ${files} files"`,
      ).toMatch(phrase);
    }
  });
});

/** Lists binary asset paths under a directory, excluding generated API output. */
function binaryAssets(directory: string): string[] {
  if (!exists(directory)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(new URL(directory, ROOT), { withFileTypes: true })) {
    // Generated API output and the public site assets are produced artifacts,
    // not source photos or reference material.
    if (
      entry.name === "api" ||
      entry.name === "storybook-static" ||
      entry.name === "public" ||
      entry.name === ".vitepress"
    )
      continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      found.push(...binaryAssets(path));
    } else if (/\.(png|jpe?g|gif|webp|pdf|svg)$/i.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

describe("RD-11-AC-14: functional layout guide", () => {
  it("RD-11-AC-14: documents the implemented grid, presets and print behaviour", () => {
    expect(exists("docs/fidelity-review.md")).toBe(false);
    expect(exists("docs/classic-year-layout.md")).toBe(true);
    const guide = read("docs/classic-year-layout.md");
    for (const token of [
      "37 day columns",
      "Saturday, Sunday, Monday",
      "Context months",
      "ISO week",
      "material-teal",
      "fluent-marigold",
      "56",
      "A3",
      "paginate",
    ]) {
      expect(guide, `layout guide is missing ${token}`).toContain(token);
    }
    expect(read("docs/README.md")).toContain("classic-year-layout.md");
    expect(read("docs/.vitepress/config.ts")).toContain("/classic-year-layout");

    const migration = read("docs/migration.md");
    for (const token of ["classic-blue", "classic-yellow", "modern", "material-teal"]) {
      expect(migration, `migration guide is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-11-AC-12: asset provenance", () => {
  it("publishes no source photos or reference material", () => {
    expect(exists("_reference")).toBe(false);
    expect(exists("reference/original-images")).toBe(false);
    for (const document of markdownFiles("docs")) {
      expect(read(document)).not.toContain("_reference/");
    }
    expect(binaryAssets("docs"), "unexpected binary under docs").toEqual([]);
    expect(binaryAssets("apps/storybook/stories"), "unexpected binary under stories").toEqual([]);
  });
});

describe("RD-11-AC-13: documentation security", () => {
  it("uses synthetic data and no raw HTML injection in examples", () => {
    const forbidden = ["dangerouslySetInnerHTML", "innerHTML", "__html"];
    for (const document of ["README.md", ...markdownFiles("docs")]) {
      const blocks = codeBlocks(read(document));
      for (const block of blocks) {
        for (const token of forbidden) {
          expect(block.body.includes(token), `${document} example uses ${token}`).toBe(false);
        }
      }
      const text = read(document);
      expect(text).not.toContain("TOPSECRET-");
      expect(text).not.toContain("attacker.example");
    }
  });
});

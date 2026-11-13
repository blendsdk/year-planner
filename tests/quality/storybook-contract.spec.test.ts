import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Storybook contract for the component catalogue.
 *
 * The site is the public state catalogue. A missing named state, a duplicate
 * title or a lost print sample is a documentation defect, so these checks read
 * the story sources directly.
 */

const ROOT = new URL("../../", import.meta.url);
const STORIES = new URL("apps/storybook/stories/", ROOT);

interface StoryFile {
  name: string;
  title: string | undefined;
  exports: string[];
  source: string;
}

/** Reads every story file once. */
function storyFiles(): StoryFile[] {
  const files: StoryFile[] = [];
  for (const entry of readdirSync(STORIES, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".stories.tsx")) continue;
    const source = readFileSync(new URL(entry.name, STORIES), "utf8");
    const exports = [...source.matchAll(/^export const (\w+): Story/gm)].map(
      (match) => match[1] ?? "",
    );
    // The traceability title parser handles quoted strings but not quotes inside
    // regex literals, so the title pattern spells the quote as a Unicode escape.
    const meta = /const meta[\s\S]*?title:\s*[\u0022]([^\u0022]+)[\u0022]/.exec(source)?.[1];
    files.push({
      name: entry.name,
      title: meta,
      exports,
      source,
    });
  }
  return files;
}

/** RD-11 states that must exist as named stories. */
const REQUIRED_STORIES: Array<{ title: string; export: string }> = [
  { title: "Classic Year/Grid", export: "MaterialTeal2016" },
  { title: "Classic Year/Grid", export: "FluentMarigold2017" },
  { title: "Year Planner/02 Layouts and Windows", export: "ClassicFourteenMonths" },
  { title: "Year Planner/02 Layouts and Windows", export: "TwelveMonths" },
  { title: "Year Planner/02 Layouts and Windows", export: "EighteenMonths" },
  { title: "Year Planner/02 Layouts and Windows", export: "TwentyFourMonths" },
  { title: "Year Planner/02 Layouts and Windows", export: "ThirtySixMonths" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "CrossMonthBooking" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "CrossYearBooking" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "ThreeOverlappingLanes" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "CompactOverflow" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "NoItems" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "HiddenLayer" },
  { title: "Year Planner/03 Items, Annotations and Overflow", export: "HiddenGroup" },
  { title: "Year Planner/07 State and Filtering", export: "HiddenChannel" },
  { title: "Year Planner/07 State and Filtering", export: "ControlledVisibility" },
  { title: "Year Planner/07 State and Filtering", export: "HiddenGroupByDefault" },
  { title: "Year Planner/07 State and Filtering", export: "HiddenItemByDefault" },
  { title: "Year Planner/09 Interaction", export: "MarqueeItemsMode" },
  { title: "Year Planner/09 Interaction", export: "PaintMode" },
  { title: "Year Planner/09 Interaction", export: "EraseMode" },
  { title: "Year Planner/09 Interaction", export: "MoveMode" },
  { title: "Year Planner/09 Interaction", export: "ResizeMode" },
  { title: "Year Planner/10 Accessibility", export: "SkipLinkFocused" },
  { title: "Year Planner/04 Inspector", export: "SelectedBooking" },
  { title: "Year Planner/05 Slots and Date Metadata", export: "CustomTooltip" },
  { title: "Year Planner/06 Print Planning", export: "Prt01TwoThousandSeventeen" },
  { title: "Year Planner/08 Design-System Token Adapters", export: "FluentWrapper" },
  { title: "Year Planner/08 Design-System Token Adapters", export: "MuiWrapper" },
];

describe("RD-11-AC-02: Storybook state coverage", () => {
  it("RD-11-AC-02: contains every required named story", () => {
    const files = storyFiles();
    for (const required of REQUIRED_STORIES) {
      const file = files.find((candidate) => candidate.title === required.title);
      expect(file, `no story file titled ${required.title}`).toBeDefined();
      expect(file?.exports, `${required.title} is missing ${required.export}`).toContain(
        required.export,
      );
    }
  });

  it("uses unique story titles", () => {
    const titles = storyFiles()
      .map((file) => file.title)
      .filter((title): title is string => title !== undefined);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("RD-11-AC-11: PRT-01 print sample", () => {
  it("RD-11-AC-11: uses the 2017 fluent-marigold A3 paginate fixture", () => {
    const print = storyFiles().find((file) => file.name === "Print.stories.tsx");
    expect(print).toBeDefined();
    const source = print?.source ?? "";
    const start = source.indexOf("export const Prt01TwoThousandSeventeen");
    expect(start, "PRT-01 story is missing").toBeGreaterThanOrEqual(0);
    const block = source.slice(start, source.indexOf("export const", start + 1));
    for (const token of [
      "year: 2017",
      '"fluent-marigold"',
      "prt01Items",
      'page: "A3"',
      'mode: "paginate"',
    ]) {
      expect(block, `PRT-01 story is missing ${token}`).toContain(token);
    }
  });
});

describe("RD-11-AC-02: design-system wrappers", () => {
  it("renders Fluent and MUI provider wrappers with adapter cssVars", () => {
    const adapters = storyFiles().find((file) => file.name === "Adapters.stories.tsx");
    expect(adapters).toBeDefined();
    const source = adapters?.source ?? "";
    const wrappers = [
      { name: "FluentWrapper", adapter: "fluentThemeToCssVars" },
      { name: "MuiWrapper", adapter: "muiThemeToCssVars" },
    ];
    for (const wrapper of wrappers) {
      const start = source.indexOf(`export const ${wrapper.name}: Story`);
      expect(start, `missing ${wrapper.name}`).toBeGreaterThanOrEqual(0);
      const block = source.slice(start, source.indexOf("export const", start + 1));
      expect(block, `${wrapper.name} does not use the provider`).toContain("YearPlannerProvider");
      expect(block, `${wrapper.name} does not pass adapter cssVars`).toContain(
        `cssVars={${wrapper.adapter}(`,
      );
    }
  });
});

describe("RD-13-AC-07: story-level descriptions and demos", () => {
  it("describes every exported story", () => {
    for (const file of storyFiles()) {
      const described = new Set<string>();
      for (const match of file.source.matchAll(/describeStories\(\{([^}]*)\}\)/g)) {
        for (const name of (match[1] ?? "").split(",")) {
          const trimmed = name.trim();
          if (trimmed) described.add(trimmed);
        }
      }
      for (const name of file.exports) {
        const start = file.source.indexOf(`export const ${name}: Story`);
        const block = file.source.slice(start, file.source.indexOf("export const", start + 1));
        const explicit = block.includes("description: {") && block.includes("story:");
        expect(
          described.has(name) || explicit,
          `${file.name} ${name} has no story-level description`,
        ).toBe(true);
      }
    }
  });

  it("keeps at least six Demos play stories and the event log", () => {
    const demos = storyFiles().find((file) => file.name === "Demos.stories.tsx");
    expect(demos?.title).toBe("Demos");
    const playCount = (demos?.source.match(/\n {2}play:/g) ?? []).length;
    expect(playCount).toBeGreaterThanOrEqual(6);
    for (const name of [
      "SelectRange",
      "MoveItem",
      "ResizeItem",
      "PaintLayer",
      "KeyboardNavigation",
      "ContextMenu",
    ]) {
      expect(demos?.source).toContain(`export const ${name}: Story`);
    }
    const eventLog = storyFiles().find((file) => file.name === "EventLog.stories.tsx");
    expect(eventLog?.source).toContain('data-testid="event-log"');
    expect(eventLog?.source).toContain("play: async");
  });

  it("RD-13-AC-06: keeps Fluent and MUI context-menu examples", () => {
    const story = storyFiles().find((file) => file.name === "ContextMenu.stories.tsx");
    const source = story?.source ?? "";
    for (const token of [
      "FluentMenu",
      "MuiMenu",
      "onContextMenuRequest",
      "restoreFocus",
      "webLightTheme",
      "DemoShell",
      "Right-click a date cell",
    ]) {
      expect(source, `context-menu story is missing ${token}`).toContain(token);
    }
  });

  it("RD-13-AC-07: keeps the Demos context story visible and host-owned", () => {
    const demos = storyFiles().find((file) => file.name === "Demos.stories.tsx");
    const source = demos?.source ?? "";
    for (const token of [
      "DemoShell",
      'role="menu"',
      'data-testid="demo-menu"',
      "restoreFocus",
      "Right-click a date cell or a ribbon item",
      'findByRole("menu")',
    ]) {
      expect(source, `Demos context story is missing ${token}`).toContain(token);
    }
    // Feedback must not sit below the grid where a laptop viewport cannot see it.
    expect(source).not.toContain('data-testid="demo-context"');
  });

  it("sorts Demos before the reference catalogue", () => {
    const preview = readFileSync(new URL("apps/storybook/.storybook/preview.ts", ROOT), "utf8");
    const start = preview.indexOf("storySort");
    expect(start).toBeGreaterThanOrEqual(0);
    const block = preview.slice(start, start + 200);
    expect(block).toContain('"Demos"');
    expect(block.indexOf('"Demos"')).toBeLessThan(block.indexOf('"Year Planner"'));
  });
});

describe("RD-11-AC-02: built-in viewport", () => {
  it("configures named viewports without the legacy addon", () => {
    const preview = readFileSync(new URL("apps/storybook/.storybook/preview.ts", ROOT), "utf8");
    const start = preview.indexOf("viewport");
    expect(start, "viewport parameters are missing").toBeGreaterThanOrEqual(0);
    const block = preview.slice(start, start + 600);
    for (const name of ["mobile", "tablet", "desktop"]) {
      expect(block, `viewport ${name} is missing`).toContain(name);
    }
    const manifest = JSON.parse(
      readFileSync(new URL("apps/storybook/package.json", ROOT), "utf8"),
    ) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    expect(manifest.devDependencies?.["@storybook/addon-viewport"]).toBeUndefined();
    expect(manifest.dependencies?.["@storybook/addon-viewport"]).toBeUndefined();
  });
});

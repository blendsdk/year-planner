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
    const meta = /const meta[\s\S]*?title:\s*"([^"]+)"/.exec(source)?.[1];
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
  { title: "Classic Year/Grid", export: "Blue2016" },
  { title: "Classic Year/Grid", export: "Yellow2017" },
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
  it("contains every required named story", () => {
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
  it("uses the 2017 classic-yellow A3 paginate fixture", () => {
    const print = storyFiles().find((file) => file.name === "Print.stories.tsx");
    expect(print).toBeDefined();
    const source = print?.source ?? "";
    const start = source.indexOf("export const Prt01TwoThousandSeventeen");
    expect(start, "PRT-01 story is missing").toBeGreaterThanOrEqual(0);
    const block = source.slice(start, source.indexOf("export const", start + 1));
    for (const token of [
      "year: 2017",
      '"classic-yellow"',
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

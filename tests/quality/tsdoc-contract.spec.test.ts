import { existsSync, readdirSync, readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * API-reference contract for the two public packages.
 *
 * The checked-in API Extractor reports are the reviewed public surface. The
 * contract keeps them free of undocumented entries, requires a release tag on
 * every export, verifies the extractor and TypeDoc gates, and binds `@example`
 * to the named entry points with the TypeScript parser.
 */

const ROOT = new URL("../../", import.meta.url);

/** Reads a repository file relative to the root. */
function read(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

/** Parses a repository JSON file. */
function json<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

/** Returns every exported declaration name in a report. */
function reportExports(path: string): string[] {
  return [
    ...read(path).matchAll(/^export (?:interface|type|function|const|class|enum) (\w+)/gm),
  ].map((match) => match[1] ?? "");
}

/** Reads every public source file once, keyed by repository path. */
function sourceFiles(): Map<string, string[]> {
  const files = new Map<string, string[]>();
  for (const directory of ["packages/core/src", "packages/react/src"]) {
    for (const entry of readdirSync(new URL(directory, ROOT), {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile() || (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")))
        continue;
      if (/\.(test|impl|spec)\./.test(entry.name) || entry.name === "test-setup.ts") continue;
      const path = `${entry.parentPath.replace(`${ROOT.pathname}`, "")}/${entry.name}`;
      files.set(path, read(path).split("\n"));
    }
  }
  return files;
}

/** Reports whether the declaration `name` carries a `@public` source tag. */
function sourceTagged(files: Map<string, string[]>, name: string): boolean {
  for (const lines of files.values()) {
    for (const [index, line] of lines.entries()) {
      if (
        !new RegExp(`^export (?:interface|type|function|const|class|enum) ${name}\\b`).test(line)
      ) {
        continue;
      }
      let cursor = index - 1;
      while (cursor >= 0 && lines[cursor]?.trim() === "") cursor -= 1;
      if (cursor < 0 || !lines[cursor]?.trim().endsWith("*/")) return false;
      let start = cursor;
      while (start >= 0 && !lines[start]?.includes("/**")) start -= 1;
      return lines.slice(start, cursor + 1).some((row) => /@public\b/.test(row ?? ""));
    }
  }
  return false;
}

const REPORTS = [
  "packages/core/etc/year-planner-core.api.md",
  "packages/react/etc/react-year-planner.api.md",
] as const;

/** Returns the non-empty, non-comment line that precedes a report export. */
function precedingTag(lines: string[], index: number): string {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const line = lines[cursor]?.trim() ?? "";
    if (!line || line.startsWith("```")) continue;
    return line;
  }
  return "";
}

/** Reports whether a source file declares `name` with an `@example` JSDoc tag. */
function hasExample(path: string, name: string): boolean {
  const source = ts.createSourceFile(
    path,
    read(path),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let found = false;
  const visit = (node: ts.Node): void => {
    const named =
      (ts.isFunctionDeclaration(node) && node.name?.text === name) ||
      (ts.isVariableStatement(node) &&
        node.declarationList.declarations.some(
          (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
        ));
    if (named && ts.getJSDocTags(node).some((tag) => tag.tagName.text === "example")) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("RD-11-AC-03: public TSDoc", () => {
  it("has no undocumented entries in either report", () => {
    for (const report of REPORTS) {
      const entries = read(report).match(/\(undocumented\)/g) ?? [];
      expect(entries.length, report).toBe(0);
    }
  });

  it("has a non-empty reviewed report", () => {
    expect(reportExports(REPORTS[0]).length).toBeGreaterThanOrEqual(137);
    expect(reportExports(REPORTS[1]).length).toBeGreaterThanOrEqual(31);
  });

  it("tags every exported declaration with a release tag", () => {
    for (const report of REPORTS) {
      const lines = read(report).split("\n");
      for (const [index, line] of lines.entries()) {
        // A re-export names a declaration that is tagged where it is declared.
        if (!line.startsWith("export ") || line.startsWith("export {")) continue;
        expect(precedingTag(lines, index), `${report}:${index + 1}`).toMatch(
          /^\/\/ @(public|beta|alpha|internal)/,
        );
      }
    }
  });

  it("tags every report export in the source", () => {
    const files = sourceFiles();
    for (const report of REPORTS) {
      for (const name of reportExports(report)) {
        expect(sourceTagged(files, name), `${name} has no @public source tag`).toBe(true);
      }
    }
  });

  it("enables the missing-release-tag rule", () => {
    for (const path of ["packages/core/api-extractor.json", "packages/react/api-extractor.json"]) {
      const config = json<{ messages?: { extractorMessageReporting?: Record<string, unknown> } }>(
        path,
      );
      expect(
        config.messages?.extractorMessageReporting?.["ae-missing-release-tag"],
        path,
      ).not.toEqual({ logLevel: "none" });
    }
  });

  it("makes TypeDoc validation fatal", () => {
    for (const path of ["typedoc.core.json", "typedoc.react.json"]) {
      const config = json<{
        validation?: { notDocumented?: boolean; invalidLink?: boolean };
        treatValidationWarningsAsErrors?: boolean;
      }>(path);
      expect(config.validation?.notDocumented, path).toBe(true);
      expect(config.validation?.invalidLink, path).toBe(true);
      expect(config.treatValidationWarningsAsErrors, path).toBe(true);
    }
  });

  it("keeps the API report comparison in the verify gate", () => {
    const manifest = json<{ scripts?: Record<string, string> }>("package.json");
    expect(manifest.scripts?.verify).toContain("api-report:ci");
    for (const report of REPORTS) expect(existsSync(new URL(report, ROOT)), report).toBe(true);
  });

  it("binds @example to the public entry points", () => {
    const entryPoints = [
      { path: "packages/react/src/YearPlanner.tsx", name: "YearPlanner" },
      { path: "packages/react/src/provider.tsx", name: "YearPlannerProvider" },
      { path: "packages/react/src/theme.ts", name: "createTheme" },
      { path: "packages/core/src/layout/classic-year.ts", name: "buildClassicYearLayout" },
      { path: "packages/core/src/ribbon/fragments.ts", name: "buildRibbonLayout" },
    ];
    for (const entry of entryPoints) {
      expect(hasExample(entry.path, entry.name), `${entry.name} has no @example`).toBe(true);
    }
  });
});

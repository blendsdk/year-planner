import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalJson,
  collectSpecInputs,
  fingerprintUnit,
  isCached,
  ledgerSummary,
  readLedger,
  recordFailure,
  recordPass,
  sha256Text,
  writeLedger,
} from "../../scripts/lib/browser-ledger.mjs";
import { expandPatterns, globToRegExp, matchesAny } from "../../scripts/lib/glob.mjs";

/**
 * Edge cases for the browser planner's file matching and result ledger.
 *
 * The specification tests cover the contract; these cases pin the boundary
 * behaviour that keeps fingerprints and globs honest.
 */

const roots: string[] = [];

/** Creates a temporary repository root. */
function root(): string {
  const directory = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "browser-plan-"));
  roots.push(directory);
  return directory;
}

/** Writes one file, creating its parents. */
function write(directory: string, path: string, content: string): void {
  const file = join(directory, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

afterEach(() => {
  for (const directory of roots.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("glob matching", () => {
  it("matches any depth with a double star", () => {
    const matcher = globToRegExp("packages/react/src/**");
    expect(matcher.test("packages/react/src/theme.ts")).toBe(true);
    expect(matcher.test("packages/react/src/render/ItemLayer.tsx")).toBe(true);
    expect(matcher.test("packages/core/src/theme.ts")).toBe(false);
  });

  it("keeps a single star inside one segment", () => {
    const matcher = globToRegExp("packages/*/src/theme.ts");
    expect(matcher.test("packages/react/src/theme.ts")).toBe(true);
    expect(matcher.test("packages/react/render/src/theme.ts")).toBe(false);
  });

  it("matches one character with a question mark", () => {
    const matcher = globToRegExp("tests/e2e/?.spec.ts");
    expect(matcher.test("tests/e2e/a.spec.ts")).toBe(true);
    expect(matcher.test("tests/e2e/ab.spec.ts")).toBe(false);
  });

  it("reports whether any pattern matches", () => {
    expect(matchesAny(["docs/**", "scripts/**"], "scripts/bench.mjs")).toBe(true);
    expect(matchesAny(["docs/**", "scripts/**"], "packages/react/src/index.ts")).toBe(false);
  });

  it("expands literal files, directories and globs", () => {
    const directory = root();
    write(directory, "src/a.ts", "a");
    write(directory, "src/nested/b.ts", "b");
    write(directory, "src/nested/c.tsx", "c");
    write(directory, "other/d.ts", "d");

    expect(expandPatterns(directory, ["src/**/*.ts"])).toEqual(["src/a.ts", "src/nested/b.ts"]);
    expect(expandPatterns(directory, ["src/a.ts"])).toEqual(["src/a.ts"]);
    expect(expandPatterns(directory, ["src/nested"])).toEqual([
      "src/nested/b.ts",
      "src/nested/c.tsx",
    ]);
    expect(expandPatterns(directory, ["missing/**"])).toEqual([]);
  });
});

describe("spec inputs", () => {
  it("follows relative imports and their extension rewrites", () => {
    const directory = root();
    write(directory, "tests/e2e/example.spec.ts", 'import { helper } from "./helper.js";\n');
    write(directory, "tests/e2e/helper.ts", 'import { shared } from "./shared.js";\n');
    write(directory, "tests/e2e/shared.ts", "export const shared = 1;\n");
    write(directory, "tests/e2e/example.spec.ts-snapshots/shot-chromium-linux.png", "png");

    expect(collectSpecInputs(directory, "tests/e2e/example.spec.ts")).toEqual([
      "tests/e2e/example.spec.ts",
      "tests/e2e/example.spec.ts-snapshots/shot-chromium-linux.png",
      "tests/e2e/helper.ts",
      "tests/e2e/shared.ts",
    ]);
  });
});

describe("fingerprints", () => {
  const environment = {
    platform: "test",
    arch: "test",
    node: "1",
    playwright: "1",
    browsers: "x",
    config: "playwright.config.ts",
  };
  const unit = { group: "e2e.visual", spec: "tests/e2e/example.spec.ts", project: "chromium" };

  it("is stable across identical inputs", () => {
    const directory = root();
    write(directory, "tests/e2e/example.spec.ts", "test");
    write(directory, "packages/react/src/theme.ts", "one");
    const first = fingerprintUnit({
      root: directory,
      unit,
      sourcePatterns: ["packages/react/src/**"],
      mapHash: "map",
      environment,
    }).fingerprint;
    const second = fingerprintUnit({
      root: directory,
      unit,
      sourcePatterns: ["packages/react/src/**"],
      mapHash: "map",
      environment,
    }).fingerprint;
    expect(second).toBe(first);
  });

  it("changes when a source file changes and returns when it is restored", () => {
    const directory = root();
    write(directory, "tests/e2e/example.spec.ts", "test");
    write(directory, "packages/react/src/theme.ts", "one");
    const input = {
      root: directory,
      unit,
      sourcePatterns: ["packages/react/src/**"],
      mapHash: "map",
      environment,
    };
    const first = fingerprintUnit(input).fingerprint;
    write(directory, "packages/react/src/theme.ts", "two");
    const second = fingerprintUnit(input).fingerprint;
    write(directory, "packages/react/src/theme.ts", "one");
    const third = fingerprintUnit(input).fingerprint;
    expect(second).not.toBe(first);
    expect(third).toBe(first);
  });

  it("changes when a demo, Storybook or documentation input changes", () => {
    const directory = root();
    write(directory, "tests/e2e/example.spec.ts", "test");
    write(directory, "packages/react/src/theme.ts", "one");
    write(directory, "apps/demo/src/App.tsx", "one");
    write(directory, "apps/storybook/stories/Year.stories.tsx", "one");
    write(directory, "docs/getting-started.md", "one");
    const input = {
      root: directory,
      unit,
      sourcePatterns: ["packages/react/src/**"],
      mapHash: "map",
      environment,
    };
    const first = fingerprintUnit(input).fingerprint;
    for (const path of [
      "apps/demo/src/App.tsx",
      "apps/storybook/stories/Year.stories.tsx",
      "docs/getting-started.md",
    ]) {
      write(directory, path, "two");
      expect(fingerprintUnit(input).fingerprint, path).not.toBe(first);
      write(directory, path, "one");
    }
  });

  it("changes when the map or the project changes", () => {
    const directory = root();
    write(directory, "tests/e2e/example.spec.ts", "test");
    write(directory, "packages/react/src/theme.ts", "one");
    const base = {
      root: directory,
      unit,
      sourcePatterns: ["packages/react/src/**"],
      environment,
    };
    const first = fingerprintUnit({ ...base, mapHash: "map-a" }).fingerprint;
    expect(fingerprintUnit({ ...base, mapHash: "map-b" }).fingerprint).not.toBe(first);
    expect(
      fingerprintUnit({ ...base, mapHash: "map-a", unit: { ...unit, project: "firefox" } })
        .fingerprint,
    ).not.toBe(first);
  });
});

describe("ledger", () => {
  const unit = { group: "e2e.grid", spec: "tests/e2e/example.spec.ts", project: "chromium" };

  it("returns an empty ledger for a missing or corrupt file", () => {
    const directory = root();
    expect(readLedger(join(directory, "missing.json"))).toEqual({ schema: 1, entries: {} });
    write(directory, "bad.json", "{not json");
    expect(readLedger(join(directory, "bad.json"))).toEqual({ schema: 1, entries: {} });
  });

  it("reuses only a passing entry with the same fingerprint", () => {
    const ledger = { schema: 1, entries: {} };
    expect(isCached(ledger, unit, "abc")).toBe(false);
    recordPass(ledger, unit, "abc", 1200);
    expect(isCached(ledger, unit, "abc")).toBe(true);
    expect(isCached(ledger, unit, "def")).toBe(false);
  });

  it("removes a unit after a failure", () => {
    const ledger = { schema: 1, entries: {} };
    recordPass(ledger, unit, "abc", 1200);
    recordFailure(ledger, unit);
    expect(isCached(ledger, unit, "abc")).toBe(false);
  });

  it("round-trips through disk with sorted keys", () => {
    const directory = root();
    const file = join(directory, "ledger.json");
    const ledger = { schema: 1, entries: {} };
    recordPass(ledger, unit, "abc", 1200);
    recordPass(ledger, { ...unit, project: "firefox" }, "def", 1300);
    writeLedger(file, ledger);
    const restored = readLedger(file);
    expect(isCached(restored, unit, "abc")).toBe(true);
    expect(ledgerSummary(restored)).toMatchObject({ total: 2, passed: 2 });
  });

  it("serialises objects with sorted keys", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(sha256Text("same")).toBe(sha256Text("same"));
    expect(sha256Text("same")).not.toBe(sha256Text("different"));
  });
});

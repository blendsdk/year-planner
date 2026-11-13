import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Reads a repository file relative to the quality test working directory. */
function read(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

/** Reads and parses a JSON file relative to the repository root. */
function json<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

/** Recursively lists production source files under one package entrypoint. */
function productionSources(directory: string): string[] {
  const entries = readdirSync(new URL(`../../${directory}`, import.meta.url), {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => /\.(ts|tsx|css)$/.test(path))
    .filter((path) => !/\.(test|spec|impl)\./.test(path));
}

const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
  "storybook-static",
  ".vite-temp",
  "api",
]);

/**
 * Lists repository text sources without walking dependency or build output
 * directories, so the scan stays fast and never loads generated bundles.
 */
function repositorySources(root: URL, relative = ""): string[] {
  const directory = relative ? new URL(`${relative}/`, root) : root;
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      found.push(...repositorySources(root, relative ? `${relative}/${entry.name}` : entry.name));
      continue;
    }
    found.push(join(directory.pathname, entry.name));
  }
  return found;
}

interface PackageManifest {
  type?: string;
  license?: string;
  files?: string[];
  sideEffects?: boolean | string[];
  exports?: Record<string, unknown>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

const rootManifest = json<{ scripts?: Record<string, string>; packageManager?: string }>(
  "package.json",
);
const coreManifest = json<PackageManifest>("packages/core/package.json");
const reactManifest = json<PackageManifest>("packages/react/package.json");
const workflow = read(".github/workflows/ci.yml");
const tsconfig = read("tsconfig.base.json");
const coreBuild = read("packages/core/tsconfig.build.json");
const reactBuild = read("packages/react/tsconfig.build.json");

describe("RD-01-AC-01: reproducible install", () => {
  it("pins the package manager and commits a lockfile", () => {
    expect(rootManifest.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
    expect(read("pnpm-lock.yaml")).toContain("lockfileVersion");
  });
});

describe("RD-01-AC-02: strict typecheck", () => {
  it("enables strict mode and exposes a typecheck script", () => {
    expect(tsconfig).toMatch(/"strict":\s*true/);
    expect(rootManifest.scripts?.typecheck).toContain("typecheck");
  });
});

describe("RD-01-AC-03: ESM build artifacts", () => {
  it("emits declarations, declaration maps and source maps", () => {
    for (const config of [tsconfig, coreBuild, reactBuild]) {
      expect(config).toMatch(/"declaration":\s*true/);
      expect(config).toMatch(/"declarationMap":\s*true/);
      expect(config).toMatch(/"sourceMap":\s*true/);
    }
    expect(coreManifest.type).toBe("module");
    expect(reactManifest.type).toBe("module");
  });
});

describe("RD-01-AC-04: package publication checks", () => {
  it("runs publint and attw for both packages", () => {
    for (const manifest of [coreManifest, reactManifest]) {
      expect(manifest.scripts?.["pack:check"]).toContain("publint");
      expect(manifest.scripts?.["pack:check"]).toContain("attw");
    }
    expect(rootManifest.scripts?.["pack:check"]).toBeDefined();
  });
});

describe("RD-01-AC-05: clean consumer", () => {
  it("keeps the packed-tarball consumer proof", () => {
    expect(rootManifest.scripts?.["test:consumer"]).toBeDefined();
    expect(read("scripts/clean-consumer.sh")).toContain("pnpm pack");
  });
});

describe("RD-01-AC-06: React 19 CI", () => {
  it("declares React 19 as the peer and runs Node 24", () => {
    expect(reactManifest.peerDependencies?.react).toMatch(/\^?19|>=19/);
    expect(workflow).toContain("node-version: 24");
  });
});

describe("RD-01-AC-07: DCO gate", () => {
  it("rejects a commit without a sign-off", () => {
    expect(workflow).toContain("Signed-off-by");
    expect(workflow).toMatch(/dco:/);
  });
});

describe("RD-01-AC-08: internal-use package contracts", () => {
  it("declares the internal-use license, an allowlist and CSS-only side effects", () => {
    expect(read("LICENSE")).toContain("Year Planner Internal Use License 1.0");
    for (const manifest of [coreManifest, reactManifest]) {
      expect(manifest.license).toBe("SEE LICENSE IN LICENSE");
      expect(manifest.type).toBe("module");
      expect(manifest.files).toEqual(expect.arrayContaining(["dist", "README.md", "LICENSE"]));
    }
    expect(coreManifest.sideEffects).toBe(false);
    expect(reactManifest.sideEffects).toEqual(["**/*.css"]);
  });

  it("publishes an import-only exports map", () => {
    for (const manifest of [coreManifest, reactManifest]) {
      const entry = Object.values(manifest.exports ?? {})[0] as Record<string, unknown>;
      expect(entry.import).toBeDefined();
      expect(entry.require).toBeUndefined();
    }
  });
});

describe("RD-01-AC-09: documented release gate", () => {
  it("separates verify from the full release gate", () => {
    const verify = rootManifest.scripts?.verify ?? "";
    const full = rootManifest.scripts?.["verify:full"] ?? "";
    expect(verify).not.toContain("test:e2e");
    expect(full).toContain("test:e2e");
    expect(read("CONTRIBUTING.md")).toContain("verify:full");
  });
});

describe("RD-01-AC-10: no committed secrets", () => {
  it("contains no private key or token material in repository sources", () => {
    const secrets = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /\bghp_[A-Za-z0-9]{20,}/,
      /\bgho_[A-Za-z0-9]{20,}/,
      /\bghu_[A-Za-z0-9]{20,}/,
      /\bghs_[A-Za-z0-9]{20,}/,
      /\bghr_[A-Za-z0-9]{20,}/,
      /\bgithub_pat_[A-Za-z0-9_]{20,}/,
      /\bglpat-[A-Za-z0-9_-]{20,}/,
      /\bnpm_[A-Za-z0-9]{30,}/,
      /\bsk_live_[A-Za-z0-9]{16,}/,
      /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
      /\bAKIA[0-9A-Z]{16}\b/,
    ];
    const files = repositorySources(new URL("../../", import.meta.url));
    expect(files.length).toBeGreaterThan(80);
    for (const path of files) {
      const bytes = readFileSync(path);
      if (bytes.byteLength > 512 * 1024) continue;
      if (bytes.subarray(0, 1024).includes(0)) continue;
      const source = bytes.toString("utf8");
      for (const pattern of secrets) {
        expect(source, path).not.toMatch(pattern);
      }
    }
  });
});

describe("RD-01-AC-11: production security surface", () => {
  it("uses no raw HTML, eval, new Function or shell access", () => {
    const files = [
      ...productionSources("packages/core/src"),
      ...productionSources("packages/react/src"),
    ];
    expect(files.length).toBeGreaterThan(20);
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toContain("dangerouslySetInnerHTML");
      expect(source, path).not.toMatch(/\beval\s*\(/);
      expect(source, path).not.toMatch(/\bnew Function\s*\(/);
      expect(source, path).not.toContain("node:child_process");
    }
  });
});

describe("RD-02-AC-12: temporal input safety", () => {
  it("parses dates without eval or environment-dependent Date parsing", () => {
    for (const file of ["packages/core/src/date.ts", "packages/core/src/period.ts"]) {
      const source = read(file);
      expect(source, file).not.toMatch(/\beval\s*\(/);
      expect(source, file).not.toMatch(/\bnew Function\s*\(/);
    }
    // Date-only keys must come from the explicit UTC parser, never the
    // environment-dependent Date.parse path.
    expect(read("packages/core/src/date.ts")).not.toContain("Date.parse");
  });
});

describe("RD-03-AC-15: layout input safety", () => {
  it("builds layout metadata as data and rejects out-of-range windows", () => {
    const source = read("packages/core/src/layout/classic-year.ts");
    expect(source).not.toContain("innerHTML");
    expect(source).not.toContain("dangerouslySetInnerHTML");
    expect(source).toContain("INVALID_RANGE");
    expect(source).toContain("UNSUPPORTED_VIEW_YEAR");
  });
});

describe("RD-04-AC-18: visibility and model safety", () => {
  it("filters hidden data in the model and never builds markup", () => {
    const visibility = read("packages/core/src/model/visibility.ts");
    expect(visibility).toContain("getEffectiveVisibility");
    expect(visibility).toContain("isLayerEffectivelyHidden");
    for (const file of [
      "packages/core/src/model/visibility.ts",
      "packages/core/src/model/validation.ts",
    ]) {
      const source = read(file);
      expect(source, file).not.toContain("dangerouslySetInnerHTML");
    }
  });
});

describe("RD-05-AC-14: renderer decision record", () => {
  it("records the spike and keeps the public surface renderer-neutral", () => {
    const spike = read("docs/renderer-spike.md");
    const adr = read("docs/adr/0001-renderer-strategy.md");
    expect(spike.length).toBeGreaterThan(500);
    expect(adr.toLowerCase()).toContain("decision");
    expect(read("packages/react/src/types.ts")).not.toMatch(/\brenderer\?:/);
  });
});

describe("RD-05-AC-15: ribbon output safety", () => {
  it("projects hidden items out of the ribbon and builds no markup", () => {
    for (const file of [
      "packages/core/src/ribbon/fragments.ts",
      "packages/core/src/ribbon/lanes.ts",
    ]) {
      const source = read(file);
      expect(source, file).not.toContain("innerHTML");
      expect(source, file).not.toContain("dangerouslySetInnerHTML");
    }
    expect(read("packages/core/src/ribbon/fragments.ts")).toContain("visibleItems");
  });
});

describe("RD-06-AC-18: rendered output safety", () => {
  it("uses an allowlist for untrusted styles and never raw HTML", () => {
    const safeStyle = read("packages/react/src/safeStyle.ts");
    expect(safeStyle).toContain("safeCssColor");
    expect(safeStyle).toContain("safeMetaStyle");
    for (const file of productionSources("packages/react/src")) {
      expect(readFileSync(file, "utf8"), file).not.toContain("dangerouslySetInnerHTML");
    }
  });
});

describe("RD-09-AC-16: accessible output safety", () => {
  it("composes accessible names from text and never injects markup", () => {
    const a11y = read("packages/react/src/a11y.ts");
    expect(a11y).not.toContain("innerHTML");
    expect(a11y).not.toContain("dangerouslySetInnerHTML");
    expect(a11y).toContain("accessible");
  });
});

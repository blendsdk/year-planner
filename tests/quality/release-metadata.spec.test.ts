import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Release metadata contract.
 *
 * The two packages release in lockstep from one Changesets fixed group. Their
 * manifests, generated changelogs, README and license are the published
 * contract, so these checks read the checked-in files before the build.
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

/** Reports whether a repository path exists. */
function exists(path: string): boolean {
  return existsSync(new URL(path, ROOT));
}

const CORE = "packages/core/package.json";
const REACT = "packages/react/package.json";

interface Manifest {
  name: string;
  version: string;
  license?: string;
  description?: string;
  repository?: { type?: string; url?: string };
  homepage?: string;
  bugs?: { url?: string };
  publishConfig?: { access?: string };
  files?: string[];
  sideEffects?: boolean | string[];
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

describe("RD-12-AC-01: lockstep release group", () => {
  it("uses one fixed Changesets group for both packages", () => {
    const config = json<{
      fixed?: string[][];
      access?: string;
      baseBranch?: string;
    }>(".changeset/config.json");
    const group = config.fixed?.find((entry) => entry.includes("@blendsdk/year-planner-core"));
    expect(group).toBeDefined();
    expect(group).toContain("@blendsdk/react-year-planner");
    expect(config.access).toBe("public");
    expect(config.baseBranch).toBe("main");
  });

  it("publishes both packages at the same 0.x version", () => {
    const core = json<Manifest>(CORE);
    const react = json<Manifest>(REACT);
    expect(core.version).toBe(react.version);
    expect(core.version).toMatch(/^0\.\d+\.\d+$/);
  });
});

describe("RD-12-AC-11: package metadata and changelogs", () => {
  it("generates a changelog heading for the current version", () => {
    for (const path of ["packages/core/CHANGELOG.md", "packages/react/CHANGELOG.md"]) {
      expect(exists(path), path).toBe(true);
      const changelog = read(path);
      const version = json<Manifest>(path.includes("core") ? CORE : REACT).version;
      expect(changelog, `${path} has no ${version} heading`).toContain(`## ${version}`);
      expect(changelog.length).toBeGreaterThan(100);
    }
  });

  it("declares the repository, homepage, bugs and public access metadata", () => {
    for (const path of [CORE, REACT]) {
      const manifest = json<Manifest>(path);
      expect(manifest.license, path).toBe("MIT");
      expect(manifest.repository?.url, path).toContain("github.com/blendsdk/year-planner");
      expect(manifest.homepage, path).toBe("https://github.com/blendsdk/year-planner#readme");
      expect(manifest.bugs?.url, path).toBe("https://github.com/blendsdk/year-planner/issues");
      expect(manifest.publishConfig?.access, path).toBe("public");
      expect(manifest.description, path).toBeTruthy();
    }
  });

  it("allowlists dist, README, LICENSE and CHANGELOG", () => {
    for (const path of [CORE, REACT]) {
      const manifest = json<Manifest>(path);
      for (const required of ["dist", "README.md", "LICENSE", "CHANGELOG.md"]) {
        expect(manifest.files, `${path} files`).toContain(required);
      }
      const directory = path.replace("/package.json", "");
      expect(exists(`${directory}/README.md`), `${directory}/README.md`).toBe(true);
      expect(exists(`${directory}/LICENSE`), `${directory}/LICENSE`).toBe(true);
      expect(read(`${directory}/LICENSE`)).toBe(read("LICENSE"));
    }
  });

  it("keeps the React exports and side-effect contract", () => {
    const react = json<Manifest>(REACT);
    expect(Object.keys(react.exports ?? {}).sort()).toEqual([
      ".",
      "./adapters/fluent",
      "./adapters/mui",
      "./styles.css",
    ]);
    expect(react.sideEffects).toEqual(["**/*.css"]);
    expect(react.peerDependencies?.react).toBe("^19.0.0");
    expect(react.dependencies?.["@blendsdk/year-planner-core"]).toBe("workspace:*");
  });
});

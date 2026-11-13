import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildReleaseNotes,
  changelogSection,
  inspectSourceMaps,
  inspectTarballSourceMaps,
  pendingChangesets,
  validatePackedManifest,
  validatePublishedIntegrity,
  validateSourceMap,
  validateTarballPaths,
} from "../../scripts/lib/release-manifest.mjs";
import { parseReleaseFlags } from "../../scripts/release-publish.mjs";

/**
 * Parses flags with `CI` unset.
 *
 * The parser rejects `--bootstrap` in CI by design. This helper keeps the
 * bootstrap contract testable without depending on the machine's CI variable.
 */
function parseOutsideCi(argv: string[]): ReturnType<typeof parseReleaseFlags> {
  const previous = process.env.CI;
  delete process.env.CI;
  try {
    return parseReleaseFlags(argv);
  } finally {
    if (previous === undefined) delete process.env.CI;
    else process.env.CI = previous;
  }
}

/**
 * Failure modes and documentation surface for the shared release helpers.
 *
 * The specification contract proves the rules; these cases pin the negative
 * behavior and keep the helper module documented.
 */

const ROOT = new URL("../../", import.meta.url);

describe("release manifest helper failure modes", () => {
  it("reports every missing required tarball file", () => {
    const errors = validateTarballPaths(["package/package.json"]);
    expect(errors.join("\n")).toContain("package/README.md");
    expect(errors.join("\n")).toContain("package/LICENSE");
    expect(errors.join("\n")).toContain("package/CHANGELOG.md");
    expect(errors.join("\n")).toContain("dist/");
  });

  it("rejects a workspace protocol and a range for the core dependency", () => {
    for (const dependency of ["workspace:*", "^0.2.0", "~0.2.0"]) {
      const errors = validatePackedManifest(
        {
          name: "@blendsdk/react-year-planner",
          version: "0.2.0",
          dependencies: { "@blendsdk/year-planner-core": dependency },
        },
        { name: "@blendsdk/react-year-planner", version: "0.2.0", coreVersion: "0.2.0" },
      );
      expect(errors.length, dependency).toBeGreaterThan(0);
    }
  });

  it("rejects invalid source-map JSON and a missing directory", () => {
    expect(validateSourceMap("{not json", "dist/bad.map")).toEqual([
      "dist/bad.map is not valid JSON",
    ]);
    expect(inspectSourceMaps("/definitely/missing/directory").join("\n")).toContain(
      "does not exist",
    );
  });

  it("reports pending changesets from a fixture", () => {
    const directory = mkdtempSync(join(tmpdir(), "release-changeset-"));
    try {
      mkdirSync(join(directory, ".changeset"));
      writeFileSync(join(directory, ".changeset", "fix.md"), "---\n---\n");
      expect(pendingChangesets(directory)).toEqual(["fix.md"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("validates source maps inside a tarball without a build tree", () => {
    const directory = mkdtempSync(join(tmpdir(), "release-map-"));
    const tarball = join(directory, "package.tgz");
    try {
      mkdirSync(join(directory, "package", "dist"), { recursive: true });
      writeFileSync(join(directory, "package", "package.json"), "{}");
      writeFileSync(
        join(directory, "package", "dist", "index.js.map"),
        JSON.stringify({ sources: ["../src/index.ts"] }),
      );
      execFileSync("tar", ["-czf", tarball, "-C", directory, "package"]);
      expect(inspectTarballSourceMaps(tarball)).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not match a longer changelog version prefix", () => {
    expect(changelogSection("## 0.2.10\n\n- future", "0.2.1")).toBe("");
    expect(changelogSection("## 0.2.1\n\n- current", "0.2.1")).toBe("- current");
  });

  it("rejects a published version with different content and accepts an identical one", () => {
    expect(validatePublishedIntegrity(undefined, "sha512-a", "pkg@1.0.0")).toEqual([]);
    expect(validatePublishedIntegrity("sha512-a", "sha512-a", "pkg@1.0.0")).toEqual([]);
    expect(validatePublishedIntegrity("sha512-a", "sha512-b", "pkg@1.0.0").join("\n")).toContain(
      "different integrity",
    );
  });

  it("rejects unsafe release flag combinations", () => {
    expect(() => parseReleaseFlags(["--allow-dirty"])).toThrow(/dry-run/);
    expect(() => parseReleaseFlags(["--skip-github-release"])).toThrow(/bootstrap/);
    expect(() => parseReleaseFlags(["--packs", "--dry-run"])).toThrow(/directory/);
    expect(() => parseReleaseFlags(["--bootstrap", "--dry-run"])).toThrow(/cannot be combined/);
    expect(parseOutsideCi(["--bootstrap", "--skip-github-release"])).toMatchObject({
      bootstrap: true,
      skipGithubRelease: true,
    });
  });

  it("returns an empty section for a missing changelog heading", () => {
    expect(changelogSection("## 0.2.0\n\n- fix", "0.3.0")).toBe("");
    expect(changelogSection("## 0.3.0\n\n- next", "0.3.0")).toBe("- next");
  });

  it("falls back to a note when a release section is absent", () => {
    const notes = buildReleaseNotes({
      version: "0.2.1",
      date: "2026-11-12",
      coreChangelog: "## 0.2.0\n\n- old",
      reactChangelog: "## 0.2.0\n\n- old",
      docsUrl: "https://example.com",
    });
    expect(notes).toContain("_No core changes._");
    expect(notes).toContain("_No React changes._");
  });
});

describe("RD-12-AC-11: helper documentation", () => {
  it("documents every exported helper and declaration", () => {
    const source = readFileSync(new URL("scripts/lib/release-manifest.mjs", ROOT), "utf8");
    for (const match of source.matchAll(/^export (?:function|const) (\w+)/gm)) {
      const name = match[1] ?? "";
      const index = match.index ?? 0;
      const before = source.slice(0, index);
      const blockStart = before.lastIndexOf("/**");
      const blockEnd = before.lastIndexOf("*/");
      expect(blockStart, `${name} has no doc block`).toBeGreaterThan(-1);
      expect(blockEnd, `${name} has no closed doc block`).toBeGreaterThan(blockStart);
      expect(before.slice(blockStart, blockEnd), `${name} doc block`).toContain("*");
    }
  });
});

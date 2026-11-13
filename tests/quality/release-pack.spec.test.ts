import { describe, expect, it } from "vitest";
import {
  buildReleaseNotes,
  validatePackedManifest,
  validateSourceMap,
  validateTarballPaths,
} from "../../scripts/lib/release-manifest.mjs";

/**
 * Tarball oracle for the published packages.
 *
 * These cases use synthetic path lists, packed manifests and source maps so
 * they run before the build. The real built tarballs are proven by
 * `pnpm release:check` after the build and by the release dry run.
 */

describe("RD-12-AC-11: tarball path allowlist", () => {
  it("accepts the documented package contents", () => {
    expect(
      validateTarballPaths([
        "package/package.json",
        "package/README.md",
        "package/LICENSE",
        "package/CHANGELOG.md",
        "package/THIRD_PARTY_NOTICES.md",
        "package/dist/index.js",
        "package/dist/index.d.ts",
        "package/dist/styles.css",
      ]),
    ).toEqual([]);
  });

  it("rejects source, test, fixture, photo and generated directories", () => {
    const errors = validateTarballPaths([
      "package/package.json",
      "package/src/index.ts",
      "package/etc/report.api.md",
      "package/temp/model.api.json",
      "package/coverage/index.html",
      "package/node_modules/react/index.js",
      "package/stories/Button.stories.tsx",
      "package/tests/e2e/planner.spec.ts",
      "package/assets/photo.png",
    ]);
    expect(errors.join("\n")).toContain("src/index.ts");
    expect(errors.join("\n")).toContain("etc/report.api.md");
    expect(errors.join("\n")).toContain("temp/model.api.json");
    expect(errors.join("\n")).toContain("coverage/index.html");
    expect(errors.join("\n")).toContain("node_modules/react/index.js");
    expect(errors.join("\n")).toContain("stories/Button.stories.tsx");
    expect(errors.join("\n")).toContain("tests/e2e/planner.spec.ts");
    expect(errors.join("\n")).toContain("assets/photo.png");
  });

  it("requires package.json, README, LICENSE, CHANGELOG and dist", () => {
    expect(validateTarballPaths(["package/package.json"])).toEqual(
      expect.arrayContaining([
        expect.stringContaining("README.md"),
        expect.stringContaining("LICENSE"),
        expect.stringContaining("CHANGELOG.md"),
        expect.stringContaining("dist/"),
      ]),
    );
  });
});

describe("RD-12-AC-03: exact internal dependency", () => {
  it("accepts the exact core version", () => {
    expect(
      validatePackedManifest(
        {
          name: "@blendsdk/react-year-planner",
          version: "0.2.0",
          dependencies: { "@blendsdk/year-planner-core": "0.2.0" },
        },
        { name: "@blendsdk/react-year-planner", version: "0.2.0", coreVersion: "0.2.0" },
      ),
    ).toEqual([]);
  });

  it("rejects workspace, range and mismatched versions", () => {
    for (const dependency of ["workspace:*", "^0.2.0", "~0.2.0", "0.1.0"]) {
      const errors = validatePackedManifest(
        {
          name: "@blendsdk/react-year-planner",
          version: "0.2.0",
          dependencies: { "@blendsdk/year-planner-core": dependency },
        },
        { name: "@blendsdk/react-year-planner", version: "0.2.0", coreVersion: "0.2.0" },
      );
      expect(errors.join("\n"), dependency).toContain("year-planner-core");
    }
  });

  it("rejects a packed version that differs from the manifest", () => {
    const errors = validatePackedManifest(
      { name: "@blendsdk/year-planner-core", version: "0.1.0" },
      { name: "@blendsdk/year-planner-core", version: "0.2.0", coreVersion: "0.2.0" },
    );
    expect(errors.join("\n")).toContain("version");
  });

  it("requires the React peer dependency on the languages package", () => {
    const expected = {
      name: "@blendsdk/year-planner-languages",
      version: "0.3.0",
      coreVersion: "0.3.0",
    };
    expect(
      validatePackedManifest(
        {
          name: "@blendsdk/year-planner-languages",
          version: "0.3.0",
          peerDependencies: { "@blendsdk/react-year-planner": "^0.3.0" },
        },
        expected,
      ),
    ).toEqual([]);
    expect(
      validatePackedManifest(
        { name: "@blendsdk/year-planner-languages", version: "0.3.0" },
        expected,
      ).join("\n"),
    ).toContain("peer dependency");
  });
});

describe("RD-12-AC-11: source-map privacy", () => {
  it("accepts relative sources without sourcesContent", () => {
    const source = JSON.stringify({
      version: 3,
      sources: ["../src/index.ts"],
      names: [],
      mappings: "",
    });
    expect(validateSourceMap(source, "dist/index.js.map")).toEqual([]);
  });

  it("rejects absolute, home-directory and file URLs", () => {
    for (const source of [
      JSON.stringify({ sources: ["/home/gevik/workdir/year-planner/packages/core/src/index.ts"] }),
      JSON.stringify({ sources: ["file:///home/gevik/secret.ts"] }),
      JSON.stringify({ sources: ["C:\\Users\\gevik\\secret.ts"] }),
    ]) {
      expect(validateSourceMap(source, "dist/index.js.map").length).toBeGreaterThan(0);
    }
  });
});

describe("RD-12-AC-05: release notes", () => {
  it("includes all three changelogs and the package and docs links", () => {
    const notes = buildReleaseNotes({
      version: "0.3.0",
      date: "2026-11-13",
      coreChangelog: "## 0.3.0\n\n### Patch Changes\n\n- core fix",
      reactChangelog: "## 0.3.0\n\n### Patch Changes\n\n- react fix",
      languagesChangelog: "## 0.3.0\n\n### Patch Changes\n\n- language fix",
      docsUrl: "https://blendsdk.github.io/year-planner/",
    });
    expect(notes).toContain("0.3.0");
    expect(notes).toContain("core fix");
    expect(notes).toContain("react fix");
    expect(notes).toContain("language fix");
    expect(notes).toContain("https://www.npmjs.com/package/@blendsdk/year-planner-core");
    expect(notes).toContain("https://www.npmjs.com/package/@blendsdk/react-year-planner");
    expect(notes).toContain("https://www.npmjs.com/package/@blendsdk/year-planner-languages");
    expect(notes).toContain("https://blendsdk.github.io/year-planner/");
  });
});

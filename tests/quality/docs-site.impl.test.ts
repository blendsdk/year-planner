import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { verifyArtifact } from "../../scripts/build-docs-site.mjs";

/**
 * Failure modes for the docs-site artifact checker. The build itself runs in
 * `docs:site`; these cases keep the checker honest without a full build.
 */

const roots: string[] = [];

/** Creates a temporary repository root. */
function root(): string {
  const directory = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "docs-site-"));
  roots.push(directory);
  return directory;
}

/** Writes a file under a temporary root. */
function write(directory: string, path: string, content: string): void {
  const file = join(directory, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

/** Creates a minimal valid combined artifact. */
function valid(directory: string): void {
  write(
    directory,
    "docs/.vitepress/dist/index.html",
    '<h1>Year Planner</h1><script src="./assets/app.js"></script>',
  );
  write(directory, "docs/.vitepress/dist/assets/app.js", "");
  write(
    directory,
    "docs/.vitepress/dist/storybook/index.html",
    '<script src="./assets/storybook.js"></script>',
  );
  write(
    directory,
    "docs/.vitepress/dist/storybook/iframe.html",
    '<link href="./assets/storybook.css" rel="stylesheet">',
  );
  write(directory, "docs/.vitepress/dist/storybook/assets/storybook.js", "");
  write(directory, "docs/.vitepress/dist/storybook/assets/storybook.css", "");
  write(
    directory,
    "docs/.vitepress/dist/storybook/index.json",
    '{"entries":{"demos--context-menu":{"type":"story"}}}',
  );
  write(
    directory,
    "docs/.vitepress/dist/api/index.html",
    '<a href="./core/index.html">core</a><a href="./react/index.html">react</a>',
  );
  write(directory, "docs/.vitepress/dist/api/core/index.html", "<h1>core</h1>");
  write(directory, "docs/.vitepress/dist/api/react/index.html", "<h1>react</h1>");
}

afterEach(() => {
  for (const directory of roots.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("docs-site artifact checker", () => {
  it("accepts a minimal valid artifact", () => {
    const directory = root();
    valid(directory);
    expect(verifyArtifact(directory)).toEqual([]);
  });

  it("reports a missing artifact", () => {
    const errors = verifyArtifact(root());
    expect(errors).toContain("missing index.html");
  });

  it("reports a missing API tree", () => {
    const directory = root();
    write(directory, "docs/.vitepress/dist/index.html", "<h1>Year Planner</h1>");
    expect(verifyArtifact(directory)).toContain("missing api/index.html");
  });

  it("reports a broken relative asset", () => {
    const directory = root();
    valid(directory);
    write(
      directory,
      "docs/.vitepress/dist/index.html",
      '<h1>Year Planner</h1><script src="./assets/missing.js"></script>',
    );
    expect(verifyArtifact(directory).join(" ")).toContain("index.html references missing");
  });

  it("reports a broken API landing link", () => {
    const directory = root();
    valid(directory);
    write(
      directory,
      "docs/.vitepress/dist/api/index.html",
      '<a href="./core/index.html">core</a><a href="./missing/index.html">missing</a>',
    );
    expect(verifyArtifact(directory).join(" ")).toContain("api/index.html references missing");
  });

  it("accepts root-absolute URLs under the project base", () => {
    const directory = root();
    valid(directory);
    write(
      directory,
      "docs/.vitepress/dist/index.html",
      '<h1>Year Planner</h1><img src="/year-planner/assets/logo.png">',
    );
    write(directory, "docs/.vitepress/dist/assets/logo.png", "");
    expect(verifyArtifact(directory)).toEqual([]);
  });

  it("rejects root-absolute URLs outside the project base", () => {
    const directory = root();
    valid(directory);
    write(
      directory,
      "docs/.vitepress/dist/index.html",
      '<h1>Year Planner</h1><img src="/assets/logo.png">',
    );
    expect(verifyArtifact(directory).join(" ")).toContain("references a path outside the artifact");
  });

  it("reports an empty story index", () => {
    const directory = root();
    valid(directory);
    write(directory, "docs/.vitepress/dist/storybook/index.json", '{"entries":{}}');
    expect(verifyArtifact(directory)).toContain("storybook/index.json has no stories");
  });
});

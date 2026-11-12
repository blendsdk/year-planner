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

/** Creates a minimal valid artifact. */
function valid(directory: string): void {
  write(directory, "storybook-static/index.html", '<script src="./assets/app.js"></script>');
  write(
    directory,
    "storybook-static/iframe.html",
    '<link href="./assets/style.css" rel="stylesheet">',
  );
  write(directory, "storybook-static/assets/app.js", "");
  write(directory, "storybook-static/assets/style.css", "");
  write(
    directory,
    "storybook-static/api/index.html",
    '<a href="./core/index.html">core</a><a href="./react/index.html">react</a>',
  );
  write(directory, "storybook-static/api/core/index.html", "<h1>core</h1>");
  write(directory, "storybook-static/api/react/index.html", "<h1>react</h1>");
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
    expect(errors).toContain("missing storybook-static/index.html");
  });

  it("reports a missing API tree", () => {
    const directory = root();
    write(directory, "storybook-static/index.html", "");
    expect(verifyArtifact(directory)).toContain("missing api/index.html");
  });

  it("reports a broken relative asset", () => {
    const directory = root();
    valid(directory);
    write(directory, "storybook-static/index.html", '<script src="./assets/missing.js"></script>');
    expect(verifyArtifact(directory).join(" ")).toContain("index.html references missing");
  });

  it("reports a broken API landing link", () => {
    const directory = root();
    valid(directory);
    write(
      directory,
      "storybook-static/api/index.html",
      '<a href="./core/index.html">core</a><a href="./missing/index.html">missing</a>',
    );
    expect(verifyArtifact(directory).join(" ")).toContain("api/index.html references missing");
  });
});

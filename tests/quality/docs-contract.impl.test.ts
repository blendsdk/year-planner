import { describe, expect, it } from "vitest";
import { linkTarget, relativeLinks } from "./lib/markdown-links.js";

/**
 * Edge cases for the markdown link extractor used by the documentation
 * contract. A false negative would let a broken link ship; a false positive
 * would flag an example URL.
 */
describe("documentation link extractor", () => {
  it("returns relative links and skips external, mail and anchor targets", () => {
    expect(
      relativeLinks(
        "See [guide](guide.md), [anchor](#start), [web](https://example.com) and [mail](mailto:a@b.c).",
      ),
    ).toEqual(["guide.md"]);
  });

  it("ignores links inside fenced code blocks", () => {
    expect(relativeLinks("```md\n[missing](missing.md)\n```\n\n[real](real.md)")).toEqual([
      "real.md",
    ]);
  });

  it("strips the fragment from a link", () => {
    expect(relativeLinks("[guide](guide.md#install)")).toEqual(["guide.md"]);
  });

  it("resolves a parent-relative link from a nested document", () => {
    expect(linkTarget("docs/guide.md", "../README.md")).toBe("README.md");
    expect(linkTarget("docs/guide.md", "theming.md")).toBe("docs/theming.md");
  });
});

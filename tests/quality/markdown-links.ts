import { join } from "node:path";

/**
 * Returns the relative links in a markdown document.
 *
 * Fenced code blocks are removed first so an example URL is never treated as a
 * real link. External URLs, mail links, pure anchors and root-absolute paths
 * are out of scope.
 *
 * @param markdown Markdown source.
 * @returns Relative link targets in document order.
 * @example
 * relativeLinks("See [the guide](guide.md#start).") // ["guide.md#start"]
 */
export function relativeLinks(markdown: string): string[] {
  const links: string[] = [];
  const prose = markdown.replace(/```[\s\S]*?```/g, "");
  for (const match of prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]?.split("#")[0] ?? "";
    if (!target || /^[a-z]+:/i.test(target) || target.startsWith("#") || target.startsWith("/")) {
      continue;
    }
    links.push(target);
  }
  return links;
}

/**
 * Resolves a link relative to the document that contains it.
 *
 * @param document Repository-relative document path.
 * @param link Relative link target.
 * @returns Normalized repository-relative target path.
 * @throws When the target escapes the repository root.
 * @example
 * linkTarget("docs/guide.md", "../README.md") // "README.md"
 */
export function linkTarget(document: string, link: string): string {
  const target = join(document, "..", link).replace(/^\.\//, "");
  if (target === ".." || target.startsWith("../")) {
    throw new Error(`link ${link} escapes the repository from ${document}`);
  }
  return target;
}

/**
 * Returns the heading anchors of a markdown document using GitHub-style slugs.
 *
 * @param markdown Markdown source.
 * @returns Lowercase anchors without punctuation.
 * @example
 * headingAnchors("## Getting started") // Set { "getting-started" }
 */
export function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  for (const line of markdown.split("\n")) {
    const match = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const slug = (match[1] ?? "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    if (slug) anchors.add(slug);
  }
  return anchors;
}

/**
 * Returns relative links that carry a heading fragment.
 *
 * @param markdown Markdown source.
 * @returns Link path and anchor pairs.
 * @example
 * anchoredLinks("[guide](guide.md#install)") // [{ path: "guide.md", anchor: "install" }]
 */
export function anchoredLinks(markdown: string): Array<{ path: string; anchor: string }> {
  const links: Array<{ path: string; anchor: string }> = [];
  const prose = markdown.replace(/```[\s\S]*?```/g, "");
  for (const match of prose.matchAll(/\]\(([^)\s]*)#([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const path = match[1] ?? "";
    const anchor = match[2] ?? "";
    if (!path || /^[a-z]+:/i.test(path) || path.startsWith("/")) continue;
    links.push({ path, anchor });
  }
  return links;
}

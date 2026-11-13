import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** One story from Storybook's generated index. */
interface StoryEntry {
  /** Story id used in Storybook URLs. */
  id: string;
  /** Group title, for example `Demos`. */
  title: string;
  /** Story name, for example `Context Menu`. */
  name: string;
}

/** The shape Storybook writes to `storybook-static/index.json`. */
interface StoryIndex {
  entries: Record<string, { title: string; name: string; type: string }>;
}

/**
 * Reads the built Storybook index.
 *
 * The docs build runs after `storybook:build`, so the index is the real list of
 * built stories. During docs-only development it may not exist yet; the page
 * then asks the reader to run the Storybook build instead of failing.
 */
export default {
  load(): { stories: StoryEntry[]; available: boolean } {
    try {
      const path = fileURLToPath(
        new URL("../../../storybook-static/index.json", import.meta.url),
      );
      const index = JSON.parse(readFileSync(path, "utf8")) as StoryIndex;
      const stories = Object.entries(index.entries)
        .filter(([, entry]) => entry.type === "story")
        .map(([id, entry]) => ({ id, title: entry.title, name: entry.name }))
        .sort(
          (left, right) =>
            left.title.localeCompare(right.title) || left.name.localeCompare(right.name),
        );
      return { stories, available: stories.length > 0 };
    } catch {
      return { stories: [], available: false };
    }
  },
};

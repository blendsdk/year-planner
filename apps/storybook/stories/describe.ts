import type { StoryObj } from "@storybook/react-vite";

/**
 * Turns an export name into a readable one-line description.
 *
 * A dedicated description is always preferred; this fallback keeps every
 * story documented when a new variant is added without one.
 */
function humanize(name: string): string {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)} story.`;
}

/**
 * Adds a story-level description to every exported story.
 *
 * Storybook reads `parameters.docs.description.story`; applying it here keeps
 * the catalogue contract in one place instead of repeating the same parameter
 * block on every export.
 *
 * @param stories - Exported stories of one file, keyed by export name.
 * @param descriptions - Optional explicit descriptions keyed by export name.
 * @returns The same object, after mutation, so it can be exported directly.
 */
export function describeStories<T extends Record<string, StoryObj>>(
  stories: T,
  descriptions: Partial<Record<keyof T & string, string>> = {},
): T {
  for (const [name, story] of Object.entries(stories)) {
    if (!story) continue;
    const existing = story.parameters?.docs?.description;
    if (typeof existing === "object" && existing !== null && "story" in existing) continue;
    story.parameters = {
      ...story.parameters,
      docs: {
        ...story.parameters?.docs,
        description: {
          ...(typeof existing === "object" && existing !== null ? existing : {}),
          story: descriptions[name] ?? humanize(name),
        },
      },
    };
  }
  return stories;
}

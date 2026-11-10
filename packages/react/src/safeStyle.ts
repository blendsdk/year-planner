import type { CSSProperties } from "react";

const ALLOWED_PROPERTIES = new Set([
  "background",
  "backgroundColor",
  "color",
  "borderColor",
  "fontWeight",
  "fontStyle",
  "textDecoration",
  "opacity",
]);

const UNSAFE_VALUE = /url\(|expression\(|@import|javascript:/i;

/**
 * Filters trusted host item styles to a small CSS allowlist.
 *
 * Values containing URLs, `expression()`, `@import` or `javascript:` are
 * dropped. The planner never reads item metadata for styling.
 */
export function safeItemStyle(style: Record<string, string | number> | undefined): CSSProperties {
  if (!style) return {};
  const result: CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (!ALLOWED_PROPERTIES.has(key)) continue;
    if (typeof value === "string" && UNSAFE_VALUE.test(value)) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

/** Filters a React style object from `getDateMeta` to the same allowlist. */
export function safeMetaStyle(style: CSSProperties | undefined): CSSProperties {
  if (!style) return {};
  const result: CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (!ALLOWED_PROPERTIES.has(key)) continue;
    if (typeof value === "string" && UNSAFE_VALUE.test(value)) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

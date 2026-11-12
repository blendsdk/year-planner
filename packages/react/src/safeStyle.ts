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
const SAFE_COLOR =
  /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([0-9.,%\s/+-]+\)|[a-z]+|var\(--yp-[a-z0-9-]+(?:\s*,\s*[^()]+)?\))$/i;
const COLOR_PROPERTIES = new Set(["background", "backgroundColor", "borderColor", "color"]);

/**
 * Validates a host-supplied CSS color.
 *
 * Accepts hex, rgb/rgba, hsl/hsla, named colors and `var(--yp-*)`. Rejects URLs,
 * expressions and any value containing CSS structure characters.
 */
export function safeCssColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (UNSAFE_VALUE.test(value)) return undefined;
  return SAFE_COLOR.test(value.trim()) ? value : undefined;
}

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
    if (COLOR_PROPERTIES.has(key)) {
      if (typeof value !== "string") continue;
      const color = safeCssColor(value);
      if (color === undefined) continue;
      (result as Record<string, unknown>)[key] = color;
      continue;
    }
    if (typeof value === "string" && UNSAFE_VALUE.test(value)) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

/**
 * Filters a React style object from `getDateMeta` to the same allowlist.
 */
export function safeMetaStyle(style: CSSProperties | undefined): CSSProperties {
  if (!style) return {};
  const result: CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (!ALLOWED_PROPERTIES.has(key)) continue;
    if (COLOR_PROPERTIES.has(key)) {
      if (typeof value !== "string") continue;
      const color = safeCssColor(value);
      if (color === undefined) continue;
      (result as Record<string, unknown>)[key] = color;
      continue;
    }
    if (typeof value === "string" && UNSAFE_VALUE.test(value)) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

# Contracts and Theme: M3 React View

> **Document**: 03-01-contracts-theme.md
> **Parent**: [Index](00-index.md)

## Overview

Defines the canonical public types shared by the React view, interaction and
command slices, plus the token/theme model used by every rendered part.

## Contracts

### `packages/core/src/contracts.ts` (type-only)

```ts
import type { DateKey } from "./date.js";
import type { Diagnostic } from "./diagnostics.js";
import type { PlannerPeriod } from "./period.js";
import type { PlannerItem } from "./model/types.js";
import type { PaintDefaults } from "./model/paint.js";

export interface PlannerSelection {
  dates: { startDate: DateKey; endDateExclusive: DateKey }[];
  items: string[];
  anchorDate?: DateKey;
  focusDate?: DateKey;
  anchorItemId?: string;
}

export interface ValidationResult {
  permitted: boolean;
  diagnostics: Diagnostic[];
}

export interface CommandContext {
  requestId: string;
  baseRevision?: string;
}

export type PlannerCommand =
  | { type: "create"; item: PlannerItem }
  | { type: "update"; itemId: string; patch: Partial<Omit<PlannerItem, "id" | "version">>; expectedVersion: number }
  | { type: "move"; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: "resize"; itemId: string; proposedPeriod: PlannerPeriod; expectedVersion: number }
  | { type: "delete"; itemId: string; expectedVersion: number }
  | { type: "paint"; layerId: string; period: PlannerPeriod; operation: "union" | "subtract"; defaults: PaintDefaults; expectedVersions: Record<string, number> };

export type CommandOutcome =
  | { accepted: true; revision: string; updatedItems?: PlannerItem[]; removedItemIds?: string[] }
  | { accepted: false; diagnostics: Diagnostic[]; latestRevision?: string };
```

`contracts.ts` contains only types. The runtime helpers live in
`packages/core/src/model/selection.ts`:

```ts
export function emptySelection(): PlannerSelection;
export function selectionItemIds(selection: PlannerSelection | undefined): string[];
```

`selectionItemIds` preserves first-seen order and deduplicates.

### Diagnostic table

`packages/core/src/diagnostics.ts` owns the union. RD-06 emits these public
codes; the React boundary maps core paint codes to the public ones.

| Code | Emitted by | Notes / RD-08 alignment |
|---|---|---|
| `READ_ONLY` | command checks | Public alias for core `NOT_EDITABLE` |
| `STALE_REVISION` | command checks | Public alias for core `STALE_VERSION` |
| `INVALID_PAINT_TARGET` | command checks | Unknown, non-highlight or mismatched active layer |
| `INVALID_COMMAND` | command checks | Malformed command/period or unsupported option |
| `CONFIRMATION_UNAVAILABLE` | delete | No host callback and no `window.confirm` |
| `COMMAND_TIMEOUT` | host flow | Request exceeded `commandTimeoutMs` |
| `HOST_REJECTED` | host flow | Promise rejected/threw |
| `VALIDATION_ERROR` | host validation | `validateChange` denied or threw; host-request throws use `HOST_REJECTED` |
| `UNDO_UNAVAILABLE` | handle | Controlled mode has host-owned history |
| `INVALID_LOCALE` | view shell | Formatter construction failed; `en-US` fallback |
| `INVALID_RANGE` | view shell | Zoom/geometry option out of range |
| `MISSING_RANGE` | view shell | No `year`/`range`; empty state |
| `INVALID_TIMEZONE` | view shell | Invalid `displayTimeZone`; UTC fallback |
| `TIMED_EDITING_UNSUPPORTED` | inspector | Timed item move/resize/paint (never `INVALID_COMMAND`) |
| `INVALID_RENDERER_OPTION` | view shell | `connectorMode: "edge-path"` in the HTML R1 renderer |
| `INVALID_PRINT_OPTIONS` | print | Already a core code |
| `PRINT_FIT_TOO_SMALL` | print | Already a core code |

`INVALID_LOCALE`, `INVALID_RENDERER_OPTION`, `READ_ONLY`,
`CONFIRMATION_UNAVAILABLE`, `COMMAND_TIMEOUT`, `HOST_REJECTED`,
`VALIDATION_ERROR`, `STALE_REVISION`, `UNDO_UNAVAILABLE`,
`INVALID_COMMAND` and `TIMED_EDITING_UNSUPPORTED` are added to the union.
`INVALID_PAINT_TARGET` already exists.

## Theme model

### Tokens (24)

```ts
export type YearPlannerTokenName =
  | "surface" | "surfaceMuted" | "weekend" | "context" | "border"
  | "textPrimary" | "textMuted" | "textInverse"
  | "focusRing" | "selectionFill" | "selectionOutline"
  | "highlight" | "ribbon" | "annotation" | "foreground"
  | "rowHeight" | "laneHeight" | "monthBandWidth" | "weekendWidth" | "weekdayWidth"
  | "fontFamily" | "fontSize" | "fontWeight" | "printScale";

export type YearPlannerTheme = Record<YearPlannerTokenName, string | number>;
export type YearPlannerThemeName =
  | "classic-blue" | "classic-yellow" | "modern" | "high-contrast" | "print";

export function createTheme(theme?: Partial<YearPlannerTheme>): YearPlannerTheme;
export function themeToCssVars(theme: YearPlannerTheme): Record<`--yp-${string}`, string>;
export const yearPlannerPresets: Record<YearPlannerThemeName, YearPlannerTheme>;
export function getPresetTheme(name: string): YearPlannerTheme | undefined;
```

Token names convert to CSS variables with kebab case (`textPrimary` →
`--yp-text-primary`, `weekendWidth` → `--yp-weekend-width`). Units:

| Tokens | Unit |
|---|---|
| `rowHeight`, `laneHeight`, `monthBandWidth`, `weekendWidth`, `weekdayWidth`, `fontSize` | numbers in design px; `createTheme` normalises `"<n>px"` |
| `printScale`, `fontWeight` | unitless numbers |
| Color/font-family tokens | as supplied |

Geometry tokens are numbers in design px. `createTheme` accepts `"<n>px"` for
them and converts it; any other string falls back to the preset value silently
(no diagnostic channel exists in a pure theme factory). Geometry tokens feed
`buildClassicYearLayout({ units })` and `buildRibbonLayout` options so there is
one source of truth. Explicit `units` props win over theme geometry.
`printScale` is the fallback `--yp-print-scale` when print planning is
unavailable; a valid `planRibbonPrint` page scale overrides it.

`getPresetTheme` returns a frozen preset copy for a known name, otherwise
`undefined` (the view then treats an unknown `display.theme` string as a host
CSS hook).

### Presets

| Preset | Character |
|---|---|
| `classic-blue` | Current blue bands, cyan weekends |
| `classic-yellow` | Current yellow bands |
| `modern` | Slate bands, neutral surfaces |
| `high-contrast` | Black/white/yellow, strong focus ring |
| `print` | White surfaces, black text/borders, light gray weekend/context tints and saturated channels |

All presets keep `rowHeight: 90`, `laneHeight: 18`, `monthBandWidth: 70`,
`weekendWidth: 40`, `weekdayWidth: 55`; only visual tokens differ. Switching
presets therefore keeps every date, row count and geometry value identical.

### Provider

```tsx
const YearPlannerProvider: FC<{ theme?: Partial<YearPlannerTheme>; children: ReactNode }>;
```

The provider merges its theme over `classic-blue` and supplies defaults.
Explicit `display.theme`, `cssVars` and `style` win. Using the component without
a provider is fully supported because the theme is rendered as CSS variables on
the root.

### CSS layers

```css
@layer year-planner.base, year-planner.theme, year-planner.components, year-planner.overrides;
```

- `base`: structure, grid, focus, print geometry.
- `theme`: preset variables and channel defaults.
- `components`: item proxies, inspector, tooltip, overflow.
- `overrides`: `unstyled` and host class hooks.

No global element selector, no `!important`, no reset.

## API migration (pre-1.0)

| Old surface | New surface | Handling |
|---|---|---|
| `YearPlannerTheme` preset string | `YearPlannerTheme` token object; presets use `YearPlannerThemeName` | Documented break; `display.theme` accepts `string` for host themes |
| `YearPlannerDisplay` | `DisplayConfig` | Alias retained |
| `YearPlannerPrint` | `PrintConfig` | Alias retained |
| `units` prop | Not in RD-06 | Kept as additive compatibility; theme geometry tokens are the new path |

`README.md` and a changeset record the migration. The API Extractor report is
regenerated and reviewed in the same slice.

## Testing Requirements

- Contract typecheck and `emptySelection`/`selectionItemIds` behavior.
- Every one of the 24 tokens maps to a CSS variable; units follow the table.
- `createTheme` merges and does not mutate.
- Provider defaults vs explicit props.
- Presets change visual tokens but not geometry or dates.
- Geometry tokens feed the layout; `printScale` fallback precedence.

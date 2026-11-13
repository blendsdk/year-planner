/**
 * User-interface messages owned by the planner.
 *
 * The component renders English by default. A host can replace any message with
 * the `messages` prop, and the `@blendsdk/year-planner-languages` package ships
 * complete translations for the supported languages. Placeholders such as
 * `{count}` are replaced at render time; plural messages choose a form with
 * `Intl.PluralRules`.
 *
 * @public
 */

/**
 * Plural forms for one counted message.
 *
 * `other` is required and is the fallback for every language. Languages that
 * use more categories can supply `zero`, `one`, `two`, `few` and `many`. The
 * runtime selects the category with `Intl.PluralRules` for the active locale.
 *
 * @public
 */
export interface PluralMessage {
  /** Zero form used by Latvian and similar languages. */
  zero?: string;
  /** Singular form. */
  one?: string;
  /** Dual form. */
  two?: string;
  /** Paucal form used by several Slavic languages. */
  few?: string;
  /** Large-count form used by several Slavic languages. */
  many?: string;
  /** Required fallback form. */
  other: string;
}

/**
 * Every message the planner can render.
 *
 * The templates are plain strings with `{name}` placeholders. Keeping them as
 * strings makes translation files compact and lets a host override one message
 * without replacing the whole catalogue.
 *
 * @public
 */
export interface PlannerMessages {
  /** Accessible name of the planner region; `{year}`. */
  regionLabel: string;
  /** Accessible name of the grid; `{region}`. */
  gridLabel: string;
  /** Shown when the layout cannot be built. */
  unableToRender: string;
  /** Skip link to the item list. */
  skipToItemList: string;
  /** Keyboard instructions announced by the help paragraph. */
  keyboardHelp: string;
  /** ISO week description in a date cell name; `{week}`. */
  isoWeek: string;
  /** Item count in a date cell name; `{count}`. */
  itemCount: PluralMessage;
  /** Day count in a selection summary; `{count}`. */
  dayCount: PluralMessage;
  /** Holiday state in a date cell name. */
  holiday: string;
  /** Selected state in an accessible name. */
  selected: string;
  /** Unavailable state in a date cell name. */
  unavailable: string;
  /** Layer part of an item name; `{name}`. */
  layerName: string;
  /** Pattern part of an item name; `{pattern}`. */
  patternName: string;
  /** Status part of an item name; `{status}`. */
  itemStatus: string;
  /** Not-selected state in an item name. */
  notSelected: string;
  /** Clipped state in an item name. */
  partiallyVisible: string;
  /** Selection live-region message when nothing is selected. */
  selectionCleared: string;
  /** Selection live-region message; `{items}` and `{days}`. */
  selectionSummary: string;
  /** Visibility live-region message; `{count}`. */
  visibilityChanged: PluralMessage;
  /** Command is waiting for the host. */
  commandPending: string;
  /** Command was accepted. */
  commandAccepted: string;
  /** Command was accepted but no host change was applied. */
  commandAcceptedNotApplied: string;
  /** Command was cancelled by the confirmation hook. */
  commandCancelled: string;
  /** Prompt for the built-in delete confirmation. */
  confirmDelete: string;
  /** Generic rejected command prefix. */
  commandRejected: string;
  /** Host rejected the command without a message. */
  commandHostRejected: string;
  /** Command timed out. */
  commandTimedOut: string;
  /** Command was aborted. */
  commandAborted: string;
  /** Command result was stale. */
  commandStale: string;
  /** Focus announcement; `{date}`. */
  focusMoved: string;
  /** Item-list heading; `{count}`. */
  itemListHeading: string;
  /** Item list with no visible entries. */
  itemListEmpty: string;
  /** Expand the item list; `{count}`. */
  itemListShowAll: PluralMessage;
  /** Item-list suffix for an item hidden by the row lane limit. */
  itemListOverflow: string;
  /** Inspector aside accessible name. */
  inspectorLabel: string;
  /** Inspector heading. */
  inspectorTitle: string;
  /** Close-inspector button name. */
  inspectorClose: string;
  /** Inspector body with no selection. */
  inspectorEmpty: string;
  /** Item kind label. */
  detailKind: string;
  /** Item layer label. */
  detailLayer: string;
  /** Item period label. */
  detailPeriod: string;
  /** Item status label. */
  detailStatus: string;
  /** Item visibility label. */
  detailVisibility: string;
  /** Item editability label. */
  detailEditable: string;
  /** Visible state in the inspector. */
  visibilityVisible: string;
  /** Editable state in the inspector. */
  editableYes: string;
  /** Unknown editability state. */
  editableUnknown: string;
  /** Highlight item kind. */
  kindHighlight: string;
  /** Activity item kind. */
  kindActivity: string;
  /** Reservation item kind. */
  kindReservation: string;
  /** Annotation item kind. */
  kindAnnotation: string;
  /** Solid layer pattern. */
  patternSolid: string;
  /** Hatch layer pattern. */
  patternHatch: string;
  /** Dots layer pattern. */
  patternDots: string;
  /** Hidden by a group. */
  visibilityReasonGroup: string;
  /** Hidden by a layer. */
  visibilityReasonLayer: string;
  /** Hidden as an individual item. */
  visibilityReasonItem: string;
  /** Removed by the active filter. */
  visibilityReasonFilter: string;
  /** Hidden by the render channel. */
  visibilityReasonChannel: string;
  /** Unknown item in a visibility check. */
  visibilityReasonUnknown: string;
  /** Blocked by the global read-only flag. */
  editabilityReasonGlobalReadOnly: string;
  /** Blocked because the item is hidden. */
  editabilityReasonHidden: string;
  /** Blocked because the item is locked. */
  editabilityReasonItemLocked: string;
  /** Blocked because the layer is locked. */
  editabilityReasonLayerLocked: string;
  /** Blocked by the layer policy. */
  editabilityReasonPolicy: string;
  /** Blocked by the active interaction mode. */
  editabilityReasonInteractionMode: string;
  /** Unknown item in an editability check. */
  editabilityReasonUnknown: string;
  /** Accessible name of an item action group; `{title}`. */
  actionsFor: string;
  /** Delete action. */
  actionDelete: string;
  /** Move-earlier action. */
  actionMoveEarlier: string;
  /** Move-later action. */
  actionMoveLater: string;
  /** Resize-shorter action. */
  actionResizeShorter: string;
  /** Resize-longer action. */
  actionResizeLonger: string;
  /** Paint-range action. */
  actionPaint: string;
  /** Erase-range action. */
  actionErase: string;
  /** Annotation items cannot be edited. */
  noteHostOwned: string;
  /** Timed items cannot be edited. */
  noteTimed: string;
  /** Deletion is denied by policy. */
  noteDeleteDisabled: string;
  /** No active layer is available for creation. */
  noteNoActiveLayer: string;
  /** Inspector overflow heading; `{count}`. */
  inspectorHiddenOnRow: string;
  /** Create-item action. */
  actionCreate: string;
  /** Command feedback section name. */
  feedbackLabel: string;
  /** Retry action. */
  actionRetry: string;
  /** Dismiss action. */
  actionDismiss: string;
  /** Overflow button name; `{count}`. */
  overflowShow: PluralMessage;
  /** Overflow dialog name. */
  overflowLabel: string;
}

/**
 * A host override for any subset of the messages.
 *
 * Plural messages are replaced as a whole so a translation never mixes forms
 * from two languages. This keeps the merge type-safe and predictable.
 *
 * @public
 */
export type PlannerMessagesOverride = Partial<PlannerMessages>;

/**
 * The built-in English catalogue.
 * @public
 */
export const defaultPlannerMessages: PlannerMessages = {
  regionLabel: "Year planner {year}",
  gridLabel: "{region} grid",
  unableToRender: "Unable to render the year planner.",
  skipToItemList: "Skip to item list",
  keyboardHelp:
    "Use arrow keys to move between dates. Hold Shift with an arrow key to extend the selection. Press Space to toggle a date or item, Enter to inspect, Escape to cancel or clear, and Delete to delete the focused item after confirmation.",
  isoWeek: "ISO week {week}",
  itemCount: { one: "{count} item", other: "{count} items" },
  dayCount: { one: "{count} day", other: "{count} days" },
  holiday: "holiday",
  selected: "selected",
  unavailable: "unavailable",
  layerName: "layer {name}",
  patternName: "{pattern} pattern",
  itemStatus: "status {status}",
  notSelected: "not selected",
  partiallyVisible: "partially visible",
  selectionCleared: "Selection cleared",
  selectionSummary: "Selection: {items}, {days}",
  visibilityChanged: {
    one: "Visibility changed: {count} visible item",
    other: "Visibility changed: {count} visible items",
  },
  commandPending: "Change pending",
  commandAccepted: "Change accepted",
  commandAcceptedNotApplied: "Change accepted but not applied",
  commandCancelled: "Change cancelled",
  confirmDelete: "Delete this item?",
  commandRejected: "Change rejected",
  commandHostRejected: "The host rejected the change",
  commandTimedOut: "Change timed out",
  commandAborted: "Change aborted",
  commandStale: "Change is stale",
  focusMoved: "Focus moved to {date}",
  itemListHeading: "All visible items ({count})",
  itemListEmpty: "No visible items",
  itemListShowAll: { one: "Show all {count} item", other: "Show all {count} items" },
  itemListOverflow: "hidden on this month",
  inspectorLabel: "Planner inspector",
  inspectorTitle: "Inspector",
  inspectorClose: "Close inspector",
  inspectorEmpty: "Select an item or date range.",
  detailKind: "Kind",
  detailLayer: "Layer",
  detailPeriod: "Period",
  detailStatus: "Status",
  detailVisibility: "Visibility",
  detailEditable: "Editable",
  visibilityVisible: "visible",
  editableYes: "yes",
  editableUnknown: "unknown",
  kindHighlight: "Highlight",
  kindActivity: "Activity",
  kindReservation: "Reservation",
  kindAnnotation: "Annotation",
  patternSolid: "solid",
  patternHatch: "hatch",
  patternDots: "dots",
  visibilityReasonGroup: "hidden by group",
  visibilityReasonLayer: "hidden by layer",
  visibilityReasonItem: "hidden by item",
  visibilityReasonFilter: "filtered out",
  visibilityReasonChannel: "hidden by channel",
  visibilityReasonUnknown: "unknown item",
  editabilityReasonGlobalReadOnly: "read-only",
  editabilityReasonHidden: "hidden",
  editabilityReasonItemLocked: "item locked",
  editabilityReasonLayerLocked: "layer locked",
  editabilityReasonPolicy: "not allowed by policy",
  editabilityReasonInteractionMode: "not available in this mode",
  editabilityReasonUnknown: "unknown item",
  actionsFor: "Actions for {title}",
  actionDelete: "Delete",
  actionMoveEarlier: "Move earlier",
  actionMoveLater: "Move later",
  actionResizeShorter: "Resize shorter",
  actionResizeLonger: "Resize longer",
  actionPaint: "Paint range",
  actionErase: "Erase range",
  noteHostOwned: "Annotation items are host-owned.",
  noteTimed: "Timed items cannot be moved, resized or painted.",
  noteDeleteDisabled: "Deletion is disabled by the layer policy.",
  noteNoActiveLayer: "Set an active layer to create items.",
  inspectorHiddenOnRow: "Hidden on this row ({count})",
  actionCreate: "Create item",
  feedbackLabel: "Command feedback",
  actionRetry: "Retry",
  actionDismiss: "Dismiss",
  overflowShow: { one: "Show {count} hidden item", other: "Show {count} hidden items" },
  overflowLabel: "Hidden items",
};

const pluralRulesCache = new Map<string, Intl.PluralRules>();

function pluralRules(locale: string): Intl.PluralRules | undefined {
  const cached = pluralRulesCache.get(locale);
  if (cached) return cached;
  try {
    const rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
    return rules;
  } catch {
    return undefined;
  }
}

/**
 * Replaces `{name}` placeholders in a message template.
 *
 * Unknown placeholders stay untouched so a malformed host override is visible
 * instead of silently disappearing.
 *
 * @param template - Message template.
 * @param values - Placeholder values.
 * @returns The formatted message.
 *
 * @example
 * ```ts
 * formatPlannerMessage("Year planner {year}", { year: 2027 }); // "Year planner 2027"
 * ```
 * @public
 */
export function formatPlannerMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Selects and formats one plural message.
 *
 * The locale drives `Intl.PluralRules`; an unknown locale falls back to the
 * `other` form. This keeps every language usable even when a runtime has
 * incomplete plural data.
 *
 * @param message - Plural forms.
 * @param count - Number that selects the form.
 * @param locale - Active locale.
 * @returns The formatted message.
 *
 * @example
 * ```ts
 * formatPluralMessage({ one: "{count} day", other: "{count} days" }, 1, "en-US");
 * // "1 day"
 * ```
 * @public
 */
export function formatPluralMessage(message: PluralMessage, count: number, locale: string): string {
  const category = pluralRules(locale)?.select(count);
  const template =
    (category === "zero" ||
    category === "one" ||
    category === "two" ||
    category === "few" ||
    category === "many" ||
    category === "other"
      ? message[category]
      : undefined) ?? message.other;
  return formatPlannerMessage(template, { count });
}

/**
 * Merges host overrides onto the English catalogue.
 *
 * The merge is shallow. Every key the host supplies replaces the English
 * message; every key it omits keeps the English fallback.
 *
 * @param overrides - Partial messages supplied by the host.
 * @returns A complete catalogue safe to render.
 * @public
 */
export function resolvePlannerMessages(
  overrides: PlannerMessagesOverride | undefined,
): PlannerMessages {
  return overrides ? { ...defaultPlannerMessages, ...overrides } : defaultPlannerMessages;
}

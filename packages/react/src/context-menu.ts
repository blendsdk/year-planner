import type { DateKey } from "@blendsdk/year-planner-core";

/**
 * The target a host-owned context-menu request refers to.
 *
 * @public
 */
export type PlannerContextTarget =
  | {
      /** Discriminator for a date cell. */
      kind: "date";
      /** Date key of the cell. */
      date: DateKey;
    }
  | {
      /** Discriminator for a ribbon item. */
      kind: "item";
      /** Item identifier. */
      itemId: string;
      /** Day under the pointer or focused item. */
      date: DateKey;
    }
  | {
      /** Discriminator for an annotation chip. */
      kind: "annotation";
      /** Annotation item identifier. */
      annotationId: string;
      /** Day under the pointer or focused annotation. */
      date: DateKey;
    };

/**
 * A host-owned context-menu request.
 *
 * The component never renders a menu. The host positions its own Fluent UI or
 * MUI menu, performs an action and calls `restoreFocus` when the menu closes.
 *
 * @public
 */
export interface PlannerContextMenuRequest {
  /** What was right-clicked. */
  target: PlannerContextTarget;
  /** Pointer x in viewport coordinates, or the focused element's left edge. */
  clientX: number;
  /** Pointer y in viewport coordinates, or the focused element's bottom edge. */
  clientY: number;
  /** Border box of the originating cell, item or annotation. */
  anchorRect: DOMRect;
  /** Input that raised the request. */
  source: "pointer" | "keyboard";
  /** Returns focus to the originating cell or item. */
  restoreFocus: () => void;
}

/** A DOM element that resolves to a context target. */
export interface ResolvedContextElement {
  /** The cell, proxy or annotation fragment that was targeted. */
  element: HTMLElement;
  /** Target kind without a date; the caller resolves the pointer day. */
  kind: PlannerContextTarget["kind"];
  /** Item or annotation identifier. */
  itemId?: string;
  /** Date key when the target is a date cell. */
  date?: DateKey;
}

/**
 * Resolves the planner target under an event target.
 *
 * Annotation fragments are checked before item proxies because an annotation
 * proxy is also an item proxy. Anything outside a planner cell or item returns
 * `undefined`, which leaves the browser's native menu untouched.
 *
 * @param target - Event target from a pointer or keyboard event.
 * @returns The resolved element and target kind, or `undefined` for chrome.
 */
export function resolveContextElement(
  target: EventTarget | null | undefined,
): ResolvedContextElement | undefined {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest<HTMLElement>("[data-item-id], [data-date]");
  if (!element) return undefined;
  const date = element.getAttribute("data-date");
  if (date !== null) return { element, kind: "date", date };
  const itemId = element.getAttribute("data-item-id");
  if (itemId === null) return undefined;
  if (element.closest('[data-yp-channel="annotation"]')) {
    return { element, kind: "annotation", itemId };
  }
  return { element, kind: "item", itemId };
}

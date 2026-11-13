import type { MonthRowLayout, PlannerItem, RibbonRow } from "@blendsdk/year-planner-core";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { PlannerFormatters } from "../locale.js";
import { formatPluralMessage } from "../messages.js";
import type { OverflowRenderContext } from "../types.js";

/**
 * Props for one row's overflow control.
 */
export interface OverflowProps {
  row: MonthRowLayout;
  ribbonRow: RibbonRow;
  items: ReadonlyMap<string, PlannerItem>;
  formatters: PlannerFormatters;
  displayTimeZone: string;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
  active: boolean;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
}

/**
 * Renders the per-row `+N` button and its accessible overflow list.
 *
 * The list is deduplicated by item, in first-fragment order, and never contains
 * hidden items because it is built from visible ribbon descriptors.
 */
export function Overflow({
  row,
  ribbonRow,
  items,
  formatters,
  displayTimeZone,
  renderOverflow,
  active,
  onSelectItem,
  onFocusItem,
}: OverflowProps): ReactNode {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const entries = ribbonRow.overflow;
  const visible = entries
    .map((entry) => items.get(entry.itemId))
    .filter((entry): entry is PlannerItem => entry !== undefined);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && buttonRef.current?.parentElement?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    popoverRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  if (ribbonRow.overflowCount <= 0) return null;

  const context: OverflowRenderContext = {
    row,
    hiddenCount: ribbonRow.overflowCount,
    items: visible,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper only closes the popover when focus leaves
    <div
      className="yp-overflow"
      data-yp-part="overflow"
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="yp-overflow-button"
        data-yp-part="overflow-button"
        tabIndex={active ? 0 : -1}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-haspopup="dialog"
        aria-label={formatPluralMessage(
          formatters.messages.overflowShow,
          ribbonRow.overflowCount,
          formatters.locale,
        )}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
      >
        +{ribbonRow.overflowCount}
      </button>
      {open && (
        <div
          id={popoverId}
          ref={popoverRef}
          className="yp-overflow-popover"
          data-yp-part="overflow-popover"
          role="dialog"
          aria-label={formatters.messages.overflowLabel}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
          }}
        >
          {renderOverflow ? (
            renderOverflow(context)
          ) : (
            <ul className="yp-overflow-list">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="yp-overflow-entry"
                    data-item-id={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      onFocusItem(item.id);
                      setOpen(false);
                    }}
                  >
                    <span>{item.title ?? item.id}</span>{" "}
                    <small>{formatters.formatPeriod(item.period, displayTimeZone)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

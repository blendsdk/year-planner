import type { MonthRowLayout, PlannerItem, RibbonRow } from "@blendsdk/year-planner-core";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { OverflowRenderContext } from "../types.js";

/** Props for one row's overflow control. */
export interface OverflowProps {
  row: MonthRowLayout;
  ribbonRow: RibbonRow;
  items: ReadonlyMap<string, PlannerItem>;
  renderOverflow?: ((context: OverflowRenderContext) => ReactNode) | undefined;
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
  renderOverflow,
  onSelectItem,
  onFocusItem,
}: OverflowProps): ReactNode {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  if (ribbonRow.overflowCount <= 0) return null;

  const context: OverflowRenderContext = {
    row,
    hiddenCount: ribbonRow.overflowCount,
    items: visible,
  };

  return (
    <div className="yp-overflow" data-yp-part="overflow">
      <button
        ref={buttonRef}
        type="button"
        className="yp-overflow-button"
        data-yp-part="overflow-button"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`Show ${ribbonRow.overflowCount} hidden items`}
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
          className="yp-overflow-popover"
          data-yp-part="overflow-popover"
          role="dialog"
          aria-label="Hidden items"
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
                    <span>{item.title ?? item.id}</span>
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

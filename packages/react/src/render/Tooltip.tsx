import type { PlannerItem, RibbonFragment } from "@blendsdk/year-planner-core";
import { type CSSProperties, type ReactNode, useId } from "react";
import type { PlannerFormatters } from "../locale.js";
import type { TooltipRenderContext, YearPlannerComponents } from "../types.js";

/** A tooltip target and its viewport position. */
export interface TooltipState {
  item: PlannerItem;
  fragment: RibbonFragment;
  x: number;
  y: number;
}

/** Props for the owned tooltip overlay. */
export interface TooltipProps {
  state: TooltipState;
  formatters: PlannerFormatters;
  displayTimeZone: string;
  components: YearPlannerComponents;
  renderTooltip?: ((context: TooltipRenderContext) => ReactNode) | undefined;
}

/**
 * Renders the component-owned tooltip. The surface is fixed-positioned inside
 * the root and is never created for hidden items.
 */
export function Tooltip({
  state,
  formatters,
  displayTimeZone,
  components,
  renderTooltip,
}: TooltipProps): ReactNode {
  const id = useId();
  const TooltipSlot = components.Tooltip;
  const context: TooltipRenderContext = { item: state.item, fragment: state.fragment };
  const style: CSSProperties = {
    position: "fixed",
    left: Math.max(8, state.x),
    top: Math.max(8, state.y),
    zIndex: 20,
  };
  return (
    <div id={id} className="yp-tooltip" data-yp-part="tooltip" role="tooltip" style={style}>
      {TooltipSlot ? (
        <TooltipSlot className="yp-tooltip-slot">
          {renderTooltip ? (
            renderTooltip(context)
          ) : (
            <DefaultTooltipContent
              item={state.item}
              formatters={formatters}
              displayTimeZone={displayTimeZone}
            />
          )}
        </TooltipSlot>
      ) : renderTooltip ? (
        renderTooltip(context)
      ) : (
        <DefaultTooltipContent
          item={state.item}
          formatters={formatters}
          displayTimeZone={displayTimeZone}
        />
      )}
    </div>
  );
}

function DefaultTooltipContent({
  item,
  formatters,
  displayTimeZone,
}: {
  item: PlannerItem;
  formatters: PlannerFormatters;
  displayTimeZone: string;
}): ReactNode {
  return (
    <>
      <strong className="yp-tooltip-title">{item.title ?? item.id}</strong>
      <span className="yp-tooltip-period">
        {formatters.formatPeriod(item.period, displayTimeZone)}
      </span>
    </>
  );
}

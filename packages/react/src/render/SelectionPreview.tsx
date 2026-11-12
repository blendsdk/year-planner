import type { MonthRowLayout, SelectionDateRange } from "@blendsdk/year-planner-core";
import type { CSSProperties, ReactNode } from "react";
import { projectPreviewRangesForRow } from "../interaction/preview.js";

/**
 * Preview layer variants rendered by a month row.
 * @public
 */
export type PreviewVariant = "selection" | "selection-preview" | "gesture-preview";

/**
 * Props for one row's selection or gesture preview layer.
 * @public
 */
export interface SelectionPreviewProps {
  ranges: readonly SelectionDateRange[];
  row: MonthRowLayout;
  zoom: number;
  bandWidth: number;
  totalDayWidth: number;
  height: number;
  variant: PreviewVariant;
  previewKind?: "move" | "resize" | "paint" | "erase" | "create" | undefined;
  itemId?: string | undefined;
  layerId?: string | undefined;
  color?: string | undefined;
  valid?: boolean | undefined;
}

/**
 * Renders clipped preview fragments for one month row.
 *
 * Previews are decorative and never intercept pointer events; the planner-owned
 * cells and proxies remain the hit surface.
 * @public
 */
export function SelectionPreview({
  ranges,
  row,
  zoom,
  bandWidth,
  totalDayWidth,
  height,
  variant,
  previewKind,
  itemId,
  layerId,
  color,
  valid,
}: SelectionPreviewProps): ReactNode {
  const fragments = projectPreviewRangesForRow(ranges, row, zoom);
  if (fragments.length === 0) return null;
  const style: CSSProperties = {
    left: bandWidth * zoom,
    width: totalDayWidth * zoom,
    height,
    ...(color ? ({ "--yp-preview-color": color } as CSSProperties) : {}),
  };
  return (
    <div
      className="yp-preview-layer"
      style={style}
      aria-hidden="true"
      data-yp-part={`${variant}-layer`}
    >
      {fragments.map((fragment) => (
        <div
          key={fragment.key}
          className={`yp-preview-fragment yp-preview-${variant}`}
          data-yp-part={variant}
          data-preview-kind={previewKind ?? variant}
          data-preview-start={fragment.startDate}
          data-preview-end={fragment.endDateExclusive}
          data-preview-valid={valid === false ? "false" : undefined}
          data-item-id={itemId}
          data-yp-layer={layerId}
          style={{
            left: fragment.x,
            width: fragment.width,
            height,
          }}
        />
      ))}
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";

/** Props for the screen-space marquee rectangle. */
export interface MarqueeProps {
  rect: { left: number; top: number; width: number; height: number };
  zoom: number;
  bandWidth: number;
  headerHeight: number;
}

/**
 * Renders the marquee as an absolutely positioned overlay inside the grid.
 *
 * The grid is the scroll content, so the rectangle follows scrolling without a
 * portal or fixed-position conversion.
 */
export function Marquee({ rect, zoom, bandWidth, headerHeight }: MarqueeProps): ReactNode {
  const style: CSSProperties = {
    left: (rect.left + bandWidth) * zoom,
    top: headerHeight + rect.top * zoom,
    width: rect.width * zoom,
    height: rect.height * zoom,
  };
  return <div className="yp-marquee" data-yp-part="marquee" aria-hidden="true" style={style} />;
}

import { renderVariant } from "../render";

/** SVG cell and ribbon shapes with HTML month labels and item proxies. */
export default function renderSvgShapes(): void {
  renderVariant({
    id: "svg-shapes",
    label: "SVG shapes + HTML proxies",
    description:
      "SVG cells, date text and ribbons; HTML month bands and transparent HTML item proxies.",
    cellLayer: "svg",
    ribbonLayer: "svg",
    proxyLayer: "overlay",
    connectors: true,
  });
}

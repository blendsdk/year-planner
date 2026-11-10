import { renderVariant } from "../render";

/** Hybrid with an SVG ribbon/connector plane behind transparent HTML proxies. */
export default function renderHtmlSvg(): void {
  renderVariant({
    id: "html-svg",
    label: "HTML + SVG shape plane",
    description:
      "HTML cells and date text, SVG ribbons and cross-row connectors, transparent HTML item proxies.",
    cellLayer: "html",
    ribbonLayer: "svg",
    proxyLayer: "overlay",
    connectors: true,
  });
}

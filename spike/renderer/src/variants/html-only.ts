import { renderVariant } from "../render";

/** Baseline: every shape, label and proxy is an HTML element. */
export default function renderHtmlOnly(): void {
  renderVariant({
    id: "html-only",
    label: "HTML-only",
    description:
      "CSS-positioned cells and ribbon buttons. Baseline for continuity, print and keyboard.",
    cellLayer: "html",
    ribbonLayer: "html",
    proxyLayer: "native",
    connectors: false,
  });
}

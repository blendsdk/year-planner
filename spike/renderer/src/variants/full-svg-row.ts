import { renderVariant } from "../render";

/** One month row rendered entirely in SVG to expose focus and content limits. */
export default function renderFullSvgRow(): void {
  renderVariant({
    id: "full-svg-row",
    label: "Limited full-SVG row",
    description:
      "February 2027 is entirely SVG (bands, cells, date text, ribbon); all other rows are HTML.",
    cellLayer: "html",
    ribbonLayer: "svg",
    proxyLayer: "overlay",
    connectors: true,
    fullSvgRowId: "2027-02",
  });
}

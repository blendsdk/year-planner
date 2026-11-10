import { addDays, type MonthRowLayout } from "@blendsdk/year-planner-core";
import {
  accessibleDate,
  BAND_WIDTH,
  buildFragments,
  buildSpikeLayout,
  canvasHeight,
  canvasWidth,
  DAY_COLUMNS,
  HEADER_HEIGHT,
  monthLabel,
  ROW_HEIGHT,
  SPIKE_ITEMS,
  type SpikeFragment,
  weekLabel,
} from "./grid";

/** Rendering strategy compared by the spike. */
export interface VariantConfig {
  id: string;
  label: string;
  description: string;
  cellLayer: "html" | "svg";
  ribbonLayer: "html" | "svg";
  proxyLayer: "native" | "overlay";
  connectors: boolean;
  fullSvgRowId?: string;
}

const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, String(value));
  }
  return node;
}

function style(node: HTMLElement | SVGElement, values: Record<string, string | number>): void {
  for (const [name, value] of Object.entries(values)) {
    node.style.setProperty(name, typeof value === "number" ? `${value}px` : value);
  }
}

function ribbonPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  roundStart: boolean,
  roundEnd: boolean,
): string {
  const start = roundStart ? Math.min(radius, width / 2) : 0;
  const end = roundEnd ? Math.min(radius, width / 2) : 0;
  return [
    `M ${x + start} ${y}`,
    `H ${x + width - end}`,
    `Q ${x + width} ${y} ${x + width} ${y + end}`,
    `V ${y + height - end}`,
    `Q ${x + width} ${y + height} ${x + width - end} ${y + height}`,
    `H ${x + start}`,
    `Q ${x} ${y + height} ${x} ${y + height - start}`,
    `V ${y + start}`,
    `Q ${x} ${y} ${x + start} ${y}`,
    "Z",
  ].join(" ");
}

function renderToolbar(config: VariantConfig): HTMLElement {
  const toolbar = element("div", "spike-toolbar");
  const title = element("h1");
  title.textContent = config.label;
  const description = element("span");
  description.textContent = config.description;
  toolbar.append(title, description);
  const legend = element("div", "spike-legend");
  for (const item of SPIKE_ITEMS.slice(0, 4)) {
    const chip = element("span", "spike-chip");
    chip.style.background = item.color;
    chip.textContent = item.title;
    legend.append(chip);
  }
  toolbar.append(legend);
  return toolbar;
}

function renderWeekHeader(layout: ReturnType<typeof buildSpikeLayout>): HTMLElement {
  const header = element("div", "spike-header");
  style(header, { height: HEADER_HEIGHT });
  const firstRow = layout.rows[0];
  if (!firstRow) throw new Error("layout has no rows");
  for (let index = 0; index < DAY_COLUMNS; index += 1) {
    const heading = element("div", "spike-heading");
    const column = firstRow.columns[index];
    if (!column) continue;
    style(heading, {
      left: BAND_WIDTH + (firstRow.prefixWidths[index] as number),
      width: column.width,
      height: HEADER_HEIGHT,
    });
    heading.textContent = WEEKDAYS[index % 7] ?? "";
    header.append(heading);
  }
  const leftBand = element("div", "spike-band spike-header-band");
  style(leftBand, { left: 0, width: BAND_WIDTH, height: HEADER_HEIGHT });
  const rightBand = element("div", "spike-band spike-header-band");
  style(rightBand, {
    left: BAND_WIDTH + layout.totalDayWidth,
    width: BAND_WIDTH,
    height: HEADER_HEIGHT,
  });
  header.append(leftBand, rightBand);
  return header;
}

function renderBand(
  row: MonthRowLayout,
  side: "left" | "right",
  layout: ReturnType<typeof buildSpikeLayout>,
): HTMLElement {
  const band = element("div", `spike-band spike-month-band spike-${row.kind}`);
  style(band, {
    left: side === "left" ? 0 : BAND_WIDTH + layout.totalDayWidth,
    width: BAND_WIDTH,
    height: ROW_HEIGHT,
  });
  const label = element("span");
  label.textContent = monthLabel(row);
  band.append(label);
  band.dataset.part = "month-band";
  band.setAttribute("role", "presentation");
  return band;
}

function renderHtmlCells(row: MonthRowLayout, firstFocusDate: string): HTMLElement {
  const layer = element("div", "spike-cell-layer");
  layer.setAttribute("role", "presentation");
  style(layer, { left: BAND_WIDTH, width: row.prefixWidths[DAY_COLUMNS] ?? 0, height: ROW_HEIGHT });
  for (const column of row.columns) {
    const cell = element("div", "spike-cell");
    style(cell, {
      left: column.x,
      width: column.width,
      height: ROW_HEIGHT,
    });
    if (column.isWeekend) cell.classList.add("spike-weekend");
    if (column.isContextMonth) cell.classList.add("spike-context");
    if (!column.date) {
      cell.classList.add("spike-blank");
      cell.setAttribute("aria-hidden", "true");
    } else {
      cell.dataset.date = column.date;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", accessibleDate(column.date));
      cell.tabIndex = column.date === firstFocusDate ? 0 : -1;
      const day = element("span", "spike-day-number");
      day.textContent = String(Number(column.date.slice(8, 10)));
      cell.append(day);
      const dayOfMonth = Number(column.date.slice(8, 10));
      if (dayOfMonth === 1 || column.columnIndex % 7 === 2) {
        const week = element("span", "spike-week-number");
        week.dataset.week = weekLabel(column.date);
        week.setAttribute("aria-hidden", "true");
        cell.append(week);
      }
    }
    layer.append(cell);
  }
  return layer;
}

function renderSvgCells(row: MonthRowLayout, firstFocusDate: string): SVGSVGElement {
  const plane = svg("svg", {
    class: "spike-cell-plane",
    width: row.prefixWidths[DAY_COLUMNS] ?? 0,
    height: ROW_HEIGHT,
    viewBox: `0 0 ${row.prefixWidths[DAY_COLUMNS] ?? 0} ${ROW_HEIGHT}`,
  });
  plane.setAttribute("role", "presentation");
  style(plane, {
    left: BAND_WIDTH,
    width: row.prefixWidths[DAY_COLUMNS] ?? 0,
    height: ROW_HEIGHT,
  });
  for (const column of row.columns) {
    const rect = svg("rect", {
      x: column.x,
      y: 0,
      width: column.width,
      height: ROW_HEIGHT,
      class: [
        "spike-cell-rect",
        column.isWeekend ? "spike-weekend" : "",
        column.isContextMonth ? "spike-context" : "",
        column.date ? "" : "spike-blank",
      ]
        .filter(Boolean)
        .join(" "),
    });
    if (!column.date) {
      rect.setAttribute("aria-hidden", "true");
    } else {
      rect.dataset.date = column.date;
      rect.setAttribute("role", "gridcell");
      rect.setAttribute("aria-label", accessibleDate(column.date));
      rect.setAttribute("tabindex", column.date === firstFocusDate ? "0" : "-1");
      const day = svg("text", {
        x: column.x + column.width - 6,
        y: 14,
        "text-anchor": "end",
        class: "spike-svg-day",
      });
      day.textContent = String(Number(column.date.slice(8, 10)));
      plane.append(day);
      const dayOfMonth = Number(column.date.slice(8, 10));
      if (dayOfMonth === 1 || column.columnIndex % 7 === 2) {
        const week = svg("text", {
          x: column.x + 5,
          y: ROW_HEIGHT - 6,
          class: "spike-svg-week",
        });
        week.textContent = weekLabel(column.date);
        week.setAttribute("aria-hidden", "true");
        plane.append(week);
      }
    }
    plane.append(rect);
  }
  return plane;
}

function renderHtmlRibbon(fragment: SpikeFragment, index: number): HTMLButtonElement {
  const button = element("button", "spike-ribbon");
  const radiusStart = fragment.isStartClipped ? 0 : 6;
  const radiusEnd = fragment.isEndClipped ? 0 : 6;
  style(button, {
    left: BAND_WIDTH + fragment.x,
    top: fragment.rowIndex * ROW_HEIGHT + fragment.topInRow,
    width: fragment.width,
    height: fragment.height,
    background: fragment.item.color,
    color: fragment.item.textColor,
    borderRadius: `${radiusStart}px ${radiusEnd}px ${radiusEnd}px ${radiusStart}px`,
  });
  button.type = "button";
  button.dataset.ribbon = "";
  button.dataset.itemId = fragment.item.id;
  button.dataset.fragmentIndex = String(index);
  button.dataset.rowId = fragment.row.rowId;
  button.dataset.start = fragment.clippedStart;
  button.dataset.end = fragment.clippedEndExclusive;
  button.dataset.lastDate = addDays(fragment.clippedEndExclusive, -1);
  button.setAttribute(
    "aria-label",
    `${fragment.item.title}: ${fragment.clippedStart} to ${fragment.clippedEndExclusive}`,
  );
  if (fragment.width > 70) {
    const label = element("span");
    label.textContent = fragment.item.title;
    button.append(label);
  }
  return button;
}

function buildSvgShapePlane(
  layout: ReturnType<typeof buildSpikeLayout>,
  fragments: SpikeFragment[],
  connectors: boolean,
  skipRowId?: string,
): SVGSVGElement {
  const plane = svg("svg", {
    class: "spike-shape-plane",
    width: canvasWidth(layout),
    height: layout.bodyHeight,
    viewBox: `0 0 ${canvasWidth(layout)} ${layout.bodyHeight}`,
  });
  plane.setAttribute("aria-hidden", "true");
  plane.setAttribute("focusable", "false");
  for (const [index, fragment] of fragments.entries()) {
    if (fragment.row.rowId === skipRowId) continue;
    const x = BAND_WIDTH + fragment.x;
    const y = fragment.rowIndex * ROW_HEIGHT + fragment.topInRow;
    const shape = svg("path", {
      d: ribbonPath(
        x,
        y,
        fragment.width,
        fragment.height,
        6,
        !fragment.isStartClipped,
        !fragment.isEndClipped,
      ),
      fill: fragment.item.color,
      class: "spike-ribbon-shape",
    });
    shape.dataset.ribbon = "";
    shape.dataset.itemId = fragment.item.id;
    shape.dataset.fragmentIndex = String(index);
    shape.dataset.rowId = fragment.row.rowId;
    shape.dataset.start = fragment.clippedStart;
    shape.dataset.end = fragment.clippedEndExclusive;
    shape.dataset.lastDate = addDays(fragment.clippedEndExclusive, -1);
    plane.append(shape);
  }
  if (connectors) {
    for (const item of SPIKE_ITEMS) {
      const itemFragments = fragments
        .filter((fragment) => fragment.item.id === item.id)
        .sort((a, b) => a.rowIndex - b.rowIndex);
      for (let index = 1; index < itemFragments.length; index += 1) {
        const previous = itemFragments[index - 1];
        const next = itemFragments[index];
        if (!previous || !next) continue;
        if (previous.row.rowId === skipRowId || next.row.rowId === skipRowId) continue;
        const startX = BAND_WIDTH + previous.x + previous.width;
        const startY = previous.rowIndex * ROW_HEIGHT + previous.topInRow + previous.height;
        const endX = BAND_WIDTH + next.x;
        const endY = next.rowIndex * ROW_HEIGHT + next.topInRow;
        if (Math.abs(endX - startX) > 120) continue;
        const path = svg("path", {
          d: `M ${startX} ${startY} C ${startX} ${startY + 10}, ${endX} ${endY - 10}, ${endX} ${endY}`,
          fill: "none",
          stroke: item.color,
          "stroke-width": 2,
          class: "spike-connector",
        });
        plane.append(path);
      }
    }
  }
  return plane;
}

function renderOverlayProxies(fragments: SpikeFragment[], skipRowId?: string): HTMLButtonElement[] {
  return fragments
    .filter((fragment) => fragment.row.rowId !== skipRowId)
    .map((fragment, index) => {
      const proxy = element("button", "spike-proxy");
      style(proxy, {
        left: BAND_WIDTH + fragment.x,
        top: fragment.rowIndex * ROW_HEIGHT + fragment.topInRow,
        width: fragment.width,
        height: fragment.height,
      });
      proxy.type = "button";
      proxy.dataset.proxyItem = "";
      proxy.dataset.itemId = fragment.item.id;
      proxy.dataset.fragmentIndex = String(index);
      proxy.dataset.rowId = fragment.row.rowId;
      proxy.dataset.start = fragment.clippedStart;
      proxy.dataset.end = fragment.clippedEndExclusive;
      proxy.dataset.lastDate = addDays(fragment.clippedEndExclusive, -1);
      proxy.setAttribute(
        "aria-label",
        `${fragment.item.title}: ${fragment.item.startDate} to ${fragment.item.endDateExclusive}`,
      );
      return proxy;
    });
}

function renderFullSvgRow(
  layout: ReturnType<typeof buildSpikeLayout>,
  row: MonthRowLayout,
  rowFragments: SpikeFragment[],
  firstFocusDate: string,
): SVGSVGElement {
  const width = canvasWidth(layout);
  const plane = svg("svg", {
    class: "spike-full-row-svg",
    width,
    height: ROW_HEIGHT,
    viewBox: `0 0 ${width} ${ROW_HEIGHT}`,
  });
  plane.setAttribute("role", "presentation");
  const leftBand = svg("rect", {
    x: 0,
    y: 0,
    width: BAND_WIDTH,
    height: ROW_HEIGHT,
    class: "spike-svg-band",
  });
  const rightBand = svg("rect", {
    x: BAND_WIDTH + layout.totalDayWidth,
    y: 0,
    width: BAND_WIDTH,
    height: ROW_HEIGHT,
    class: "spike-svg-band",
  });
  plane.append(leftBand, rightBand);
  const leftLabel = svg("text", { x: 12, y: 40, class: "spike-svg-month" });
  leftLabel.textContent = monthLabel(row);
  const rightLabel = svg("text", {
    x: BAND_WIDTH + layout.totalDayWidth + 12,
    y: 40,
    class: "spike-svg-month",
  });
  rightLabel.textContent = monthLabel(row);
  plane.append(leftLabel, rightLabel);
  for (const column of row.columns) {
    const rect = svg("rect", {
      x: BAND_WIDTH + column.x,
      y: 0,
      width: column.width,
      height: ROW_HEIGHT,
      class: [
        "spike-cell-rect",
        column.isWeekend ? "spike-weekend" : "",
        column.isContextMonth ? "spike-context" : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
    if (!column.date) {
      rect.setAttribute("aria-hidden", "true");
    } else {
      rect.dataset.date = column.date;
      rect.setAttribute("role", "gridcell");
      rect.setAttribute("aria-label", accessibleDate(column.date));
      rect.setAttribute("tabindex", column.date === firstFocusDate ? "0" : "-1");
      const day = svg("text", {
        x: BAND_WIDTH + column.x + column.width - 6,
        y: 14,
        "text-anchor": "end",
        class: "spike-svg-day",
      });
      day.textContent = String(Number(column.date.slice(8, 10)));
      plane.append(day);
    }
    plane.append(rect);
  }
  for (const fragment of rowFragments) {
    const shape = svg("path", {
      d: ribbonPath(
        BAND_WIDTH + fragment.x,
        fragment.topInRow,
        fragment.width,
        fragment.height,
        6,
        !fragment.isStartClipped,
        !fragment.isEndClipped,
      ),
      fill: fragment.item.color,
      class: "spike-ribbon-shape",
    });
    shape.dataset.ribbon = "";
    shape.dataset.itemId = fragment.item.id;
    shape.dataset.rowId = row.rowId;
    shape.dataset.start = fragment.clippedStart;
    shape.dataset.end = fragment.clippedEndExclusive;
    shape.dataset.lastDate = addDays(fragment.clippedEndExclusive, -1);
    plane.append(shape);
  }
  const february = layout.rows.find((row) => row.rowId === "2027-02");
  if (february) {
    const startColumn = february.firstColumn + 7;
    const endColumnExclusive = february.firstColumn + 20;
    const x = BAND_WIDTH + (february.prefixWidths[startColumn] as number);
    const width =
      (february.prefixWidths[endColumnExclusive] as number) -
      (february.prefixWidths[startColumn] as number);
    const selection = svg("rect", {
      x,
      y: february.rowIndex * ROW_HEIGHT + 4,
      width,
      height: ROW_HEIGHT - 8,
      rx: 4,
      class: "spike-selection",
    });
    plane.append(selection);
  }
  return plane;
}

/** Renders one variant into `#app` and wires date focus navigation. */
export function renderVariant(config: VariantConfig): void {
  const app = document.getElementById("app");
  if (!app) throw new Error("missing #app");
  const layout = buildSpikeLayout();
  const fragments = buildFragments(layout);
  const firstFocusDate = layout.rows[0]?.columns.find((column) => column.date)?.date ?? "";
  app.innerHTML = "";
  const shell = element("div", "spike-shell");
  shell.dataset.variant = config.id;
  shell.setAttribute("role", "main");
  shell.append(renderToolbar(config));
  const canvas = element("div", "spike-canvas");
  style(canvas, { width: canvasWidth(layout), height: canvasHeight(layout) });
  canvas.append(renderWeekHeader(layout));

  const body = element("div", "spike-body");
  style(body, { height: layout.bodyHeight });
  body.setAttribute("role", "grid");
  body.setAttribute("aria-label", "Year planner renderer spike");
  body.setAttribute("aria-rowcount", String(layout.rows.length));
  body.setAttribute("aria-colcount", String(DAY_COLUMNS));

  for (const row of layout.rows) {
    const rowElement = element("div", "spike-row");
    rowElement.dataset.rowId = row.rowId;
    rowElement.setAttribute("role", "row");
    style(rowElement, {
      top: row.rowIndex * ROW_HEIGHT,
      height: ROW_HEIGHT,
      width: canvasWidth(layout),
    });
    if (config.fullSvgRowId === row.rowId) {
      rowElement.append(
        renderFullSvgRow(
          layout,
          row,
          fragments.filter((fragment) => fragment.row.rowId === row.rowId),
          firstFocusDate,
        ),
      );
    } else {
      rowElement.append(renderBand(row, "left", layout));
      rowElement.append(
        config.cellLayer === "html"
          ? renderHtmlCells(row, firstFocusDate)
          : renderSvgCells(row, firstFocusDate),
      );
      rowElement.append(renderBand(row, "right", layout));
    }
    body.append(rowElement);
  }

  if (config.ribbonLayer === "svg") {
    body.append(buildSvgShapePlane(layout, fragments, config.connectors, config.fullSvgRowId));
  }

  const overlay = element("div", "spike-item-overlay");
  overlay.setAttribute("role", "presentation");
  style(overlay, { top: HEADER_HEIGHT, height: layout.bodyHeight });
  if (config.ribbonLayer === "html") {
    for (const [index, fragment] of fragments.entries()) {
      overlay.append(renderHtmlRibbon(fragment, index));
    }
  }
  if (config.proxyLayer === "overlay") {
    for (const proxy of renderOverlayProxies(fragments)) {
      overlay.append(proxy);
    }
  }

  canvas.append(body);
  canvas.append(overlay);
  const footer = renderWeekHeader(layout);
  footer.classList.add("spike-footer");
  canvas.append(footer);
  shell.append(canvas);
  app.append(shell);

  shell.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement || target instanceof SVGElement)) return;
    const date = target.getAttribute("data-date");
    if (!date) return;
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = addDays(date, delta);
    const nextCell = shell.querySelector<HTMLElement | SVGElement>(`[data-date="${next}"]`);
    nextCell?.focus();
  });

  document.title = `Renderer spike — ${config.label}`;
  (window as Window & { __spikeReady?: boolean }).__spikeReady = true;
}

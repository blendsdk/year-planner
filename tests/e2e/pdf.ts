import { execFileSync } from "node:child_process";
import { expect } from "@playwright/test";

/** Page count and page size read from one generated PDF. */
export interface PdfInfo {
  pages: number;
  pageSize: string;
}

/** A3 landscape dimensions in PostScript points, as `pdfinfo` reports them. */
export const A3_LANDSCAPE_POINTS = "1191.12 x 842.88 pts";

/** Reads page count and page size from a PDF with `pdfinfo`. */
export function readPdfInfo(path: string): PdfInfo {
  const output = execFileSync("pdfinfo", [path], { encoding: "utf8" });
  return {
    pages: Number(/^Pages:\s+(\d+)$/m.exec(output)?.[1] ?? "0"),
    pageSize: /^Page size:\s+(.+)$/m.exec(output)?.[1]?.trim() ?? "",
  };
}

/** Extracts the layout-preserving text of a PDF with `pdftotext`. */
export function readPdfText(path: string): string {
  return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
}

/** Asserts the page count and A3 landscape page size of one PDF. */
export function expectA3Pdf(path: string, expectedPages: number): PdfInfo {
  const info = readPdfInfo(path);
  expect(info.pages, `${path} page count`).toBe(expectedPages);
  expect(info.pageSize, `${path} page size`).toContain(A3_LANDSCAPE_POINTS);
  return info;
}

/**
 * Asserts that every print row sits inside its page content box.
 *
 * A page count alone can hide clipped content; this checks the geometry of the
 * generated print tree before the PDF is written.
 */
export async function expectRowsInsidePages(page: import("@playwright/test").Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const problems: string[] = [];
    for (const [index, pageNode] of Array.from(
      document.querySelectorAll('[data-yp-part="print-page"]'),
    ).entries()) {
      const pageBox = pageNode.getBoundingClientRect();
      for (const row of Array.from(pageNode.querySelectorAll("[data-print-row-id]"))) {
        const box = row.getBoundingClientRect();
        if (
          box.bottom > pageBox.bottom + 1 ||
          box.top < pageBox.top - 1 ||
          box.left < pageBox.left - 1 ||
          box.right > pageBox.right + 1
        ) {
          problems.push(`${row.getAttribute("data-print-row-id")} on page ${index + 1}`);
        }
      }
    }
    return problems;
  });
  expect(overflow).toEqual([]);
}

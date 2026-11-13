import { type RefObject, useEffect, useState } from "react";

/**
 * Measured host region used by the fit calculation.
 */
export interface HostSize {
  /** Host width in CSS pixels. */
  width: number;
  /** Host height in CSS pixels. */
  height: number;
}

/** Returns the element whose box bounds the planner. */
function hostElement(root: HTMLElement): HTMLElement {
  const parent = root.parentElement;
  if (!parent || parent === document.body || parent === document.documentElement) {
    return document.documentElement;
  }
  return parent;
}

/**
 * Measures the host region around the planner root.
 *
 * The component root is content-sized, so it cannot be observed for height.
 * The hook observes the nearest parent element and falls back to the viewport
 * when the planner sits directly in the page. A zero-size observation (a hidden
 * tab, for example) keeps the previous geometry instead of collapsing the grid.
 *
 * @param rootRef - Ref to the planner root element.
 * @param enabled - False disables observation and returns `undefined`.
 * @returns The last valid host size, or `undefined` before the first measure.
 */
export function useHostSize(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): HostSize | undefined {
  const [size, setSize] = useState<HostSize>();

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    const host = hostElement(root);
    let frame = 0;

    const measure = (): void => {
      // A zero-size box means the host is hidden or has no layout (a headless
      // DOM, a closed tab). Keep the previous geometry instead of guessing.
      const viewportHost = host === document.documentElement;
      const rect = viewportHost ? undefined : host.getBoundingClientRect();
      const width = rect ? rect.width : window.innerWidth;
      const height = rect ? rect.height : window.innerHeight;
      if (!(width > 0) || !(height > 0)) return;
      setSize((previous) =>
        previous &&
        Math.abs(previous.width - width) < 0.5 &&
        Math.abs(previous.height - height) < 0.5
          ? previous
          : { width, height },
      );
    };

    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    // The first measurement is synchronous so the fit applies before the next
    // paint; later ResizeObserver callbacks are debounced to one frame.
    measure();
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    observer?.observe(host);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, rootRef]);

  return size;
}

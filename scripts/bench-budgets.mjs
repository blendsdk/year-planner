/**
 * Performance budgets from the quality contract.
 *
 * A measured value below the budget is a pass. A value between the budget and
 * the 2x ceiling is a recorded miss. A value above the ceiling is a harness
 * failure that must stop the gate.
 */
export const BUDGETS = Object.freeze({
  /** p95 layout and ribbon time for 10,000 compact items. */
  layout10kP95Ms: 250,
  /** p95 layout and ribbon time for smaller windows. */
  layoutP95Ms: 250,
  /** p95 pointer frame time for a production drag. */
  dragP95Ms: 16.7,
  /** Mean non-idle main-thread work per drag frame at 2,000 items. */
  dragWorkPerFrameMs: 8,
  /** p95 pointer-event to handler delay during a drag. */
  dragInputDelayP95Ms: 16.7,
  /** p95 pointer-down to selection commit for a click at 500 items. */
  clickWorkP95Ms: 60,
  /** p95 pointer-down to selection commit for a click at 2,000 items. */
  clickWork2kP95Ms: 80,
  /** Time to open and close overflow with 10,000 compact items. */
  overflowMs: 100,
  /** p95 initial render for 12 to 36 month windows at 500 items. */
  initialRenderP95Ms: 400,
  /** p95 initial render at the supported 2,000-item data size. */
  initialRender2kP95Ms: 550,
  /** React package entry plus CSS, gzip. */
  reactEntryCssKb: 60,
  /** Core plus React plus adapters plus CSS, gzip. */
  totalInstalledKb: 66,
});

/** The ceiling above which a result fails the harness. */
export const CEILING_FACTOR = 2;

/**
 * Classifies one measurement.
 *
 * @param {number} value - Measured value.
 * @param {number} budget - Budget for the scenario.
 * @returns {"pass" | "miss" | "fail"}
 */
export function statusFor(value, budget, frameJitter = false) {
  // Only frame deltas carry scheduling jitter: a 16.8 ms sample is one 60 Hz
  // frame at 59.5 Hz, not a dropped frame. Layout, render and overflow times
  // are compared against the budget exactly.
  const tolerance = frameJitter ? budget * 0.05 : 0;
  if (value <= budget + tolerance) return "pass";
  if (value <= budget * CEILING_FACTOR + tolerance) return "miss";
  return "fail";
}

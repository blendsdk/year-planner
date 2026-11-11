/** Performance budgets from the quality contract. */
export const BUDGETS: Readonly<{
  layout10kP95Ms: number;
  dragP95Ms: number;
  overflowMs: number;
  initialRenderP95Ms: number;
  reactEntryCssKb: number;
  totalInstalledKb: number;
}>;

/** The ceiling above which a result fails the harness. */
export const CEILING_FACTOR: number;

/** Classifies one measurement against a budget. */
export function statusFor(value: number, budget: number): "pass" | "miss" | "fail";

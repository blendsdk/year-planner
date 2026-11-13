/** Performance budgets from the quality contract. */
export const BUDGETS: Readonly<{
  layout10kP95Ms: number;
  layoutP95Ms: number;
  dragP95Ms: number;
  dragWorkPerFrameMs: number;
  dragInputDelayP95Ms: number;
  clickWorkP95Ms: number;
  clickWork2kP95Ms: number;
  overflowMs: number;
  initialRenderP95Ms: number;
  initialRender2kP95Ms: number;
  reactEntryCssKb: number;
  totalInstalledKb: number;
  languagesEntryKb: number;
  languagesCataloguesKb: number;
  languagePackKb: number;
}>;

/** The ceiling above which a result fails the harness. */
export const CEILING_FACTOR: number;

/** Classifies one measurement against a budget. */
export function statusFor(
  value: number,
  budget: number,
  frameJitter?: boolean,
): "pass" | "miss" | "fail";

import { type PlannerItem, validatePlannerData } from "@blendsdk/year-planner-core";
import { LAYERS, SEED_ITEMS, STORAGE_KEY } from "./seed";

/** Result of loading the demo plan from browser storage. */
export interface DemoLoad {
  /** Items to render. */
  items: PlannerItem[];
  /** Last save time from the stored payload. */
  savedAt?: string;
  /** True when the items came from localStorage rather than the seed. */
  found: boolean;
}

/** Checks for a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Structural guard for a stored planner item.
 *
 * The full validation runs afterwards in `validatePlannerData`; this guard only
 * rejects values that cannot be an item at all.
 */
function isStoredItem(value: unknown): value is PlannerItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.layerId === "string" &&
    typeof value.version === "number" &&
    typeof value.kind === "string" &&
    isRecord(value.period)
  );
}

/** Stored payload shape. */
interface StoredPlan {
  version: 1;
  items: unknown[];
  savedAt?: string;
}

/** Checks the stored payload envelope. */
function isStoredPlan(value: unknown): value is StoredPlan {
  if (!isRecord(value)) return false;
  return value.version === 1 && Array.isArray(value.items);
}

/**
 * Loads the saved construction plan.
 *
 * A missing payload, an old version or an invalid item list falls back to the
 * seed plan. An intentionally empty list stays empty so "delete everything"
 * survives a reload.
 */
export function loadDemo(): DemoLoad {
  if (typeof window === "undefined") return { items: SEED_ITEMS, found: false };
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { items: SEED_ITEMS, found: false };
  }
  if (!raw) return { items: SEED_ITEMS, found: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredPlan(parsed)) return { items: SEED_ITEMS, found: false };
    const candidates = parsed.items.filter(isStoredItem);
    const validation = validatePlannerData({ items: candidates, layers: LAYERS });
    if (validation.model.items.length === 0 && parsed.items.length > 0) {
      return { items: SEED_ITEMS, found: false };
    }
    return {
      items: validation.model.items,
      found: true,
      ...(typeof parsed.savedAt === "string" ? { savedAt: parsed.savedAt } : {}),
    };
  } catch {
    return { items: SEED_ITEMS, found: false };
  }
}

/**
 * Saves the plan to localStorage.
 *
 * @returns False when storage is unavailable or full; the demo stays usable.
 */
export function saveDemo(items: PlannerItem[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, items, savedAt: new Date().toISOString() }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Removes the saved plan; the next mount uses the seed data. */
export function clearDemo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be disabled; the in-memory plan remains usable.
  }
}

import {
  createInitialVisibility,
  type InteractionMode,
  type PlannerDataValidation,
  type PlannerFilter,
  type PlannerItem,
  type PlannerModel,
  type PlannerSelection,
  type VisibilityAction,
  type VisibilityState,
  validatePlannerData,
  visibilityReducer,
} from "@blendsdk/year-planner-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InteractionConfig } from "./types.js";

const EMPTY_SELECTION: PlannerSelection = { dates: [], items: [] };

function isProductionBuild(): boolean {
  const candidate = (globalThis as { process?: unknown }).process;
  if (!candidate || typeof candidate !== "object") return false;
  const env = (candidate as { env?: unknown }).env;
  if (!env || typeof env !== "object") return false;
  return (env as { NODE_ENV?: unknown }).NODE_ENV === "production";
}

function useDevWarning(active: boolean, message: string): void {
  const warned = useRef(false);
  useEffect(() => {
    if (!active || warned.current || isProductionBuild()) return;
    warned.current = true;
    console.warn(message);
  }, [active, message]);
}

interface ControllableOptions<T> {
  controlled: T | undefined;
  defaultValue: T;
  onChange?: ((next: T) => void) | undefined;
  warning?: string | undefined;
}

function useControllable<T>({
  controlled,
  defaultValue,
  onChange,
  warning,
}: ControllableOptions<T>): [T, (next: T) => void] {
  const [local, setLocal] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  useDevWarning(Boolean(warning && isControlled), warning ?? "");
  const value = isControlled ? controlled : local;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setLocal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, setValue];
}

/**
 * Inputs consumed by the planner state hook.
 * @public
 */
export interface PlannerStateInput {
  items?: PlannerItem[];
  defaultItems?: PlannerItem[];
  onItemsChange?: (items: PlannerItem[]) => void;
  groups?: PlannerModel["groups"];
  layers?: PlannerModel["layers"];
  resources?: PlannerModel["resources"];
  annotations?: PlannerItem[];
  visibility?: VisibilityState;
  defaultVisibility?: VisibilityState;
  onVisibilityChange?: (next: VisibilityState) => void;
  selection?: PlannerSelection;
  defaultSelection?: PlannerSelection;
  onSelectionChange?: (next: PlannerSelection) => void;
  filter?: PlannerFilter;
  defaultFilter?: PlannerFilter;
  onFilterChange?: (next: PlannerFilter) => void;
  interaction?: InteractionConfig;
  displayTimeZone?: string;
}

/**
 * State exposed to the view and command pipeline.
 * @public
 */
export interface PlannerState {
  items: PlannerItem[];
  model: PlannerModel;
  validation: PlannerDataValidation;
  itemsControlled: boolean;
  visibility: VisibilityState;
  setVisibility: (next: VisibilityState) => void;
  dispatchVisibility: (action: VisibilityAction) => void;
  showAll: () => void;
  selection: PlannerSelection;
  setSelection: (next: PlannerSelection) => void;
  filter: PlannerFilter;
  setFilter: (next: PlannerFilter) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  /** Applies items only in uncontrolled mode; returns whether it applied. */
  applyLocalItems: (next: PlannerItem[] | ((previous: PlannerItem[]) => PlannerItem[])) => boolean;
}

function initialVisibility(
  model: PlannerModel,
  preset: VisibilityState | undefined,
): VisibilityState {
  const options = {
    ...(preset?.hiddenGroupIds ? { hideGroupIds: preset.hiddenGroupIds } : {}),
    ...(preset?.hiddenLayerIds ? { hideLayerIds: preset.hiddenLayerIds } : {}),
    ...(preset?.hiddenItemIds ? { hideItemIds: preset.hiddenItemIds } : {}),
    ...(preset?.hiddenChannels ? { hideChannels: preset.hiddenChannels } : {}),
  };
  return createInitialVisibility(model, options);
}

/**
 * Resolves validated model data and controllable view state.
 *
 * Controlled props always win; defaults are used only in uncontrolled mode.
 * Invalid entities are dropped by `validatePlannerData` and never blank the view.
 * @public
 */
export function usePlannerState(input: PlannerStateInput): PlannerState {
  const itemsControlled = input.items !== undefined;
  const [localItems, setLocalItems] = useState<PlannerItem[]>(input.defaultItems ?? []);
  useDevWarning(
    itemsControlled && input.defaultItems !== undefined,
    "YearPlanner: `items` is controlled; `defaultItems` is ignored.",
  );
  const items = itemsControlled ? (input.items as PlannerItem[]) : localItems;

  const validation = useMemo(
    () =>
      validatePlannerData(
        {
          items,
          ...(input.groups ? { groups: input.groups } : {}),
          ...(input.layers ? { layers: input.layers } : {}),
          ...(input.resources ? { resources: input.resources } : {}),
          ...(input.annotations ? { annotations: input.annotations } : {}),
        },
        { displayTimeZone: input.displayTimeZone ?? "UTC" },
      ),
    [items, input.groups, input.layers, input.resources, input.annotations, input.displayTimeZone],
  );
  const model = validation.model;

  const [visibility, setVisibility] = useControllable({
    controlled: input.visibility,
    defaultValue: initialVisibility(model, input.defaultVisibility),
    onChange: input.onVisibilityChange,
    warning:
      input.visibility && input.defaultVisibility
        ? "YearPlanner: `visibility` is controlled; `defaultVisibility` is ignored."
        : undefined,
  });

  const [selection, setSelection] = useControllable({
    controlled: input.selection,
    defaultValue: input.defaultSelection ?? EMPTY_SELECTION,
    onChange: input.onSelectionChange,
    warning:
      input.selection && input.defaultSelection
        ? "YearPlanner: `selection` is controlled; `defaultSelection` is ignored."
        : undefined,
  });

  const [filter, setFilter] = useControllable({
    controlled: input.filter,
    defaultValue: input.defaultFilter ?? {},
    onChange: input.onFilterChange,
    warning:
      input.filter && input.defaultFilter
        ? "YearPlanner: `filter` is controlled; `defaultFilter` is ignored."
        : undefined,
  });

  const [interactionMode, setInteractionMode] = useState<InteractionMode>(
    input.interaction?.mode ?? "auto",
  );
  const propMode = input.interaction?.mode;
  useEffect(() => {
    if (propMode !== undefined) setInteractionMode(propMode);
  }, [propMode]);

  const dispatchVisibility = useCallback(
    (action: VisibilityAction) => {
      setVisibility(visibilityReducer({ model, visibility, filter }, visibility, action));
    },
    [filter, model, setVisibility, visibility],
  );

  const showAll = useCallback(() => {
    setVisibility({
      ...visibility,
      hiddenGroupIds: [],
      hiddenLayerIds: [],
      hiddenItemIds: [],
    });
  }, [setVisibility, visibility]);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const applyLocalItems = useCallback(
    (next: PlannerItem[] | ((previous: PlannerItem[]) => PlannerItem[])) => {
      if (itemsControlled) return false;
      const previous = itemsRef.current;
      const resolved = typeof next === "function" ? next(previous) : next;
      itemsRef.current = resolved;
      setLocalItems(resolved);
      input.onItemsChange?.(resolved);
      return true;
    },
    [input.onItemsChange, itemsControlled],
  );

  // A stable state object keeps the interaction and command callbacks stable
  // between gesture frames; every field below is already memoized or state.
  return useMemo(
    () => ({
      items,
      model,
      validation,
      itemsControlled,
      visibility,
      setVisibility,
      dispatchVisibility,
      showAll,
      selection,
      setSelection,
      filter,
      setFilter,
      interactionMode,
      setInteractionMode,
      applyLocalItems,
    }),
    [
      items,
      model,
      validation,
      itemsControlled,
      visibility,
      setVisibility,
      dispatchVisibility,
      showAll,
      selection,
      setSelection,
      filter,
      setFilter,
      interactionMode,
      applyLocalItems,
    ],
  );
}

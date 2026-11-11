import {
  type DateKey,
  type Diagnostic,
  diagnostic,
  type PlannerSelection,
  type RibbonLayout,
} from "@blendsdk/year-planner-core";
import { type CommandPipeline, type CommandRequestResult, createPlannerId } from "../commands.js";
import type { PlannerState } from "../state.js";
import type { InteractionConfig } from "../types.js";
import { buildCreateItem, buildPaintCommand, defaultPaintDefaults } from "./builders.js";
import { type GestureCompletion, intersectMarquee } from "./gesture.js";
import { type GesturePreview, previewFromCompletion } from "./preview.js";
import { applyDateClick, applyDateDrag, applyItemClick, applyItemMarquee } from "./selection.js";

/** Inputs needed to turn a completed gesture into selection or a command. */
export interface CommitContext {
  selection: PlannerSelection;
  state: PlannerState;
  pipeline: CommandPipeline;
  interaction: InteractionConfig | undefined;
  activeLayerId: string | undefined;
  isDisabled: (date: DateKey) => boolean;
  visibleItemIds: ReadonlySet<string>;
  visualOrder: readonly string[];
  ribbons: RibbonLayout;
  showAnnotations: boolean;
  emitSelection: (next: PlannerSelection, focusItem?: string, focusDate?: DateKey) => void;
  onFocusItem: (itemId: string) => void;
  onFocusDate: (date: DateKey) => void;
  onDiagnostic?: ((entry: Diagnostic) => void) | undefined;
}

/** A command started by a completed gesture. */
export interface GestureCommit {
  /** Preview to keep visible until the request settles. */
  preview?: GesturePreview;
  /** Settlement promise, when a command was dispatched. */
  promise?: Promise<CommandRequestResult>;
}

function visibleSource(context: CommitContext, itemId: string): boolean {
  return (
    context.visibleItemIds.has(itemId) && context.state.items.some((entry) => entry.id === itemId)
  );
}

function focusFailure(
  context: CommitContext,
  itemId: string | undefined,
  fallbackDate: DateKey,
): void {
  if (itemId && visibleSource(context, itemId)) context.onFocusItem(itemId);
  else context.onFocusDate(fallbackDate);
}

/**
 * Applies a completed gesture intent.
 *
 * All mutations go through the existing command pipeline; selection changes use
 * the pure policy module. Command completions return a preview and a settlement
 * promise so the interaction layer can keep the proposal visible until the host
 * answers.
 */
export function commitGesture(
  completion: GestureCompletion,
  context: CommitContext,
): GestureCommit {
  switch (completion.kind) {
    case "click": {
      const target = completion.target;
      if (target.kind === "cell") {
        context.emitSelection(
          applyDateClick(context.selection, target.date, completion.modifiers, context.isDisabled),
          undefined,
          target.date,
        );
      } else if (target.kind === "item") {
        context.emitSelection(
          applyItemClick(
            context.selection,
            target.itemId,
            completion.modifiers,
            context.visualOrder,
          ),
          target.itemId,
        );
      }
      return {};
    }
    case "select": {
      context.emitSelection(
        applyDateDrag(
          context.selection,
          completion.anchor,
          completion.focus,
          completion.modifiers,
          context.isDisabled,
        ),
        undefined,
        completion.focus,
      );
      return {};
    }
    case "marquee": {
      const hit = intersectMarquee(context.ribbons, completion.rect, {
        visible: context.visibleItemIds,
        showAnnotations: context.showAnnotations,
        visibleLaneCount: (rowId) =>
          context.ribbons.rows.find((row) => row.rowId === rowId)?.visibleLaneCount ?? 0,
      });
      const next = applyItemMarquee(
        context.selection,
        hit,
        completion.modifiers,
        context.visualOrder,
      );
      context.emitSelection(next, next.focusItemId);
      return {};
    }
    case "move":
    case "resize": {
      const source = context.state.items.find((entry) => entry.id === completion.itemId);
      if (!source) {
        context.onDiagnostic?.(diagnostic("INVALID_COMMAND", "The item no longer exists"));
        context.onFocusDate(completion.fallbackDate);
        return {};
      }
      const shared = {
        itemId: completion.itemId,
        proposedPeriod: completion.proposedPeriod,
        expectedVersion: source.version,
      };
      const command =
        completion.kind === "move"
          ? { type: "move" as const, ...shared }
          : { type: "resize" as const, ...shared };
      const promise = context.pipeline.requestCommand(command);
      void promise.then((result) => {
        if (result === "accepted" || result === "accepted-not-applied") {
          focusFailure(context, completion.itemId, completion.fallbackDate);
        } else if (result === "rejected") {
          focusFailure(context, completion.itemId, completion.fallbackDate);
        }
      });
      const preview = previewFromCompletion(completion, source.layerId, context.isDisabled);
      return {
        ...(preview ? { preview } : {}),
        promise,
      };
    }
    case "paint": {
      const layerId = context.activeLayerId;
      if (!layerId) {
        context.onDiagnostic?.(
          diagnostic("INVALID_PAINT_TARGET", "Paint requires an active highlight layer"),
        );
        context.onFocusDate(completion.fallbackDate);
        return {};
      }
      const command = buildPaintCommand({
        model: context.state.model,
        visibility: context.state.visibility,
        filter: context.state.filter,
        layerId,
        startDate: completion.startDate,
        endDateExclusive: completion.endDateExclusive,
        operation: completion.operation,
        defaults: defaultPaintDefaults(context.interaction),
      });
      if (!command) {
        context.onDiagnostic?.(
          diagnostic("INVALID_PAINT_TARGET", "Paint requires an active highlight layer"),
        );
        context.onFocusDate(completion.fallbackDate);
        return {};
      }
      const promise = context.pipeline.requestCommand(command);
      void promise.then((result) => {
        if (result === "rejected") context.onFocusDate(completion.fallbackDate);
      });
      const preview = previewFromCompletion(completion, layerId, context.isDisabled);
      return {
        ...(preview ? { preview } : {}),
        promise,
      };
    }
    case "create": {
      const created = buildCreateItem({
        interaction: context.interaction,
        activeLayerId: context.activeLayerId,
        startDate: completion.startDate,
        endDateExclusive: completion.endDateExclusive,
        createId: () => createPlannerId(context.interaction),
      });
      if (!created) {
        context.onDiagnostic?.(diagnostic("INVALID_COMMAND", "Create requires a layer"));
        context.onFocusDate(completion.fallbackDate);
        return {};
      }
      const promise = context.pipeline.requestCommand({ type: "create", item: created });
      void promise.then((result) => {
        if (result === "accepted") context.onFocusItem(created.id);
        else if (result === "rejected" || result === "accepted-not-applied") {
          context.onFocusDate(completion.fallbackDate);
        }
      });
      const preview = previewFromCompletion(completion, context.activeLayerId, context.isDisabled);
      return {
        ...(preview ? { preview } : {}),
        promise,
      };
    }
    case "invalid": {
      context.onDiagnostic?.(diagnostic(completion.code, completion.message));
      context.onFocusDate(completion.fallbackDate);
      return {};
    }
    default:
      return {};
  }
}

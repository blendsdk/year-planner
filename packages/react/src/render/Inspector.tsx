import {
  addDays,
  canDeleteItem,
  diffDays,
  getEffectiveVisibility,
  getItemEditability,
  getResolvedLayerPolicy,
  type LayerGroup,
  type PlannerFilter,
  type PlannerItem,
  type PlannerLayer,
  type PlannerModel,
  type PlannerSelection,
  type RibbonRow,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import type { ReactNode, RefObject } from "react";
import type { CommandFeedback, CommandPipeline } from "../commands.js";
import { createPlannerId } from "../commands.js";
import type { PlannerFormatters } from "../locale.js";
import type {
  InspectorActions,
  InspectorRenderContext,
  InteractionConfig,
  YearPlannerComponents,
} from "../types.js";

/** Props for the default inspector. */
export interface InspectorProps {
  model: PlannerModel;
  visibility: VisibilityState;
  filter: PlannerFilter;
  selection: PlannerSelection;
  open: boolean;
  readOnly: boolean;
  interactionMode: "auto" | "inspect" | "select" | "paint" | "erase" | "create" | "move" | "resize";
  activeLayerId?: string | undefined;
  activeDate?: string | undefined;
  formatters: PlannerFormatters;
  displayTimeZone: string;
  overflowRow?: RibbonRow | undefined;
  pipeline: CommandPipeline;
  interaction?: InteractionConfig | undefined;
  components: YearPlannerComponents;
  renderInspector?: ((context: InspectorRenderContext) => ReactNode) | undefined;
  onClose: () => void;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
  asideRef?: RefObject<HTMLElement | null> | undefined;
}

function groupPath(layer: PlannerLayer, groups: LayerGroup[]): string {
  if (!layer.groupId) return layer.name;
  const byId = new Map(groups.map((group) => [group.id, group]));
  const names: string[] = [];
  let cursor: string | undefined = layer.groupId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const group = byId.get(cursor);
    if (!group) break;
    names.unshift(group.name);
    cursor = group.parentGroupId;
  }
  return [...names, layer.name].join(" / ");
}

function periodText(
  item: PlannerItem,
  formatters: PlannerFormatters,
  displayTimeZone: string,
): string {
  return formatters.formatPeriod(item.period, displayTimeZone);
}

function itemRange(
  item: PlannerItem,
  selection: PlannerSelection,
): { startDate: string; endDateExclusive: string } | undefined {
  if (selection.dates.length > 0) {
    const startDate = selection.dates.map((range) => range.startDate).sort()[0];
    const endDateExclusive = selection.dates
      .map((range) => range.endDateExclusive)
      .sort()
      .at(-1);
    if (startDate && endDateExclusive) return { startDate, endDateExclusive };
  }
  if (item.period.kind !== "all-day") return undefined;
  return { startDate: item.period.startDate, endDateExclusive: item.period.endDateExclusive };
}

function commandForPaint(
  item: PlannerItem,
  selection: PlannerSelection,
  layerId: string,
  operation: "union" | "subtract",
  interaction: InteractionConfig | undefined,
  model: PlannerModel,
): Parameters<CommandPipeline["requestCommand"]>[0] | undefined {
  const layer = model.layers.find((entry) => entry.id === layerId);
  const range = itemRange(item, selection);
  if (layer?.channel !== "highlight" || !range) return undefined;
  const expectedVersions: Record<string, number> = {};
  for (const entry of model.items) {
    if (
      entry.layerId !== layerId ||
      entry.kind !== "highlight" ||
      entry.period.kind !== "all-day"
    ) {
      continue;
    }
    if (
      entry.period.startDate < range.endDateExclusive &&
      range.startDate < entry.period.endDateExclusive
    ) {
      expectedVersions[entry.id] = entry.version;
    }
  }
  return {
    type: "paint",
    layerId,
    period: { kind: "all-day", ...range },
    operation,
    defaults: interaction?.paintDefaults ?? {
      kind: "highlight",
      ...(item.title === undefined ? {} : { title: item.title }),
    },
    expectedVersions,
  };
}

/**
 * Component-owned inspector for selected items, overflow and command feedback.
 *
 * The aside, close button and focus target stay planner-owned; `renderInspector`
 * replaces only the body.
 */
export function Inspector({
  model,
  visibility,
  filter,
  selection,
  open,
  readOnly,
  interactionMode,
  activeLayerId,
  activeDate,
  formatters,
  displayTimeZone,
  overflowRow,
  pipeline,
  interaction,
  components,
  renderInspector,
  onClose,
  onSelectItem,
  onFocusItem,
  asideRef,
}: InspectorProps): ReactNode {
  if (!open) return null;
  const InspectorSlot = components.Inspector;
  const selectedItems = selection.items
    .map((id) => model.items.find((item) => item.id === id))
    .filter((item): item is PlannerItem => item !== undefined)
    .filter((item) => getEffectiveVisibility(item.id, { model, visibility, filter }).visible);
  const overflowItems = (overflowRow?.overflow ?? [])
    .map((entry) => model.items.find((item) => item.id === entry.itemId))
    .filter((item): item is PlannerItem => item !== undefined);
  const layerById = new Map(model.layers.map((layer) => [layer.id, layer]));

  const actions: InspectorActions = {
    close: onClose,
    focusItem: onFocusItem,
    requestCommand: (command) => {
      void pipeline.requestCommand(command);
    },
    retry: () => {
      void pipeline.retry();
    },
    dismiss: pipeline.dismiss,
  };

  const context: InspectorRenderContext = {
    selection,
    items: selectedItems,
    actions,
  };

  return (
    <aside
      ref={asideRef}
      className="yp-inspector"
      data-yp-part="inspector"
      aria-label="Planner inspector"
      tabIndex={-1}
    >
      <header className="yp-inspector-header">
        <h2>Inspector</h2>
        <button
          type="button"
          className="yp-inspector-close"
          data-yp-part="inspector-close"
          aria-label="Close inspector"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="yp-inspector-body">
        {InspectorSlot ? (
          <InspectorSlot className="yp-inspector-slot">
            <InspectorBody
              renderInspector={renderInspector}
              context={context}
              selectedItems={selectedItems}
              overflowItems={overflowItems}
              model={model}
              visibility={visibility}
              filter={filter}
              selection={selection}
              readOnly={readOnly}
              interactionMode={interactionMode}
              activeLayerId={activeLayerId}
              activeDate={activeDate}
              formatters={formatters}
              displayTimeZone={displayTimeZone}
              interaction={interaction}
              pipeline={pipeline}
              onSelectItem={onSelectItem}
              onFocusItem={onFocusItem}
              layerById={layerById}
            />
            <InspectorFeedback pipeline={pipeline} />
          </InspectorSlot>
        ) : (
          <>
            <InspectorBody
              renderInspector={renderInspector}
              context={context}
              selectedItems={selectedItems}
              overflowItems={overflowItems}
              model={model}
              visibility={visibility}
              filter={filter}
              selection={selection}
              readOnly={readOnly}
              interactionMode={interactionMode}
              activeLayerId={activeLayerId}
              activeDate={activeDate}
              formatters={formatters}
              displayTimeZone={displayTimeZone}
              interaction={interaction}
              pipeline={pipeline}
              onSelectItem={onSelectItem}
              onFocusItem={onFocusItem}
              layerById={layerById}
            />
            <InspectorFeedback pipeline={pipeline} />
          </>
        )}
      </div>
    </aside>
  );
}

interface InspectorBodyProps extends BodyProps {
  renderInspector: ((context: InspectorRenderContext) => ReactNode) | undefined;
  context: InspectorRenderContext;
}

function InspectorBody({ renderInspector, context, ...body }: InspectorBodyProps): ReactNode {
  if (renderInspector) return renderInspector(context);
  return <DefaultInspectorBody {...body} />;
}

interface BodyProps {
  selectedItems: PlannerItem[];
  overflowItems: PlannerItem[];
  model: PlannerModel;
  visibility: VisibilityState;
  filter: PlannerFilter;
  selection: PlannerSelection;
  readOnly: boolean;
  interactionMode: InspectorProps["interactionMode"];
  activeLayerId: string | undefined;
  activeDate: string | undefined;
  formatters: PlannerFormatters;
  displayTimeZone: string;
  interaction: InteractionConfig | undefined;
  pipeline: CommandPipeline;
  onSelectItem: (itemId: string) => void;
  onFocusItem: (itemId: string) => void;
  layerById: ReadonlyMap<string, PlannerLayer>;
}

function DefaultInspectorBody({
  selectedItems,
  overflowItems,
  model,
  visibility,
  filter,
  selection,
  readOnly,
  interactionMode,
  activeLayerId,
  activeDate,
  formatters,
  displayTimeZone,
  interaction,
  pipeline,
  onSelectItem,
  onFocusItem,
  layerById,
}: BodyProps): ReactNode {
  const createLayer = interaction?.createDefaults?.layerId ?? activeLayerId;
  const createDate = selection.focusDate ?? selection.dates[0]?.startDate ?? activeDate;
  return (
    <>
      {selectedItems.length === 0 && overflowItems.length === 0 && (
        <p className="yp-inspector-empty">Select an item or date range.</p>
      )}
      {selectedItems.map((item) => {
        const layer = layerById.get(item.layerId);
        const visibilityResult = getEffectiveVisibility(item.id, { model, visibility, filter });
        const editability = layer
          ? getItemEditability(item.id, "move", {
              model,
              visibility,
              filter,
              mode: interactionMode,
              ...(readOnly ? { readOnly: true } : {}),
              ...(activeLayerId ? { activeLayerId } : {}),
            })
          : undefined;
        const deletable = layer
          ? canDeleteItem(item.id, {
              model,
              visibility,
              filter,
              mode: interactionMode,
              ...(readOnly ? { readOnly: true } : {}),
              ...(activeLayerId ? { activeLayerId } : {}),
            })
          : undefined;
        const paintLayer = model.layers.find(
          (entry) => entry.id === activeLayerId && entry.channel === "highlight",
        );
        const timed = item.period.kind !== "all-day";
        const paintCommand =
          paintLayer && !timed
            ? commandForPaint(item, selection, paintLayer.id, "union", interaction, model)
            : undefined;
        const eraseCommand =
          paintLayer && !timed
            ? commandForPaint(item, selection, paintLayer.id, "subtract", interaction, model)
            : undefined;
        return (
          <section className="yp-inspector-item" key={item.id} data-item-id={item.id}>
            <h3>{item.title ?? item.id}</h3>
            <dl className="yp-inspector-details">
              <dt>Kind</dt>
              <dd>{item.kind}</dd>
              <dt>Layer</dt>
              <dd>{layer ? groupPath(layer, model.groups) : item.layerId}</dd>
              <dt>Period</dt>
              <dd>{periodText(item, formatters, displayTimeZone)}</dd>
              <dt>Status</dt>
              <dd>{item.status ?? "—"}</dd>
              <dt>Visibility</dt>
              <dd>{visibilityResult.visible ? "visible" : visibilityResult.reason}</dd>
              <dt>Editable</dt>
              <dd>{editability?.editable ? "yes" : (editability?.reason ?? "unknown")}</dd>
            </dl>
            {/* biome-ignore lint/a11y/useSemanticElements: a button group is a div with role=group in this layout */}
            <div
              className="yp-inspector-actions"
              role="group"
              aria-label={`Actions for ${item.title ?? item.id}`}
            >
              <button
                type="button"
                disabled={!deletable?.editable}
                onClick={() =>
                  void pipeline.requestCommand({
                    type: "delete",
                    itemId: item.id,
                    expectedVersion: item.version,
                  })
                }
              >
                Delete
              </button>
              <button
                type="button"
                disabled={!editability?.editable || timed}
                onClick={() =>
                  item.period.kind === "all-day" &&
                  void pipeline.requestCommand({
                    type: "move",
                    itemId: item.id,
                    proposedPeriod: {
                      kind: "all-day",
                      startDate: addDays(item.period.startDate, -7),
                      endDateExclusive: addDays(item.period.endDateExclusive, -7),
                    },
                    expectedVersion: item.version,
                  })
                }
              >
                Move earlier
              </button>
              <button
                type="button"
                disabled={!editability?.editable || timed}
                onClick={() =>
                  item.period.kind === "all-day" &&
                  void pipeline.requestCommand({
                    type: "move",
                    itemId: item.id,
                    proposedPeriod: {
                      kind: "all-day",
                      startDate: addDays(item.period.startDate, 7),
                      endDateExclusive: addDays(item.period.endDateExclusive, 7),
                    },
                    expectedVersion: item.version,
                  })
                }
              >
                Move later
              </button>
              <button
                type="button"
                disabled={!editability?.editable || timed}
                onClick={() =>
                  item.period.kind === "all-day" &&
                  diffDays(item.period.startDate, item.period.endDateExclusive) > 1 &&
                  void pipeline.requestCommand({
                    type: "resize",
                    itemId: item.id,
                    proposedPeriod: {
                      kind: "all-day",
                      startDate: item.period.startDate,
                      endDateExclusive: addDays(item.period.endDateExclusive, -1),
                    },
                    expectedVersion: item.version,
                  })
                }
              >
                Resize shorter
              </button>
              <button
                type="button"
                disabled={!editability?.editable || timed}
                onClick={() =>
                  item.period.kind === "all-day" &&
                  void pipeline.requestCommand({
                    type: "resize",
                    itemId: item.id,
                    proposedPeriod: {
                      kind: "all-day",
                      startDate: item.period.startDate,
                      endDateExclusive: addDays(item.period.endDateExclusive, 1),
                    },
                    expectedVersion: item.version,
                  })
                }
              >
                Resize longer
              </button>
              <button
                type="button"
                disabled={!paintCommand}
                onClick={() => paintCommand && void pipeline.requestCommand(paintCommand)}
              >
                Paint range
              </button>
              <button
                type="button"
                disabled={!eraseCommand}
                onClick={() => eraseCommand && void pipeline.requestCommand(eraseCommand)}
              >
                Erase range
              </button>
            </div>
            {timed && (
              <p className="yp-inspector-note">Timed items cannot be moved, resized or painted.</p>
            )}
            {layer && !getResolvedLayerPolicy(layer.id, model).allowDelete && (
              <p className="yp-inspector-note">Deletion is disabled by the layer policy.</p>
            )}
          </section>
        );
      })}
      {overflowItems.length > 0 && (
        <section className="yp-inspector-overflow">
          <h3>Hidden on this row ({overflowItems.length})</h3>
          <ul>
            {overflowItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-item-id={item.id}
                  onClick={() => {
                    onSelectItem(item.id);
                    onFocusItem(item.id);
                  }}
                >
                  {item.title ?? item.id}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="yp-inspector-create">
        <button
          type="button"
          disabled={!createLayer || !createDate}
          onClick={() => {
            if (!createLayer || !createDate) return;
            const startDate = createDate;
            void pipeline.requestCommand({
              type: "create",
              item: {
                id: createPlannerId(interaction),
                kind: interaction?.createDefaults?.kind ?? "activity",
                layerId: createLayer,
                period: {
                  kind: "all-day",
                  startDate,
                  endDateExclusive: addDays(startDate, 1),
                },
                version: 1,
                title: "New item",
              },
            });
          }}
        >
          Create item
        </button>
        {!createLayer && <p className="yp-inspector-note">Set an active layer to create items.</p>}
      </section>
    </>
  );
}

/** Renders command feedback with optional retry and dismiss actions. */
export function InspectorFeedback({ pipeline }: { pipeline: CommandPipeline }): ReactNode {
  const feedback: CommandFeedback | undefined = pipeline.feedback;
  if (!feedback) return null;
  return (
    <section className="yp-inspector-feedback" data-yp-part="inspector-feedback" role="status">
      <p>
        <code>{feedback.code}</code> {feedback.message}
      </p>
      <div className="yp-inspector-actions">
        {feedback.retryable && (
          <button type="button" onClick={() => void pipeline.retry()}>
            Retry
          </button>
        )}
        <button type="button" onClick={pipeline.dismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}

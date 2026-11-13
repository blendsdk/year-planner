import {
  addDays,
  canCreateItem,
  canDeleteItem,
  diffDays,
  type EditabilityReason,
  getEffectiveVisibility,
  getItemEditability,
  getResolvedLayerPolicy,
  type ItemKind,
  isLayerEffectivelyHidden,
  type LayerGroup,
  type PlannerFilter,
  type PlannerItem,
  type PlannerLayer,
  type PlannerModel,
  type PlannerSelection,
  type RibbonRow,
  type VisibilityReason,
  type VisibilityState,
} from "@blendsdk/year-planner-core";
import { memo, type ReactNode, type RefObject } from "react";
import type { CommandFeedback, CommandPipeline } from "../commands.js";
import { createPlannerId } from "../commands.js";
import {
  buildCreateItem,
  buildPaintCommand,
  defaultPaintDefaults,
} from "../interaction/builders.js";
import type { PlannerFormatters } from "../locale.js";
import { formatPlannerMessage, type PlannerMessages } from "../messages.js";
import type {
  InspectorActions,
  InspectorRenderContext,
  InteractionConfig,
  YearPlannerComponents,
} from "../types.js";
import { ItemList } from "./ItemList.js";

/**
 * Props for the default inspector.
 */
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
  asideId?: string | undefined;
  asideRef?: RefObject<HTMLElement | null> | undefined;
  itemListId: string;
  itemListRef?: RefObject<HTMLElement | null> | undefined;
  renderedItemIds: ReadonlySet<string>;
  feedbackId?: string | undefined;
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

function kindMessage(kind: ItemKind, messages: PlannerMessages): string {
  if (kind === "activity") return messages.kindActivity;
  if (kind === "reservation") return messages.kindReservation;
  if (kind === "annotation") return messages.kindAnnotation;
  return messages.kindHighlight;
}

function visibilityMessage(reason: VisibilityReason, messages: PlannerMessages): string {
  if (reason === "group") return messages.visibilityReasonGroup;
  if (reason === "layer") return messages.visibilityReasonLayer;
  if (reason === "item") return messages.visibilityReasonItem;
  if (reason === "filter") return messages.visibilityReasonFilter;
  if (reason === "channel") return messages.visibilityReasonChannel;
  if (reason === "unknown-entity") return messages.visibilityReasonUnknown;
  return messages.visibilityVisible;
}

function editabilityMessage(reason: EditabilityReason, messages: PlannerMessages): string {
  if (reason === "global-read-only") return messages.editabilityReasonGlobalReadOnly;
  if (reason === "hidden") return messages.editabilityReasonHidden;
  if (reason === "item-locked") return messages.editabilityReasonItemLocked;
  if (reason === "layer-locked") return messages.editabilityReasonLayerLocked;
  if (reason === "policy") return messages.editabilityReasonPolicy;
  if (reason === "interaction-mode") return messages.editabilityReasonInteractionMode;
  if (reason === "unknown-entity") return messages.editabilityReasonUnknown;
  return messages.editableYes;
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
  visibility: VisibilityState,
  filter: PlannerFilter,
): Parameters<CommandPipeline["requestCommand"]>[0] | undefined {
  const range = itemRange(item, selection);
  if (!range) return undefined;
  const defaults = interaction?.paintDefaults ?? {
    kind: "highlight" as const,
    ...(item.title === undefined ? {} : { title: item.title }),
  };
  return buildPaintCommand({
    model,
    visibility,
    filter,
    layerId,
    startDate: range.startDate,
    endDateExclusive: range.endDateExclusive,
    operation,
    defaults: defaultPaintDefaults({ paintDefaults: defaults }),
  });
}

function hostOwnedCreateDisabled(
  layerId: string,
  model: PlannerModel,
  visibility: VisibilityState,
  filter: PlannerFilter,
  readOnly: boolean,
  mode: InspectorProps["interactionMode"],
): boolean {
  const check = canCreateItem(layerId, {
    model,
    visibility,
    filter,
    mode,
    ...(readOnly ? { readOnly: true } : {}),
    activeLayerId: layerId,
  });
  return !check.editable;
}

/** Compares every inspector prop by reference; all are stable during a gesture. */
function inspectorPropsEqual(previous: InspectorProps, next: InspectorProps): boolean {
  return (
    previous.model === next.model &&
    previous.visibility === next.visibility &&
    previous.filter === next.filter &&
    previous.selection === next.selection &&
    previous.open === next.open &&
    previous.readOnly === next.readOnly &&
    previous.interactionMode === next.interactionMode &&
    previous.activeLayerId === next.activeLayerId &&
    previous.activeDate === next.activeDate &&
    previous.formatters === next.formatters &&
    previous.displayTimeZone === next.displayTimeZone &&
    previous.overflowRow === next.overflowRow &&
    previous.pipeline === next.pipeline &&
    previous.interaction === next.interaction &&
    previous.components === next.components &&
    previous.renderInspector === next.renderInspector &&
    previous.onClose === next.onClose &&
    previous.onSelectItem === next.onSelectItem &&
    previous.onFocusItem === next.onFocusItem &&
    previous.asideId === next.asideId &&
    previous.asideRef === next.asideRef &&
    previous.itemListId === next.itemListId &&
    previous.itemListRef === next.itemListRef &&
    previous.renderedItemIds === next.renderedItemIds &&
    previous.feedbackId === next.feedbackId
  );
}

/**
 * Component-owned inspector for selected items, overflow and command feedback.
 *
 * The aside, close button and focus target stay planner-owned; `renderInspector`
 * replaces only the body. The memo skips the 500-item visibility scan while a
 * gesture is active.
 */
export const Inspector = memo(function Inspector({
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
  asideId,
  asideRef,
  itemListId,
  itemListRef,
  renderedItemIds,
  feedbackId,
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
  const overflowItemIds = new Set(overflowItems.map((item) => item.id));
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
  const messages = formatters.messages;

  return (
    <aside
      id={asideId}
      ref={asideRef}
      className="yp-inspector"
      data-yp-part="inspector"
      aria-label={messages.inspectorLabel}
      tabIndex={-1}
    >
      <header className="yp-inspector-header">
        <h2>{messages.inspectorTitle}</h2>
        <button
          type="button"
          className="yp-inspector-close"
          data-yp-part="inspector-close"
          aria-label={messages.inspectorClose}
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
            <InspectorFeedback pipeline={pipeline} id={feedbackId} messages={formatters.messages} />
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
            <InspectorFeedback pipeline={pipeline} id={feedbackId} messages={formatters.messages} />
          </>
        )}
      </div>
      <ItemList
        model={model}
        visibility={visibility}
        filter={filter}
        selection={selection}
        formatters={formatters}
        displayTimeZone={displayTimeZone}
        renderedItemIds={renderedItemIds}
        overflowItemIds={overflowItemIds}
        listId={itemListId}
        listRef={itemListRef}
        onSelectItem={onSelectItem}
        onFocusItem={onFocusItem}
      />
    </aside>
  );
}, inspectorPropsEqual);

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
  const messages = formatters.messages;
  const createLayer = interaction?.createDefaults?.layerId ?? activeLayerId;
  const createDate = selection.focusDate ?? selection.dates[0]?.startDate ?? activeDate;
  return (
    <>
      {selectedItems.length === 0 && overflowItems.length === 0 && (
        <p className="yp-inspector-empty">{messages.inspectorEmpty}</p>
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
        const resizeEditability = layer
          ? getItemEditability(item.id, "resize", {
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
        const paintLayerEditable =
          paintLayer &&
          !readOnly &&
          !paintLayer.locked &&
          !paintLayer.readOnly &&
          getResolvedLayerPolicy(paintLayer.id, model).allowPaint &&
          !isLayerEffectivelyHidden(paintLayer.id, { model, visibility, filter }) &&
          (interactionMode === "auto" ||
            interactionMode === "paint" ||
            interactionMode === "erase");
        const paintEditability = paintLayer
          ? getItemEditability(item.id, "paint", {
              model,
              visibility,
              filter,
              mode: interactionMode,
              ...(readOnly ? { readOnly: true } : {}),
              ...(activeLayerId ? { activeLayerId } : {}),
            })
          : undefined;
        const timed = item.period.kind !== "all-day";
        const hostOwned = item.kind === "annotation";
        const paintCommand =
          paintLayer && !timed && paintLayerEditable && paintEditability?.editable
            ? commandForPaint(
                item,
                selection,
                paintLayer.id,
                "union",
                interaction,
                model,
                visibility,
                filter,
              )
            : undefined;
        const eraseCommand =
          paintLayer && !timed && paintLayerEditable && paintEditability?.editable
            ? commandForPaint(
                item,
                selection,
                paintLayer.id,
                "subtract",
                interaction,
                model,
                visibility,
                filter,
              )
            : undefined;
        return (
          <section className="yp-inspector-item" key={item.id} data-item-id={item.id}>
            <h3>{item.title ?? item.id}</h3>
            <dl className="yp-inspector-details">
              <dt>{messages.detailKind}</dt>
              <dd>{kindMessage(item.kind, messages)}</dd>
              <dt>{messages.detailLayer}</dt>
              <dd>{layer ? groupPath(layer, model.groups) : item.layerId}</dd>
              <dt>{messages.detailPeriod}</dt>
              <dd>{periodText(item, formatters, displayTimeZone)}</dd>
              <dt>{messages.detailStatus}</dt>
              <dd>{item.status ?? "—"}</dd>
              <dt>{messages.detailVisibility}</dt>
              <dd>{visibilityMessage(visibilityResult.reason, messages)}</dd>
              <dt>{messages.detailEditable}</dt>
              <dd>
                {editability
                  ? editabilityMessage(editability.reason, messages)
                  : messages.editableUnknown}
              </dd>
            </dl>
            {/* biome-ignore lint/a11y/useSemanticElements: a button group is a div with role=group in this layout */}
            <div
              className="yp-inspector-actions"
              role="group"
              aria-label={formatPlannerMessage(messages.actionsFor, {
                title: item.title ?? item.id,
              })}
            >
              <button
                type="button"
                disabled={hostOwned || !deletable?.editable}
                onClick={() =>
                  void pipeline.requestCommand({
                    type: "delete",
                    itemId: item.id,
                    expectedVersion: item.version,
                  })
                }
              >
                {messages.actionDelete}
              </button>
              <button
                type="button"
                disabled={hostOwned || !editability?.editable || timed}
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
                {messages.actionMoveEarlier}
              </button>
              <button
                type="button"
                disabled={hostOwned || !editability?.editable || timed}
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
                {messages.actionMoveLater}
              </button>
              <button
                type="button"
                disabled={hostOwned || !resizeEditability?.editable || timed}
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
                {messages.actionResizeShorter}
              </button>
              <button
                type="button"
                disabled={hostOwned || !resizeEditability?.editable || timed}
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
                {messages.actionResizeLonger}
              </button>
              <button
                type="button"
                disabled={!paintCommand}
                onClick={() => paintCommand && void pipeline.requestCommand(paintCommand)}
              >
                {messages.actionPaint}
              </button>
              <button
                type="button"
                disabled={!eraseCommand}
                onClick={() => eraseCommand && void pipeline.requestCommand(eraseCommand)}
              >
                {messages.actionErase}
              </button>
            </div>
            {hostOwned && <p className="yp-inspector-note">{messages.noteHostOwned}</p>}
            {timed && <p className="yp-inspector-note">{messages.noteTimed}</p>}
            {layer && !getResolvedLayerPolicy(layer.id, model).allowDelete && (
              <p className="yp-inspector-note">{messages.noteDeleteDisabled}</p>
            )}
          </section>
        );
      })}
      {overflowItems.length > 0 && (
        <section className="yp-inspector-overflow">
          <h3>
            {formatPlannerMessage(messages.inspectorHiddenOnRow, {
              count: overflowItems.length,
            })}
          </h3>
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
          disabled={
            !createLayer ||
            !createDate ||
            hostOwnedCreateDisabled(
              createLayer,
              model,
              visibility,
              filter,
              readOnly,
              interactionMode,
            )
          }
          onClick={() => {
            if (!createLayer || !createDate) return;
            const item = buildCreateItem({
              interaction,
              activeLayerId: createLayer,
              startDate: createDate,
              endDateExclusive: addDays(createDate, 1),
              createId: () => createPlannerId(interaction),
            });
            if (item) void pipeline.requestCommand({ type: "create", item });
          }}
        >
          {messages.actionCreate}
        </button>
        {!createLayer && <p className="yp-inspector-note">{messages.noteNoActiveLayer}</p>}
      </section>
    </>
  );
}

/**
 * Renders command feedback and non-blocking notices with retry/dismiss actions.
 */
export function InspectorFeedback({
  pipeline,
  id,
  messages,
}: {
  pipeline: CommandPipeline;
  id?: string | undefined;
  messages: PlannerMessages;
}): ReactNode {
  const feedback: CommandFeedback | undefined = pipeline.feedback;
  const notices = pipeline.notices;
  if (!feedback && notices.length === 0) return null;
  return (
    <section
      id={id}
      className="yp-inspector-feedback"
      data-yp-part="inspector-feedback"
      aria-label={messages.feedbackLabel}
    >
      {feedback && (
        <p data-yp-level={feedback.level}>
          <code>{feedback.code}</code> {feedback.message}
        </p>
      )}
      {notices.length > 0 && (
        <ul className="yp-inspector-notices" data-yp-part="inspector-notices">
          {notices.map((entry) => (
            <li key={`${entry.code}:${entry.message}`} data-yp-level={entry.level}>
              <code>{entry.code}</code> {entry.message}
            </li>
          ))}
        </ul>
      )}
      <div className="yp-inspector-actions">
        {feedback?.retryable && (
          <button type="button" onClick={() => void pipeline.retry()}>
            {messages.actionRetry}
          </button>
        )}
        <button type="button" onClick={pipeline.dismiss}>
          {messages.actionDismiss}
        </button>
      </div>
    </section>
  );
}

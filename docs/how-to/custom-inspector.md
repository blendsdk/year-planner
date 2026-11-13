# Custom inspector

`renderInspector` replaces the **body** of the inspector. The aside, the close
button and the focus target stay planner-owned, so keyboard behaviour and the
dialog semantics keep working.

## The context

```ts
interface InspectorRenderContext {
  selection: PlannerSelection;
  items: readonly PlannerItem[];
  actions: {
    close(): void;
    focusItem(id: string): void;
    requestCommand(command: PlannerCommand): void;
    retry?(): void;
    dismiss?(): void;
  };
}
```

## A project card

```tsx
<YearPlanner
  year={2027}
  items={items}
  layers={layers}
  renderInspector={({ items, actions }) => {
    const project = items[0];
    if (!project) return <p>Select a project.</p>;
    const meta = project.metadata as { client?: string; crew?: string } | undefined;
    return (
      <article>
        <h3>{project.title}</h3>
        <dl>
          <dt>Client</dt>
          <dd>{meta?.client ?? "—"}</dd>
          <dt>Crew</dt>
          <dd>{meta?.crew ?? "—"}</dd>
        </dl>
        <button type="button" onClick={() => actions.focusItem(project.id)}>
          Show on grid
        </button>
        <button
          type="button"
          onClick={() =>
            actions.requestCommand({
              type: "delete",
              itemId: project.id,
              expectedVersion: project.version,
            })
          }
        >
          Delete project
        </button>
        <button type="button" onClick={actions.close}>
          Close
        </button>
      </article>
    );
  }}
/>
```

## Rules

- Use `actions.requestCommand` rather than mutating items directly. The command
  goes through validation, pending state and undo.
- Use `actions.focusItem` to move keyboard focus to the item proxy.
- Keep the body scrollable; the planner does not add a second scroll container.
- Do not render nested interactive controls inside an item proxy. The inspector
  is outside the proxy, so it is safe.
- A controlled host must handle `delete`/`update` through
  `onChangeRequest`; an uncontrolled host applies them locally.

## Read more

- [Inspector stories](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-04-inspector--custom-inspector)
- [Interaction](../interaction.md)
- [Accessibility](../accessibility.md)

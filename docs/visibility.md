# Visibility Semantics

> **Scope**: how groups, layers, items, filters and render channels combine.

Visibility is a view concern. Hiding an item never deletes it from the host model;
it removes it from the rendered grid, the inspector, the overflow list and the
print tree.

## Precedence

The effective visibility is evaluated in this order:

1. A hidden group hides every descendant layer and item.
2. A hidden layer hides its items.
3. A hidden item is hidden even when its layer is visible.
4. A filter removes matching items from the view.
5. A hidden render channel removes that channel entirely.

Later rules narrow the view; they never re-show something hidden by an earlier
rule. `getEffectiveVisibility(id)` returns the resolved state for one item when
the host needs to mirror it.

## Groups

Groups form a tree through `parentGroupId`. Hiding a parent hides the whole
subtree; showing the parent does not automatically show a child that is hidden
explicitly.

```ts
const visibility: VisibilityState = {
  hiddenGroupIds: ["ops"],
  hiddenLayerIds: [],
  hiddenItemIds: [],
};
```

## Layers

Layers belong to a group and choose a render channel: `ribbon`, `foreground`,
`background`, `annotation` or `preview`. Hiding a layer hides its items but keeps
the layer available in the host's controls.

## Items

`hiddenItemIds` hides individual items, including annotations. A hidden item is
pruned from the selection and from the inspector. The item list in the inspector
never exposes its title, id, metadata or timing.

## Filters

`PlannerFilter` narrows the visible set by layer, resource, status and title. A
filter is not a hide: clearing it restores the item. Filters apply after the
explicit hides and before channel rules.

```ts
<YearPlanner filter={{ layerIds: ["bookings"], search: "winter" }} year={2027} />;
```

## Channels

Channels let a host hide a whole rendering class without naming every layer:
`hiddenChannels: ["annotation"]` hides annotations while keeping ribbons. The
`background` channel is decorative and not focusable; `annotation` fragments are
badges.

## Hidden data rule

Hidden data must not leak through a side channel. The component keeps hidden
items out of:

- the DOM and the accessibility tree;
- tooltips, the item list and the inspector;
- the overflow popover;
- the print tree;
- selection and focus announcements.

The security suite asserts the rule for group, layer and item hides. A host that
renders item data in its own UI is responsible for applying the same rule there.

## Editability

Visibility and editability are separate. `readOnly`, a locked layer or a
non-editable item blocks edits without hiding the item. An annotation item is
host-owned for edits in R1: it renders, but its inspector actions are disabled.
See [interaction.md](interaction.md) for the editability rules.

# Security Notes — Year Planner for React

> **Scope**: RD-06 rendering/styles/slots, RD-07 pointer/selection input and
> RD-08 command diagnostics
> **Status**: Implemented controls; a full security gate suite is RD-10

## Trust boundary

| Input | Trust | Handling |
|---|---|---|
| `items`, `layers`, `groups`, `resources` | Host data; may be untrusted | Validated and normalized before render |
| Item `style` / `className` / `color` / `textColor` | Host presentation input | CSS allowlist for style properties; color fields accept only hex/rgb/hsl/named/`var(--yp-*)` values; `url()`, `expression()`, `@import`, `javascript:` dropped |
| `metadata` | Untrusted | Never read for HTML, CSS, URLs or text |
| `getDateMeta` return values | Host presentation input | Merged into cell styles; same style and color allowlist |
| `style`, `cssVars`, theme tokens | Trusted host configuration | Rendered as inline CSS variables/properties |
| Render slot content | Host React nodes | Rendered by React; no raw HTML path |
| Pointer coordinates | Browser input | Clamped to known cells; blank slots never invent dates |
| Host controls in cells | Host React nodes | Pointer, click and key events are ignored by the planner |

## Output safety

- No `dangerouslySetInnerHTML`, `eval`, remote CSS imports or runtime CSS-in-JS.
- React escapes text content.
- Hidden items are excluded before fragments, slots, overflow and tooltip data.
- Diagnostics carry entity IDs and generic messages; item titles, periods,
  instants and resource names are not included.
- Command diagnostics render as text. Local diagnostics for hidden items keep the
  item ID but omit titles, dates and layer names. Host-supplied diagnostic prose
  is host-owned; redact sensitive text in the host before returning it.
- A read-only or editable UI state is never proof of authorization. The host
  remains authoritative for every command.
- Layer identity uses label, pattern and `data-yp-layer` attributes so color is
  not the only signal.
- Hidden or filtered items are not hit-testable and are pruned from selection.
  Locked/read-only/timed items never start an edit gesture.
- Drag previews are decorative, `aria-hidden` and never mutate canonical items
  before the validated command commits.

## Content Security Policy

Themes and geometry use inline style attributes. A host needs:

```text
style-src-attr 'unsafe-inline'
```

or an equivalent policy that permits style attributes for the planner root.
Nonces do **not** authorize inline `style` attributes. If a host forbids style
attributes, per-instance theming and scaled geometry are not supported in R1.

Recommended baseline:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
style-src-attr 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
```

The Playwright suite loads the demo under this allowance and asserts the grid
renders. Unit tests assert that metadata strings never appear as HTML or CSS and
that unsafe item-style values are dropped.

## Limitations

- The host owns authentication, authorization, tenancy and persistence.
- Hidden items are not rendered, but hidden data still exists in the host's
  JavaScript state; this component is not a confidentiality boundary.
- Full CSP, dependency and penetration testing is part of RD-10.

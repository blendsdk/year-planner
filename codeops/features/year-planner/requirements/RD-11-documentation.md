# RD-11: Documentation, Storybook and API Reference

> **Document**: RD-11-documentation.md
> **Status**: Draft
> **Created**: 2026-11-10
> **Project**: Year Planner for React
> **Depends On**: RD-01 through RD-10
> **CodeOps Artifact Schema**: 1

---

## Feature Overview

Makes the component usable by an independent developer without reading its
source. Storybook is the public component site with live examples; TypeDoc is
the API reference; API Extractor protects the public surface; TSDoc is the
single source of truth.

Documentation must be honest about scope, deferred features and the status of
accessibility/performance evidence.

---

## Functional Requirements

### Must Have

- [ ] README quickstart: install, render a 14-month view from static data,
  import CSS, controlled selection and visibility, print.
- [ ] Storybook is exhaustive: every meaningful component state gets a story,
  and contributors should err on the side of adding more stories.
- [ ] Storybook 10 site with stories for:
  - 2016 classic-blue, 2017 classic-yellow, 2027 overlaps;
  - 12, 14, 18, 24 and 36-month windows;
  - cross-month and cross-year ribbons;
  - three overlapping ribbons and compact overflow;
  - visibility/group/layer/item controls;
  - select, multi-select, Ctrl/Cmd/Shift, marquee, paint/erase, move/resize;
  - keyboard focus and item inspector;
  - classic themes, high contrast, unstyled and Fluent/MUI wrappers;
  - empty state, inspector and tooltip;
  - PRT-01 exact 2017-yellow print sample;
  - A3 print preview.
- [ ] TSDoc on every public class, interface, type, function, hook and component
  prop; `@example` on public entry points.
- [ ] API Extractor `.api.md` report checked in; CI fails on an unreviewed public
  API change.
- [ ] TypeDoc HTML reference at `/api` for core and React packages, with search
  and cross-links.
- [ ] Documentation pages: getting started, controlled API, visibility
  semantics, selection/keyboard, theming, customization/holidays,
  inspector/tooltip, dynamic months, print, accessibility status, performance
  status, limitations, migration and FAQ.
- [ ] GH Pages deployment of Storybook at `/` and TypeDoc at `/api/` under the
  repository base path.
- [ ] A runnable demo app with controlled items, visibility, selection and a mock
  validation rejection/rollback.
- [ ] Clean-consumer example verified in CI.
- [ ] A `docs/test-report.md` with commands, results, browser/AT matrix and known
  gaps.
- [ ] A `DEFERRED.md` listing resource timeline, recurrence, scenarios,
  dependencies, split/merge, batch multi-move/bulk, data provider/loading/error
  states, controlled-host undo, timed editing, RTL, week start, aggregated
  density, SVG/PDF export, optimizer, full headless composition, Shadow DOM,
  milestones, parent/child activities, non-Gregorian calendars, drag between
  layers/resources, second demo, CJS/UMD and commercial support.
- [ ] No claim of WCAG conformance, booking correctness, healthcare safety or
  unmeasured performance.

### Should Have

- [ ] Copy-paste examples for Fluent UI v9 and MUI.
- [ ] A migration/versioning page for future major releases.
- [ ] Architecture diagrams generated or checked into `docs/`.

### Won't Have (Out of Scope)

- A separate VitePress site in R1; Storybook + TypeDoc are sufficient.
- Versioned docs for multiple major versions (single latest version in R1).
- Marketing site, pricing pages or commercial documentation.
- Including the original photographs or legacy reconstruction in the public
  repository.

---

## Technical Requirements

### Documentation pipeline

```text
TSDoc comments
  ├─ API Extractor → api-report/*.api.md (CI gate)
  ├─ TypeDoc → storybook-static/api (HTML)
  └─ Storybook MDX/stories → storybook-static (public site)
```

### GH Pages

- Base path: `/<repo>/`; Storybook `base` and TypeDoc links configured.
- The repository is private first; keep the docs build in CI and enable Pages at
  the public release (confirm the GitHub plan supports Pages for the repo).
- Deploy artifact: `storybook-static/` with `api/` copied in.
- Use `actions/configure-pages`, `actions/upload-pages-artifact`,
  `actions/deploy-pages`.
- No secrets in docs; all fixtures synthetic.

### Storybook addons

`@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-themes`,
`@storybook/addon-viewport`. Avoid a mandatory paid visual service.

### Complexity

Storybook stories: **L**. API docs pipeline: **M**. Guides: **M**.

---

## Integration Points

- RD-01 supplies the build/toolchain.
- RD-04 through RD-09 supply behavior to document.
- RD-10 supplies test evidence and the test report.
- RD-12 publishes the docs with the release.

---

## Scope Decisions

| Decision | Options Considered | Chosen | Rationale | AR Ref |
|---|---|---|---|---|
| Docs site | Storybook only, Storybook + TypeDoc, VitePress | Storybook + TypeDoc | Meets API-doc priority with minimal stack | AR #25 |
| API source | Hand-written, TSDoc | TSDoc | Single source of truth | AR #25 |
| API stability | Ad hoc, API report | API Extractor report | Catches breaking changes | AR #25 |
| Photos | Include, exclude | Exclude | Rights/provenance; clean-room | AR #30 |

---

## Security Considerations

- **Data sensitivity**: Examples use synthetic data only; no real employee,
  patient, customer or booking data.
- **Input validation**: Examples demonstrate validation; docs do not encourage
  bypassing host validation.
- **Authentication & authorization**: Docs explicitly state the component is not
  an authorization boundary.
- **Injection risks**: No raw HTML in docs examples; code samples use React
  escaping.
- **Encryption needs**: N/A.
- **Rate limiting**: N/A.
- **Infrastructure**: GH Pages deployment uses least-privilege workflow tokens;
  no secrets in the docs artifact.

---

## Acceptance Criteria

1. [ ] `pnpm run docs` builds the API Extractor reports and TypeDoc without errors; `pnpm storybook:build` builds the site.
2. [ ] Storybook contains stories for all states listed in this RD.
3. [ ] Every public export has TSDoc; API Extractor reports no missing release
   tags for public API.
4. [ ] `api-report/*.api.md` is checked in; an unreviewed API change fails CI.
5. [ ] TypeDoc HTML is available at `/api/` and links resolve under the GH Pages
   base path.
6. [ ] The GH Pages artifact contains Storybook at `/` and API docs at `/api/`.
7. [ ] A new developer can install the package and render a 14-month view using
   only the README quickstart.
8. [ ] The demo demonstrates controlled items, visibility, selection and a
   rejection/rollback.
9. [ ] `DEFERRED.md` lists every deferred capability and no deferred feature is
   described as implemented.
10. [ ] The docs state the accessibility/performance evidence status honestly.
11. [ ] Storybook includes 24/36-month, inspector/tooltip and exact PRT-01
    print stories.
12. [ ] No source photo, legacy code or unlicensed asset is published.
13. [ ] Security requirements verified: synthetic data only, no secrets, no raw
    HTML examples.

# Contributing

Thanks for considering a contribution to Year Planner for React.

## Developer Certificate of Origin

This project uses the [Developer Certificate of Origin (DCO) 1.1](https://developercertificate.org/).
Every commit must be signed off:

```bash
git commit -s -m "feat: describe the change"
```

The sign-off certifies that you have the right to submit the contribution under
the project's MIT license. There is no Contributor License Agreement.

## Before you start

- Search existing issues and discussions.
- For a substantial feature or API change, open an issue first so the design can
  be discussed before implementation.
- Keep changes focused; avoid unrelated refactors in the same pull request.

## Development workflow

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
pnpm verify
pnpm verify:full
```

`pnpm verify` is the fast gate. `pnpm verify:full` is the release gate: it adds the
browser, print and accessibility suites, the three-timezone date suite, the dependency
audit, the performance evidence and benchmarks, and the packed-tarball consumer proof.
`verify:full` records the performance numbers; run `PERF_STRICT=1 pnpm test:perf` or
`pnpm bench --enforce` to gate them. Run `pnpm test:quality` for the traceability and
contract checks and `pnpm test:licenses --write` after a dependency change.

The project uses strict TypeScript, Vitest, Playwright, Storybook and Biome.
All public APIs require TSDoc documentation.

## Flaky tests

Retries are disabled by default. A flaky test is fixed at the root cause or
quarantined with a linked issue. Use `pnpm test:flaky` (Chromium,
`--repeat-each=3`) to reproduce a suspected flake. Never add a retry to hide a
failure.

## Pull requests

A good pull request:

- explains the problem and the chosen approach;
- includes tests for new behavior and regressions;
- keeps public API changes documented and reviewed;
- preserves keyboard access and does not introduce color-only meaning;
- updates the API report and changelog when the public API changes.

## Accessibility and security

Accessibility and security issues are treated as first-class. Do not include
private data in examples or test fixtures. Report security issues according to
[SECURITY.md](./SECURITY.md).

## Code of conduct

By participating, you agree to follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).

# Contributing

Thanks for considering a contribution to Year Planner for React.

## Origin certification and sign-off

Every commit must be signed off:

```bash
git commit -s -m "feat: describe the change"
```

By signing off a contribution under this policy, you certify that:

- You created it or have sufficient permission to submit it under the grants below.
- You have obtained any required employer or other rights-holder permission.
- You have identified included third-party material and its licence terms.
- You understand that the contribution and sign-off are public records that may
  be retained and shared with the project.
- You agree to the contribution licence grant below for the submitted material.

This is a project-specific certification, not the Linux Foundation's DCO 1.1,
whose wording refers to an open-source licence. The existing CI job named `dco`
checks the `Signed-off-by` trailer; that historical job name does not change
these terms. A sign-off cannot supply rights the contributor does not have.

## Contribution licence grant

The project uses the [Year Planner Internal Use License 1.0](LICENSE). Its
maintainer, identified in the copyright notice as BlendSDK, may also build and
distribute commercial solutions. The internal-use licence alone would not give
the maintainer sufficient rights to distribute someone else's contributions.

By intentionally submitting and signing off original code, documentation or
other material for inclusion after this policy takes effect, you agree to both:

1. License your contribution to recipients under the project's licence above.
2. Grant BlendSDK a perpetual, worldwide, non-exclusive, irrevocable,
   royalty-free copyright licence to use, reproduce, modify, prepare derivative
   works of, display, perform, distribute, sublicense and sell your contribution
   and derivative works under any terms, including proprietary commercial terms,
   and to authorize others to do so. You also grant BlendSDK a worldwide,
   perpetual, non-exclusive, irrevocable, royalty-free patent licence, with the
   right to sublicense, to make, have made, use, offer for sale, sell and import
   your contribution alone or combined with the project as submitted. That
   patent grant covers only claims you can license that are necessarily infringed
   by your contribution alone or that combination.

You retain ownership of your contribution and may use or license your own work
elsewhere. You represent that you have authority to make these grants, including
any needed employer permission. Identify third-party material and its licence;
do not submit material whose terms prevent these grants. Material clearly marked
“not a contribution” is excluded from the grant and cannot be incorporated on
that basis. Ordinary usage questions and bug reports without proposed material
for inclusion are not contributions under this grant.

This policy applies prospectively, when it is first published with the project.
It does not expand rights in earlier contributions. Existing contributions and
dependencies keep their applicable terms and notices. The maintainer must have
sufficient rights in all material included in a distributed solution.

See the [licensing guide](docs/licensing.md) for permitted internal use,
earlier MIT grants and the distinction between contributions and private changes.

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

## Support and releases

Community support is best effort with no SLA; see [SUPPORT.md](./SUPPORT.md).
The release procedure, versioning and rollback steps are in
[docs/releasing.md](./docs/releasing.md). Public API changes need a changeset.

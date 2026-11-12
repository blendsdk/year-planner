# Security policy

## Supported versions

The current `0.x` line is supported. Security fixes are applied to the latest
minor; older pre-1.0 minors are best effort until a stable release exists.

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting** for this repository.
Do not open a public issue for a suspected vulnerability.

Include the affected version, a reproduction, and the impact you observed.

If private vulnerability reporting is not yet enabled, open a minimal public
issue asking for a private channel without including vulnerability details.

## Response process

| Stage | Commitment |
| ----- | ---------- |
| Acknowledgement | Within 3 business days |
| Triage | Within 10 business days; severity and affected versions confirmed |
| Fix | Critical and high issues are prioritized; a patched release is prepared privately |
| Disclosure | Coordinated, normally within 90 days or an agreed date; credit is offered |
| Dependency updates | Dependabot alerts plus `pnpm audit --audit-level high`; high or critical findings block a release |

We will keep the reporter informed through the private report and coordinate a
public advisory after a fix is available.

## Scope

This is a client-side React component library. It does not include a backend,
authentication, persistence, or authorization. Host applications remain
responsible for tenant isolation, authorization, data storage and booking
correctness.

The component must not leak hidden item details through the DOM, accessibility
tree, tooltips, diagnostics, inspector or print output. Visibility is
presentation, not authorization.

## Dependency updates

Dependabot proposes grouped minor and patch updates weekly. High and critical
advisories are fixed before a release; the release checklist runs
`pnpm audit --audit-level high`.

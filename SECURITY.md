# Security policy

## Supported versions

The project is pre-alpha. Security fixes are applied to the current development
line only until a stable release exists.

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting** for this repository.
Do not open a public issue for a suspected vulnerability.

Include the affected version, a reproduction, and the impact you observed. We
will acknowledge the report as soon as practical and coordinate disclosure.

## Scope

This is a client-side React component library. It does not include a backend,
authentication, persistence, or authorization. Host applications remain
responsible for tenant isolation, authorization, data storage and booking
correctness.

The component must not leak hidden item details through the DOM, accessibility
tree, tooltips, diagnostics or exports. Visibility is presentation, not
authorization.

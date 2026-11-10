# Toolchain Spike — M1

> **Date**: 2026-11-10
> **Status**: Verified for the reference environment

## Verified toolchain

| Tool | Version | Result |
|---|---|---|
| Node | 24.21.0 | pass |
| pnpm | 12.9.1 | pass |
| TypeScript | 6.0.3 | pass |
| Vite | 7.3.8 | pass |
| Vitest | 3.2.7 | pass |
| Storybook | 10.6.6 | build pass |
| Playwright | 1.65.0 | Chromium/Firefox/WebKit pass |
| Turbo | 2.11.10 | configured |
| Biome | 2.6.6 | pass |
| Changesets | 3.0.3 | configured |

## Compatibility finding

Vite 8 / Vitest 5 produced `Illegal instruction (core dumped)` on the reference
CPU (Intel i5-3470S, no AVX2) through the Rolldown native binding. Vite 7.3.8 +
Vitest 3.2.7 pass the full suite. This is recorded in the plan ambiguity register
AR #15 and requirements AR #79. Vite 8/Vitest 5 remain the target on compatible
hardware/CI; no behavior depends on the version.

## Evidence

- `pnpm verify` passes.
- `pnpm verify:full` passes: unit/component tests, Playwright Chromium/Firefox/
  WebKit, A3 print, clean consumer.
- Storybook static build succeeds.

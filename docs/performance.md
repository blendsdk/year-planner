# Performance Status

> **Conformance claim**: none. This page states measured results, not a guarantee
> for other hardware or data sets.

## Measured status

The reference evidence was recorded on a host: Intel i5-3470S, 4 vCPU,
14 GiB RAM, Ubuntu, Node 24, Chromium from Playwright 1.65. The numbers describe
that host; they are not a cross-device promise.

| Scenario | Before p95 | After p95 | Budget | Status |
| -------- | ---------- | --------- | ------ | ------ |
| Drag 500 items, compact | 33.4 ms | **16.7 ms** | 16.7 ms | pass |
| Drag 2,000 items, compact | 300 ms | **16.8 ms** | 16.7 ms | within one frame |
| Drag 10,000 items, compact (10 steps) | 8,916 ms | **66.6 ms** | 16.7 ms | recorded stress miss |
| Drag 36 months, 500 items | 100 ms | **16.7 ms** | 16.7 ms | pass |
| Development drag, 500 items | 416.6 ms | **16.7 ms** | report only | improved |
| Overflow open/close, 10,000 items | 115.3 ms | 118.3 ms | 100 ms | miss |
| Initial render, 500/2k/10k items | 414–50,458 ms | still above 150 ms | 150 ms | miss |
| Initial render, 12/14/18/24/36 months | 401–543 ms | still above 150 ms | 150 ms | miss |

The 10,000-item drag records 10 steps because the 14 GiB reference host cannot
complete 60 steps reliably; every report prints `n` beside the p95 so the
reduced sample is visible.

## Budgets

- Interaction budgets are 16.7 ms p95 (one 60 Hz frame), with 5% jitter
  tolerance.
- `pnpm test:perf` reports every budget and fails on a harness error or a 2×
  regression.
- `PERF_STRICT=1 pnpm test:perf` gates the interaction budgets and the issue #3
  oracle.
- `pnpm bench --enforce` gates the 2× regression ceiling; the 10,000-item drag
  keeps a 500 ms stress ceiling.

## Known misses

The initial render budget (150 ms) is not met at any tested item count. The
10,000-item overflow open/close is about 118 ms against the 100 ms budget. Both
are measured and recorded, not hidden; the issue #3 work targeted interaction
responsiveness, not first paint.

## Reproduce

```bash
pnpm bench                    # Node layout + production browser benchmarks
PERF_STRICT=1 pnpm test:perf  # gate the interaction budgets
pnpm test:perf                # report mode
```

Results and CPU profiles are in [docs/benchmarks/rd10-after.md](benchmarks/rd10-after.md)
and the full command/count record is in [docs/test-report.md](test-report.md).

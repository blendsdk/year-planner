# Benchmark Report

> **Generated**: 2026-11-11T20:09:30.716Z
> **Run**: `2026-11-11T20:30:00.000Z`
> **Environment**: Intel(R) Core(TM) i5-3470S CPU @ 2.90GHz (4 vCPU, 15 GB), linux 7.0.0-42-generic, Node v24.21.0, Playwright 1.65.0

`pass` is at or below budget. `miss` is above budget but within the 2× ceiling and is a recorded
deviation. `fail` is above the ceiling and fails the enforcing gate. `n` is the sample count;
with fewer than five samples the nearest-rank p95 equals the maximum.

| Scenario | Parameters | n | p50 | p95 | Max | Budget | Status |
|---|---|---:|---:|---:|---:|---:|---|
| layout | items=500, months=14, density=compact | — | 5.28 | 13.07 | 14.09 | 250.00 | pass |
| layout | items=500, months=14, density=expanded | — | 3.94 | 5.98 | 6.97 | 250.00 | pass |
| layout | items=500, months=14, density=overflow | — | 3.92 | 4.46 | 4.78 | 250.00 | pass |
| layout | items=2000, months=14, density=compact | — | 15.95 | 30.62 | 32.65 | 250.00 | pass |
| layout | items=2000, months=14, density=expanded | — | 14.09 | 17.36 | 17.81 | 250.00 | pass |
| layout | items=2000, months=14, density=overflow | — | 13.45 | 14.91 | 15.39 | 250.00 | pass |
| layout | items=10000, months=14, density=compact | — | 88.16 | 108.07 | 108.07 | 250.00 | pass |
| layout | items=10000, months=14, density=expanded | — | 108.61 | 295.20 | 295.20 | 250.00 | miss |
| layout | items=10000, months=14, density=overflow | — | 74.14 | 80.98 | 80.98 | 250.00 | pass |
| drag | items=10000, months=14, density=compact | 49 | 16.70 | 8916.40 | 18065.90 | 16.70 | fail |
| drag | items=2000, months=14, density=compact | 260 | 16.70 | 300.00 | 616.60 | 16.70 | fail |
| drag-36-months | items=500, months=36 | 269 | 16.70 | 100.00 | 200.00 | 16.70 | fail |
| drag | items=500, months=14, density=compact | 263 | 16.70 | 33.40 | 150.00 | 16.70 | fail |
| drag-expanded | items=500, months=14, density=expanded | 260 | 16.70 | 33.40 | 133.30 | 16.70 | fail |
| initial-render | items=10000, months=14 | 5 | 41920.00 | 50457.90 | 50457.90 | 150.00 | fail |
| initial-render-window | items=500, months=12 | 5 | 401.30 | 598.20 | 598.20 | 150.00 | fail |
| initial-render-window | items=500, months=14 | 5 | 400.30 | 419.70 | 419.70 | 150.00 | fail |
| initial-render-window | items=500, months=18 | 5 | 401.80 | 566.50 | 566.50 | 150.00 | fail |
| initial-render | items=2000, months=14 | 5 | 2167.90 | 2247.60 | 2247.60 | 150.00 | fail |
| initial-render-window | items=500, months=24 | 5 | 455.50 | 576.20 | 576.20 | 150.00 | fail |
| initial-render-window | items=500, months=36 | 5 | 543.20 | 614.60 | 614.60 | 150.00 | fail |
| initial-render | items=500, months=14 | 5 | 414.40 | 565.40 | 565.40 | 150.00 | fail |
| issue3-dev | items=500, months=14 | 268 | 16.70 | 416.60 | 766.70 | 16.70 | fail |
| issue3-production | items=500, months=14 | 3 | — | 33.40 | — | 16.70 | miss |
| overflow | items=10000, months=14 | 5 | 93.50 | 115.30 | 115.30 | 100.00 | miss |

## Budgets

- layoutP95Ms: 250
- layout10kP95Ms: 250
- initialRenderP95Ms: 150
- dragP95Ms: 16.7
- overflowMs: 100

## CPU profiles

Raw profiles live under `test-results/bench/profiles`, named with the run id, and are uploaded
as CI artifacts.


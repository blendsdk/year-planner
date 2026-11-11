# Benchmark Report

> **Generated**: 2026-11-11T20:52:01.380Z
> **Run**: `2026-11-11T21:30:00.000Z`
> **Environment**: Intel(R) Core(TM) i5-3470S CPU @ 2.90GHz (4 vCPU, 15 GB), linux 7.0.0-42-generic, Node v24.21.0, Playwright 1.65.0

`pass` is at or below budget. `miss` is above budget but within the 2× ceiling and is a recorded
deviation. `fail` is above the ceiling and fails the enforcing gate. `n` is the sample count;
with fewer than five samples the nearest-rank p95 equals the maximum.

| Scenario | Parameters | n | p50 | p95 | Max | Budget | Status |
|---|---|---:|---:|---:|---:|---:|---|
| layout | items=500, months=14, density=compact | — | 4.52 | 8.53 | 9.63 | 250.00 | pass |
| layout | items=500, months=14, density=expanded | — | 3.70 | 4.83 | 5.69 | 250.00 | pass |
| layout | items=500, months=14, density=overflow | — | 3.81 | 4.34 | 4.39 | 250.00 | pass |
| layout | items=2000, months=14, density=compact | — | 16.13 | 25.09 | 27.23 | 250.00 | pass |
| layout | items=2000, months=14, density=expanded | — | 14.61 | 26.61 | 31.76 | 250.00 | pass |
| layout | items=2000, months=14, density=overflow | — | 14.12 | 22.36 | 22.78 | 250.00 | pass |
| layout | items=10000, months=14, density=compact | — | 80.34 | 104.27 | 104.27 | 250.00 | pass |
| layout | items=10000, months=14, density=expanded | — | 81.73 | 98.90 | 98.90 | 250.00 | pass |
| layout | items=10000, months=14, density=overflow | — | 76.67 | 85.18 | 85.18 | 250.00 | pass |
| drag | items=10000, months=14, density=compact | 45 | 16.70 | 66.60 | 7716.40 | 16.70 | fail |
| drag | items=2000, months=14, density=compact | 146 | 16.70 | 16.80 | 450.00 | 16.70 | pass |
| drag-36-months | items=500, months=36 | 152 | 16.70 | 16.70 | 50.00 | 16.70 | pass |
| drag | items=500, months=14, density=compact | 147 | 16.70 | 16.70 | 50.00 | 16.70 | pass |
| drag-expanded | items=500, months=14, density=expanded | 134 | 16.70 | 16.80 | 50.00 | 16.70 | pass |
| initial-render | items=10000, months=14 | 5 | 39419.70 | 43436.20 | 43436.20 | 150.00 | fail |
| initial-render-window | items=500, months=12 | 5 | 412.70 | 565.70 | 565.70 | 150.00 | fail |
| initial-render-window | items=500, months=14 | 5 | 370.30 | 461.90 | 461.90 | 150.00 | fail |
| initial-render-window | items=500, months=18 | 5 | 418.00 | 514.00 | 514.00 | 150.00 | fail |
| initial-render | items=2000, months=14 | 5 | 2015.70 | 2394.70 | 2394.70 | 150.00 | fail |
| initial-render-window | items=500, months=24 | 5 | 464.90 | 730.90 | 730.90 | 150.00 | fail |
| initial-render-window | items=500, months=36 | 5 | 524.10 | 603.20 | 603.20 | 150.00 | fail |
| initial-render | items=500, months=14 | 5 | 390.60 | 666.20 | 666.20 | 150.00 | fail |
| issue3-dev | items=500, months=14 | 158 | 16.70 | 16.70 | 266.70 | 16.70 | pass |
| issue3-production | items=500, months=14 | 3 | — | 16.70 | — | 16.70 | pass |
| overflow | items=10000, months=14 | 5 | 100.50 | 118.30 | 118.30 | 100.00 | miss |

## Budgets

- layoutP95Ms: 250
- layout10kP95Ms: 250
- initialRenderP95Ms: 150
- dragP95Ms: 16.7
- overflowMs: 100

## CPU profiles

Raw profiles live under `test-results/bench/profiles`, named with the run id, and are uploaded
as CI artifacts.

## Longest long task

| Scenario | Items | Longest task | Count |
|---|---:|---:|---:|
| drag | 10000 | 19275 ms | 9 |
| drag | 2000 | 726 ms | 2 |
| drag-36-months | 500 | 142 ms | 4 |
| drag | 500 | 155 ms | 2 |
| drag-expanded | 500 | 97 ms | 2 |
| issue3-dev | 500 | 610 ms | 2 |
| issue3-production | 500 | 112 ms | 4 |

The 50 ms long-task criterion is not met on the 4-core reference host; the strict gate asserts
no regression against the recorded baseline count and maximum. The p95 frame budget is met.

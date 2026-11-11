# Benchmark Report

> **Generated**: 2026-11-11T18:13:37.160Z
> **Environment**: Intel(R) Core(TM) i5-3470S CPU @ 2.90GHz (4 vCPU, 15 GB), linux 7.0.0-42-generic, Node v24.21.0

`pass` is at or below budget. `miss` is above budget but within the 2× ceiling and is a recorded
deviation. `fail` is above the ceiling and fails the gate.

| Scenario | Parameters | p50 | p95 | Max | Budget | Status |
|---|---|---|---|---|---|---|
| layout | items=500, months=14, density=compact | 4.16 | 5.99 | 6.41 | 150.00 | pass |
| layout | items=500, months=14, density=expanded | 3.59 | 4.64 | 4.68 | 150.00 | pass |
| layout | items=500, months=14, density=overflow | 3.48 | 4.22 | 4.70 | 150.00 | pass |
| layout | items=2000, months=14, density=compact | 14.06 | 15.03 | 15.04 | 150.00 | pass |
| layout | items=2000, months=14, density=expanded | 13.34 | 15.67 | 16.42 | 150.00 | pass |
| layout | items=2000, months=14, density=overflow | 13.93 | 17.13 | 17.88 | 150.00 | pass |
| layout | items=10000, months=14, density=compact | 80.57 | 93.74 | 93.74 | 250.00 | pass |
| layout | items=10000, months=14, density=expanded | 73.01 | 76.36 | 76.36 | 250.00 | pass |
| layout | items=10000, months=14, density=overflow | 74.12 | 82.68 | 82.68 | 250.00 | pass |
| drag | items=10000, months=14, density=compact | 16.70 | 8499.70 | 17982.60 | 16.70 | fail |
| drag | items=2000, months=14, density=compact | 16.70 | 366.70 | 666.60 | 16.70 | fail |
| drag-36-months | items=500, months=36 | 16.70 | 83.30 | 216.60 | 16.70 | fail |
| drag | items=500, months=14, density=compact | 16.70 | 33.40 | 133.40 | 16.70 | fail |
| drag-expanded | items=500, months=14, density=expanded | 16.70 | 50.00 | 133.30 | 16.70 | fail |
| initial-render | items=10000, months=14 | 44496.30 | 45715.40 | 45715.40 | 150.00 | fail |
| initial-render-window | items=500, months=12 | 486.40 | 571.80 | 571.80 | 150.00 | fail |
| initial-render-window | items=500, months=14 | 567.70 | 607.20 | 607.20 | 150.00 | fail |
| initial-render-window | items=500, months=18 | 499.70 | 567.50 | 567.50 | 150.00 | fail |
| initial-render | items=2000, months=14 | 2299.30 | 2370.00 | 2370.00 | 150.00 | fail |
| initial-render-window | items=500, months=24 | 589.60 | 665.30 | 665.30 | 150.00 | fail |
| initial-render-window | items=500, months=36 | 678.90 | 743.00 | 743.00 | 150.00 | fail |
| initial-render | items=500, months=14 | 503.40 | 654.10 | 654.10 | 150.00 | fail |
| issue3-dev | items=500, months=14 | 16.70 | 366.70 | 933.40 | 16.70 | fail |
| issue3-production | items=500, months=14 | — | 49.90 | — | 16.70 | fail |
| overflow | items=10000, months=14 | 100.30 | 119.40 | 119.40 | 100.00 | miss |

## Budgets

- layout10kP95Ms: 250
- dragP95Ms: 16.7
- overflowMs: 100
- initialRenderP95Ms: 150
- reactEntryCssKb: 60
- totalInstalledKb: 65

## CPU profiles

Raw profiles live under `test-results/bench/profiles` and are uploaded as CI artifacts.


# Performance: measured scope

[Русский](<../performance.md>) · [English](<performance.md>) · [Contents](<README.md>)

Historical storage microbenchmark: Windows, AMD Ryzen 9 5900X, 63.9 GiB RAM and Node 24.19.0; 1920×1080 scenes with 1/50/200 text objects. Each object stores metadata and separate values. Run node tools/performance.mjs; results remain local in artifacts/performance.json.

| Text objects | Save, ms | Open, ms | RSS, MiB |
|---|---:|---:|---:|
| 1 | 28.66 | 12.41 | 51.1 |
| 50 | 541.07 | 141.86 | 56.4 |
| 200 | 1787.77 | 525.42 | 56.6 |

This checkpoint syncs every JSON and maintains a backup index: one run, warm/unflushed filesystem caches and no confidence intervals. RSS is a sample, not peak memory. An earlier no-sync/no-backup version was faster but is not a controlled A/B. CPU evaluation microbenchmarks exclude Canvas rasterization and do not measure UI FPS.

Fog/stars/network harnesses measure synchronous warmed evaluate/render without React, vsync or encoding. Bounded caches, disposal, paused redraw and density/mask budgets are functionally checked. Additional Canvas views incur separate work; layer count is not free.

Complete p95/p99 edit latency, sustained load/peak memory, GPU comparison and export throughput/cancellation remain unmeasured. Revisions are not automatically collected. Do not infer universal performance from these numbers.

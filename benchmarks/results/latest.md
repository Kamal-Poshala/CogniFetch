## Retrieval latency benchmark

_2026-09-09T07:05:07.126Z · 13th Gen Intel(R) Core(TM) i7-13650HX (20 cores) · Node v22.14.0 · win32-x64_

Corpus: **12,000 documents**, 31,651 unique terms.
Workload: 200 queries × 30 iterations (3 warm-up), snippets off.

| Scorer | mean | p50 | p95 | p99 | max | QPS |
|---|---:|---:|---:|---:|---:|---:|
| Inverted index + TF-IDF cosine | 0.17 ms | 0.04 ms | 0.79 ms | 1.24 ms | 2.21 ms | 5860 |
| Linear scan (baseline) | 3.52 ms | 3.40 ms | 5.91 ms | 6.86 ms | 9.01 ms | 284 |

**Inverted index vs linear scan:** 7.5× faster at p95, 20.6× faster on average — a **87% p95 latency reduction** (95% mean).
p95 query latency: **0.79 ms**.

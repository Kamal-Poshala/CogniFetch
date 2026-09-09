## Retrieval latency benchmark

_2026-09-09T06:41:11.408Z · 13th Gen Intel(R) Core(TM) i7-13650HX (20 cores) · Node v22.14.0 · win32-x64_

Corpus: **12,000 documents**, 31,651 unique terms.
Workload: 200 queries × 25 iterations (3 warm-up), snippets off.

| Scorer | mean | p50 | p95 | p99 | max | QPS |
|---|---:|---:|---:|---:|---:|---:|
| Inverted index + TF-IDF cosine | 0.18 ms | 0.04 ms | 0.81 ms | 1.31 ms | 2.33 ms | 5571 |
| Linear scan (baseline) | 3.67 ms | 3.56 ms | 6.13 ms | 7.03 ms | 8.35 ms | 272 |

**Inverted index vs linear scan:** 7.6× faster at p95, 20.4× faster on average — a **87% p95 latency reduction** (95% mean).
p95 query latency: **0.81 ms**.

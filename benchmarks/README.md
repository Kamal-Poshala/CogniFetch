# @cognifetch/benchmarks

Times `RetrievalEngine.search()` (inverted index) against `searchLinear()`
(full scan) over an identical workload, and reports p50/p90/p95/p99, QPS,
speedup, and latency-reduction %.

```bash
npm run bench                                   # uses data/bench or data/seed
npm run bench -- --input path/to/corpus.jsonl --iterations 25 --queries 200
```

Outputs `benchmarks/results/latest.{json,md}`. The committed `latest.md` is a
12,000-document run; `data/bench/corpus.jsonl` is not committed (regenerate with
`npm run seed:harvest -- --count 12000 --output data/bench/corpus.jsonl`).

The workload is 50 curated academic queries plus deterministic synthetic queries
drawn from mid-frequency corpus vocabulary (seeded PRNG, so runs are comparable).

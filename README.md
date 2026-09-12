# CogniFetch

**A full-text search engine for academic papers** — a hand-rolled inverted index
with TF-IDF cosine ranking over 12,000+ arXiv abstracts, an OCR ingestion
pipeline that turns scanned PDFs into searchable records, a REST API, and a
React search UI.

No search library. The tokenizer, Porter stemmer, inverted index, cosine
scorer, and top-K selection are all implemented from scratch in
[`packages/engine`](packages/engine) so the ranking behaviour and its cost are
fully inspectable.

```
┌── ingestion ─────────────┐   ┌── query path ──────────────────────────┐
│ arXiv OAI-PMH ─┐         │   │  GET /api/search?q=…                    │
│ scanned PDFs ──┤→ Mongo ─┼──→│  → analyse → union query-term postings │
│  (OCR + NLP) ──┘  (docs) │   │  → cosine(ltc query, lnc docs) → top-K │
└──────────────────────────┘   │  → snippets + facets → JSON            │
         │                     └────────────────────────────────────────┘
         └─ index builder → gzipped inverted index in GridFS
```

## Numbers

Measured, reproducible — see [`benchmarks/`](benchmarks) and
[`packages/ingest`](packages/ingest).

### Query latency — inverted index vs. linear scan

12,000 documents · 31,651 terms · 200-query workload · Intel i7-13650HX · Node 22

| Scorer | mean | p50 | p95 | p99 | QPS |
|---|---:|---:|---:|---:|---:|
| **Inverted index + TF-IDF cosine** | 0.17 ms | 0.04 ms | **0.79 ms** | 1.24 ms | 5,860 |
| Linear scan (identical scores, every doc) | 3.52 ms | 3.40 ms | 5.91 ms | 6.86 ms | 284 |

**→ 7.5× faster at p95, 87% p95 latency reduction.** Regenerate with `npm run bench`
([`benchmarks/results/latest.md`](benchmarks/results/latest.md)).

### OCR ingestion accuracy

2,500 held-out papers → degraded page scans → OCR → structured records, scored
against the rendered ground truth:

| Median CER | Mean CER | Mean WER | p90 CER | Quality-gate pass |
|---:|---:|---:|---:|---:|
| 0.00% | 1.09% | 1.62% | 0.30% | 99.9% |

The overwhelming majority of pages OCR essentially perfectly; the small mean
is a long tail of notation- and diagram-dense pages, which is exactly where
OCR of academic text is genuinely hard (see
[`benchmarks/results/ocr-accuracy.md`](benchmarks/results/ocr-accuracy.md) for
the worst cases). Regenerate against a fresh 2,500-paper held-out set with:

```bash
npm run seed:harvest -- --count 2500 --sets cs --from 2024-01-01 --until 2024-12-31 --output data/bench/heldout-2500.jsonl
npm run ocr:synth -- --input data/bench/heldout-2500.jsonl --count 2500 --out data/ocr-full
npm run ocr:run -- --out data/ocr-full && npm run ocr:eval -- --out data/ocr-full
```

## Quick start (Docker)

```bash
docker compose up --build
```

Brings up MongoDB, seeds it with the committed 600-document corpus, builds the
index, and starts the API and UI:

- UI → <http://localhost:8080>
- API → <http://localhost:3500/api/search?q=diffusion+models>

## Local development

Requires Node 22+ and a MongoDB instance (`mongodb://localhost:27017`).

```bash
npm install
cp .env.example .env                 # defaults work for a local Mongo

npm run ingest:demo                  # load the seed corpus + build the index
#   or: npm run harvest -- --limit 12000   (harvest a real corpus from arXiv)

npm run dev                          # API on :3500, Vite UI on :5173
```

Other useful commands:

| Command | Does |
|---|---|
| `npm test` | all workspace test suites (112 tests) |
| `npm run lint` / `npm run typecheck` | ESLint (type-checked) / `tsc` |
| `npm run bench` | latency benchmark → `benchmarks/results/` |
| `npm run search:file -- "your query"` | ad-hoc search against a JSONL corpus, no DB |
| `npm run harvest -- --limit N` | harvest N arXiv abstracts via OAI-PMH |
| `npm run ocr:synth && npm run ocr:run && npm run ocr:eval` | the OCR pipeline |

## How it works

Full write-up in [`ARCHITECTURE.md`](ARCHITECTURE.md). In short:

- **Analysis** — Unicode-normalise → split → stopword filter → Porter stem.
- **Index** — `term → [{doc, tf}]` postings; per-document `lnc` vector norms
  precomputed. Title terms are frequency-boosted.
- **Ranking** — cosine similarity between an `ltc` query vector and `lnc`
  document vectors (SMART notation), scoring only the documents that appear in
  a query term's postings. A `TopKHeap` keeps the top results without sorting
  the full candidate set. `RetrievalEngine.searchLinear()` computes the same
  numbers by scanning every document — that's the benchmark baseline.
- **Persistence** — MongoDB holds the documents; the built index is serialised,
  gzipped, and stored in GridFS for fast API cold-starts (falling back to an
  in-memory rebuild).
- **OCR** — held-out papers are rendered to page images, degraded (skew, blur,
  Gaussian noise, JPEG recompression), OCR'd with `tesseract.js`, de-hyphenated
  and segmented into `{title, abstract}`, gated on an English-prose heuristic,
  and indexed with their measured error rate recorded as provenance.

## Project layout

```
packages/engine    retrieval library — zero runtime dependencies
packages/ingest    arXiv OAI-PMH harvester, index builder, OCR pipeline, CLIs
packages/server    Express REST API (search / documents / stats / health)
apps/web           React + Vite + Tailwind search UI
benchmarks         inverted-index vs linear-scan latency harness
data/seed          committed 600-doc corpus + 120-doc held-out set (offline demo)
```

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for MongoDB Atlas + Render (API) + Vercel (UI).

## Notes

- arXiv metadata is harvested via OAI-PMH from `export.arxiv.org` under the
  [arXiv API Terms of Use](https://info.arxiv.org/help/api/tou.html) — metadata
  only, rate-limited to one request per 3 seconds, with links back to arXiv.
- TypeScript is pinned to 5.9 (not the 7.x native compiler) because
  `typescript-eslint` does not yet support TS ≥ 6.1; revisit when it does.

## License

MIT — see [`LICENSE`](LICENSE).

# @cognifetch/ingest

MongoDB persistence + ingestion pipelines + CLIs.

`@cognifetch/ingest` — Mongo layer, arXiv harvester, index store.
`@cognifetch/ingest/ocr` — the OCR pipeline (`sharp`, `tesseract.js`, `pdf-lib`),
kept separate so the API server doesn't pull in native deps.

## CLIs

Run from the repo root (`npm run <name> -- <args>`).

| Command | Purpose |
|---|---|
| `harvest -- --limit N [--sets cs,stat]` | harvest N arXiv abstracts into `documents` |
| `seed:harvest -- --count N --output f.jsonl` | harvest to a JSONL file (no DB) |
| `seed:load -- --input f.jsonl` | load a JSONL corpus into `documents` |
| `index:build` | build + gzip + persist the inverted index to GridFS |
| `seed:index` | idempotent load-if-empty + build-if-stale (compose bootstrap) |
| `search:file -- "query"` | ad-hoc search against a JSONL file |
| `ocr:synth -- --count N` | render held-out papers to degraded scan PDFs |
| `ocr:run` | OCR every scan, structure + score it (resumable) |
| `ocr:eval` | aggregate CER/WER → `benchmarks/results/ocr-accuracy.md` |
| `ocr:ingest` | load passing OCR docs as `source: 'ocr'` |

## Collections

- `documents` — `StoredDocument` (`_id` = arXiv id, `source: 'arxiv' | 'ocr'`)
- `index_meta` — current index stats
- `search_index.*` — GridFS bucket holding the gzipped serialised index

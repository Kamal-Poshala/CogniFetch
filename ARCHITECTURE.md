# Architecture

## Overview

CogniFetch is an npm-workspaces monorepo. Data flows in one direction:

```
arXiv OAI-PMH ─┐
               ├─→ MongoDB `documents` ─→ index builder ─→ in-memory RetrievalEngine ─→ REST API ─→ React UI
scanned PDFs ──┘        ▲                       │
   (OCR + NLP)          │                       └─→ gzipped serialised index in GridFS (fast cold-start)
                        └─ `source: 'arxiv' | 'ocr'` with OCR error rate as provenance
```

| Workspace | Responsibility | Runtime deps |
|---|---|---|
| `packages/engine` | Analysis, inverted index, scoring, snippets, serialisation | **none** |
| `packages/ingest` | Harvest, index build/persist, OCR pipeline, CLIs | `mongodb`, `fast-xml-parser`, `zod`; OCR extras behind `@cognifetch/ingest/ocr` |
| `packages/server` | HTTP API, request validation, middleware | `express`, `helmet`, `zod`, `pino`, `mongodb` |
| `apps/web` | Search UI | `react`, `react-router-dom` |
| `benchmarks` | Latency measurement harness | — |

## The retrieval engine

### Text analysis (`tokenizer.ts`, `stemmer.ts`)

1. NFKD normalise, strip combining marks, lowercase.
2. Split on non-alphanumeric (`\p{L}\p{N}` runs).
3. Drop a trimmed English stopword list (kept small — academic abstracts lean on
   words a web stoplist would remove).
4. Length filter (2–40 chars).
5. Porter stemmer (1980), implemented from the paper; verified against a table
   of known full-stemmer outputs.

Query and document text go through the identical pipeline.

### Inverted index (`engine.ts`)

```
dictionary: Map<term, { df, postings: [{ doc, tf }] }>
docs:       [{ externalId, title, body, meta, length, norm }]
```

- Internal dense integer `doc` ids keep postings compact.
- `tf` is *effective* frequency — title occurrences are pre-multiplied by
  `titleBoost` (default 3).
- Postings are sorted by `doc` at `finalize()`.
- `norm` is the Euclidean norm of the document's `lnc` weight vector,
  precomputed so scoring never touches the raw term list.

### Scoring — SMART `ltc.lnc` cosine

For a document *d* and query *q*, the score is the cosine of

- **document vector (`lnc`)**: weight of term *t* = `1 + ln(tf_{t,d})`, then
  cosine-normalised by the precomputed `norm`.
- **query vector (`ltc`)**: weight of term *t* = `(1 + ln(tf_{t,q})) · ln(N / df_t)`,
  cosine-normalised by the query norm.

The scoring loop only visits documents that appear in some query term's postings
list:

```
for each query term t (with weight w_t):
    for each posting (d, tf) in postings[t]:
        score[d] += w_t · (1 + ln(tf))
for each touched d:
    score[d] /= (norm[d] · queryNorm)     # → cosine similarity
```

Terms with zero IDF (`df == N`) are dropped — they contribute nothing to a
cosine and only add work.

Restricting to posting-list documents is **exact**, not approximate: any
document sharing no term with the query has cosine 0 anyway. `searchLinear()`
proves this by scoring every document and producing byte-identical results —
it exists purely as the benchmark baseline.

### Top-K without a full sort (`heap.ts`)

`TopKHeap` is a bounded min-heap ordered by `(score desc, doc id asc)`. Scoring
offers every touched document; the heap keeps only the best `offset + limit`.
The tie-break on doc id makes results deterministic regardless of the order
postings are visited.

### Snippets (`snippet.ts`)

The engine's snippet output is **HTML-escaped**, then `<mark>` tags are inserted
around matching tokens — the UI parses those tags rather than trusting raw HTML.
A sliding token window picks the densest cluster of matches.

### Facets & filters

`search({ facets: ['primaryCategory'], filters: { primaryCategory: ['cs.LG'] } })`
tallies metadata values across the **whole matched set** (not just the returned
page) during the same touched-document loop, and drops documents failing a
filter before they reach the heap.

### Persistence (`packages/ingest/index-store.ts`)

`toJSON()` / `fromJSON()` round-trip the dictionary + document records without
re-analysing text. The index builder gzips that JSON and stores it in a GridFS
bucket; `getEngine()` loads the blob when its `docCount` matches the corpus,
otherwise rebuilds from `documents` in ~2.5 s for 12k docs.

## Ingestion

### arXiv harvester (`arxiv/oai-client.ts`, `arxiv/harvester.ts`)

OAI-PMH `ListRecords` with the `arXiv` metadata prefix. Handles
`resumptionToken` paging, a ≥ 3 s politeness delay, HTTP 503 `Retry-After`, and
deleted-record tombstones. Abstracts get light de-TeX + de-hyphenation +
whitespace normalisation. Upserts are idempotent, so an interrupted harvest
resumes by re-running.

### OCR pipeline (`@cognifetch/ingest/ocr`)

| Stage | Module | What |
|---|---|---|
| synth | `ocr/synth.ts` | render a paper to an SVG page → raster (`sharp`) → skew + Gaussian noise + blur + brightness jitter + JPEG recompression → one-page PDF (`pdf-lib`) + PNG. Deterministic per `seed ⊕ hash(id)`. |
| recognise | `ocr/recognize.ts` | pooled `tesseract.js` worker over the page raster |
| structure | `ocr/nlp.ts` | de-hyphenate, de-speckle, `\|`→`I`; split first block as title; English-stopword-ratio gate |
| score | `ocr/eval.ts` | Levenshtein CER / WER vs. rendered ground truth; length-weighted aggregates |
| ingest | `cli/ocr-ingest.ts` | write passing docs as `source: 'ocr'` with `{cer, wer, engine}` provenance |

Third-party (non-synthetic) PDFs would need a rasterisation step
(`pdftoppm` / `pdfjs`) before `recognise`; the reproducible pipeline doesn't
require one.

## API (`packages/server`)

- `createApp(service)` is pure — no listening, no DB — so `app.test.ts` drives
  it with an `InMemoryDocumentStore` over the seed corpus.
- `SearchService` is the only thing routes depend on; it wraps the engine and a
  `DocumentStore` interface (Mongo or in-memory).
- Middleware: `helmet`, CORS allowlist, per-IP rate limit, `pino-http` request
  logs, `Server-Timing` header, a typed `{ error: { code, message } }` envelope,
  graceful shutdown.
- `server.ts` boots the index via `getEngine()` before it starts listening;
  `/health` returns 503 until the index has documents.

## Testing

112 tests. Engine tests assert ranking correctness on hand-verified fixtures and
that `search()` ≡ `searchLinear()`. Ingest tests cover OAI parsing/paging/throttle,
text normalisation, and OCR metrics. Server tests are `supertest` integration
tests against the real seed corpus. Web tests drive `<App>` with a mocked
`fetch` (happy-dom + Testing Library).

## Tooling decisions

- **TypeScript 5.9**, not 7.x — `typescript-eslint` requires `typescript < 6.1`.
- **ESM everywhere**, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`.
- Vitest projects live in a root `vitest.config.ts` (`test.projects`) so the
  browser-environment app config loads correctly from the repo root.

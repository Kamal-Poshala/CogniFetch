# @cognifetch/engine

Framework-free retrieval library. **Zero runtime dependencies.**

```ts
import { RetrievalEngine } from '@cognifetch/engine';

const engine = RetrievalEngine.build([
  { id: 'a', title: 'Distributed Consensus', body: 'byzantine fault tolerance…', meta: { cat: 'cs.DC' } },
  // …
]);

engine.search({ query: 'byzantine consensus', limit: 10, facets: ['cat'] });
// → { hits: [{ id, score, rank, snippet, matchedTerms, meta }], facets, totalHits, tookMs }
```

- `analyze` / `stem` / `tokenizeRaw` — the text pipeline
- `RetrievalEngine` — inverted index + TF-IDF (`ltc.lnc`) cosine ranking, facets,
  filters, `<mark>` snippets, `toJSON()` / `fromJSON()` persistence
- `RetrievalEngine.searchLinear()` — identical scores by full scan; the
  benchmark baseline (requires `{ keepDocTerms: true }`)
- `TopKHeap` — bounded, deterministic top-K selection

See [`ARCHITECTURE.md`](../../ARCHITECTURE.md#the-retrieval-engine) for the
scoring math.

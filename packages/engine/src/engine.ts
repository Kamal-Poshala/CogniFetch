import { analyze, analyzeQuery } from './tokenizer.js';
import { TopKHeap } from './heap.js';
import { makeSnippet, DEFAULT_SNIPPET_OPTIONS, type SnippetOptions } from './snippet.js';
import {
  DEFAULT_OPTIONS,
  type EngineDocument,
  type EngineOptions,
  type Posting,
  type SearchHit,
  type SearchParams,
  type SearchResult,
  type SerializedIndex,
  type TermEntry,
} from './types.js';

interface DocRecord {
  externalId: string;
  title: string;
  body: string;
  length: number;
  /** Euclidean norm of the lnc weight vector. */
  norm: number;
  /** term -> effective term frequency (title occurrences already boosted). Kept
   * only when `keepDocTerms` is enabled (needed by the linear baseline). */
  terms: Map<string, number> | undefined;
}

export interface BuildConfig extends Partial<EngineOptions> {
  /** Retain per-document term maps so {@link RetrievalEngine.searchLinear} works.
   * Costs memory (~tens of MB for 10k abstracts); off by default. */
  keepDocTerms?: boolean;
  snippet?: Partial<SnippetOptions>;
}

const lnPlus1 = (x: number): number => 1 + Math.log(x);

/**
 * In-memory retrieval engine.
 *
 * Indexing builds a classic inverted index (term -> postings) plus per-document
 * lnc vector norms. {@link search} scores with cosine similarity between an
 * `ltc` query vector and `lnc` document vectors, visiting only the postings of
 * the query terms. {@link searchLinear} computes the identical scores by
 * scanning every document — the baseline the README benchmark compares against.
 */
export class RetrievalEngine {
  readonly options: EngineOptions;
  private readonly snippetOptions: SnippetOptions;
  private readonly dictionary = new Map<string, TermEntry>();
  private readonly docs: DocRecord[] = [];
  private readonly externalToInternal = new Map<string, number>();
  private keepDocTerms: boolean;

  // Reusable scoring scratch (engine scoring is synchronous; safe to share).
  private scratchScores = new Float64Array(0);
  private scratchSeen = new Int32Array(0);
  private scratchMatched = new Int32Array(0);
  private scratchGeneration = 0;

  constructor(config: BuildConfig = {}) {
    const { keepDocTerms, snippet, ...opts } = config;
    this.options = { ...DEFAULT_OPTIONS, ...opts };
    this.snippetOptions = { ...DEFAULT_SNIPPET_OPTIONS, ...snippet };
    this.keepDocTerms = keepDocTerms ?? false;
  }

  get size(): number {
    return this.docs.length;
  }

  get vocabularySize(): number {
    return this.dictionary.size;
  }

  /** Build an engine from a document collection in one shot. */
  static build(documents: Iterable<EngineDocument>, config: BuildConfig = {}): RetrievalEngine {
    const engine = new RetrievalEngine(config);
    for (const doc of documents) engine.addDocument(doc);
    engine.finalize();
    return engine;
  }

  /** Add a single document. Call {@link finalize} once all documents are added. */
  addDocument(doc: EngineDocument): void {
    if (this.externalToInternal.has(doc.id)) {
      throw new Error(`Duplicate document id: ${doc.id}`);
    }
    const internal = this.docs.length;
    this.externalToInternal.set(doc.id, internal);

    const titleTokens = analyze(doc.title, this.options);
    const bodyTokens = analyze(doc.body, this.options);

    const tf = new Map<string, number>();
    for (const t of titleTokens) tf.set(t.term, (tf.get(t.term) ?? 0) + this.options.titleBoost);
    for (const t of bodyTokens) tf.set(t.term, (tf.get(t.term) ?? 0) + 1);

    let sumSq = 0;
    for (const [term, freq] of tf) {
      const w = lnPlus1(freq);
      sumSq += w * w;
      let entry = this.dictionary.get(term);
      if (!entry) {
        entry = { df: 0, postings: [] };
        this.dictionary.set(term, entry);
      }
      entry.df += 1;
      entry.postings.push({ doc: internal, tf: freq });
    }

    this.docs.push({
      externalId: doc.id,
      title: doc.title,
      body: doc.body,
      length: titleTokens.length + bodyTokens.length,
      norm: Math.sqrt(sumSq) || 1,
      terms: this.keepDocTerms ? tf : undefined,
    });
  }

  /** Sort postings and size the scoring scratch buffers. Idempotent. */
  finalize(): void {
    for (const entry of this.dictionary.values()) {
      entry.postings.sort((a, b) => a.doc - b.doc);
    }
    this.resizeScratch();
  }

  private resizeScratch(): void {
    const n = this.docs.length;
    if (this.scratchScores.length !== n) {
      this.scratchScores = new Float64Array(n);
      this.scratchSeen = new Int32Array(n);
      this.scratchMatched = new Int32Array(n);
      this.scratchGeneration = 0;
    }
  }

  hasDocument(id: string): boolean {
    return this.externalToInternal.has(id);
  }

  getDocument(id: string): EngineDocument | undefined {
    const internal = this.externalToInternal.get(id);
    if (internal === undefined) return undefined;
    const rec = this.docs[internal]!;
    return { id: rec.externalId, title: rec.title, body: rec.body };
  }

  /** Analyse a query into the stemmed terms used for retrieval. */
  analyzeQuery(query: string): string[] {
    return analyzeQuery(query, this.options);
  }

  /**
   * Score using the inverted index: visit only postings of the query terms.
   */
  search(params: SearchParams): SearchResult {
    return this.run(params, /* linear */ false);
  }

  /**
   * Score by scanning every document. Same numbers as {@link search}; exists so
   * the benchmark can quantify the inverted index's speedup.
   */
  searchLinear(params: SearchParams): SearchResult {
    if (!this.keepDocTerms) {
      throw new Error('searchLinear requires the engine to be built with { keepDocTerms: true }');
    }
    return this.run(params, /* linear */ true);
  }

  private run(params: SearchParams, linear: boolean): SearchResult {
    const started = performance.now();
    const limit = Math.max(1, params.limit ?? 10);
    const offset = Math.max(0, params.offset ?? 0);
    const wantSnippets = params.snippets ?? true;

    const rawTerms = this.analyzeQuery(params.query);
    const qtf = new Map<string, number>();
    for (const t of rawTerms) qtf.set(t, (qtf.get(t) ?? 0) + 1);

    const N = this.docs.length;
    const queryTerms: Array<{ term: string; weight: number; bit: number }> = [];
    let qNormSq = 0;
    let bit = 0;
    for (const [term, freq] of qtf) {
      const entry = this.dictionary.get(term);
      if (!entry || entry.df === 0) continue;
      const idf = Math.log(N / entry.df);
      if (idf <= 0) continue; // term appears in every document -> carries no signal
      const weight = lnPlus1(freq) * idf;
      queryTerms.push({ term, weight, bit: bit < 31 ? 1 << bit : 0 });
      qNormSq += weight * weight;
      bit++;
    }
    const usedTerms = queryTerms.map((q) => q.term);

    if (queryTerms.length === 0 || N === 0) {
      return {
        query: params.query,
        terms: usedTerms,
        totalHits: 0,
        hits: [],
        tookMs: performance.now() - started,
      };
    }

    const qNorm = Math.sqrt(qNormSq);
    const scores = this.scratchScores;
    const seen = this.scratchSeen;
    const matched = this.scratchMatched;
    const gen = ++this.scratchGeneration;
    const touched: number[] = [];

    const accumulate = (doc: number, contribution: number, termBit: number): void => {
      if (seen[doc] !== gen) {
        seen[doc] = gen;
        scores[doc] = 0;
        matched[doc] = 0;
        touched.push(doc);
      }
      scores[doc]! += contribution;
      matched[doc]! |= termBit;
    };

    if (linear) {
      for (let doc = 0; doc < N; doc++) {
        const terms = this.docs[doc]!.terms!;
        for (const q of queryTerms) {
          const freq = terms.get(q.term);
          if (freq === undefined) continue;
          accumulate(doc, q.weight * lnPlus1(freq), q.bit);
        }
      }
    } else {
      for (const q of queryTerms) {
        const entry = this.dictionary.get(q.term)!;
        for (const posting of entry.postings) {
          accumulate(posting.doc, q.weight * lnPlus1(posting.tf), q.bit);
        }
      }
    }

    const heap = new TopKHeap(offset + limit);
    for (const doc of touched) {
      const finalScore = scores[doc]! / (this.docs[doc]!.norm * qNorm);
      heap.push(doc, finalScore);
    }

    const ranked = heap.toSorted().slice(offset, offset + limit);
    const hits: SearchHit[] = ranked.map((r, i) => {
      const rec = this.docs[r.doc]!;
      const bits = matched[r.doc]!;
      const matchedTerms = queryTerms.filter((q) => (bits & q.bit) !== 0).map((q) => q.term);
      return {
        id: rec.externalId,
        score: Number(r.score.toFixed(6)),
        rank: offset + i + 1,
        matchedTerms,
        title: rec.title,
        snippet: wantSnippets
          ? makeSnippet(`${rec.title}. ${rec.body}`, usedTerms, this.snippetOptions)
          : null,
      };
    });

    return {
      query: params.query,
      terms: usedTerms,
      totalHits: touched.length,
      hits,
      tookMs: performance.now() - started,
    };
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  toJSON(): SerializedIndex {
    const dictionary: SerializedIndex['dictionary'] = {};
    for (const [term, entry] of this.dictionary) {
      dictionary[term] = [entry.df, entry.postings.map((p) => [p.doc, p.tf] as [number, number])];
    }
    return {
      version: 1,
      options: this.options,
      docCount: this.docs.length,
      dictionary,
      docs: this.docs.map((d, i) => ({
        doc: i,
        externalId: d.externalId,
        title: d.title,
        body: d.body,
        length: d.length,
        norm: d.norm,
      })),
    };
  }

  /** Rebuild an engine from {@link toJSON} output without re-analysing text. */
  static fromJSON(data: SerializedIndex, config: { keepDocTerms?: boolean } = {}): RetrievalEngine {
    if (data.version !== 1) throw new Error(`Unsupported index version: ${String(data.version)}`);
    const engine = new RetrievalEngine({
      ...data.options,
      keepDocTerms: config.keepDocTerms ?? false,
    });

    for (const d of data.docs) {
      engine.externalToInternal.set(d.externalId, d.doc);
      engine.docs[d.doc] = {
        externalId: d.externalId,
        title: d.title,
        body: d.body,
        length: d.length,
        norm: d.norm,
        terms: undefined,
      };
    }
    for (const [term, [df, postings]] of Object.entries(data.dictionary)) {
      engine.dictionary.set(term, {
        df,
        postings: postings.map(([doc, tf]): Posting => ({ doc, tf })),
      });
    }
    if (config.keepDocTerms) {
      for (const rec of engine.docs) {
        const tf = new Map<string, number>();
        for (const t of analyze(rec.title, engine.options)) {
          tf.set(t.term, (tf.get(t.term) ?? 0) + engine.options.titleBoost);
        }
        for (const t of analyze(rec.body, engine.options)) {
          tf.set(t.term, (tf.get(t.term) ?? 0) + 1);
        }
        rec.terms = tf;
      }
    }
    engine.finalize();
    return engine;
  }
}

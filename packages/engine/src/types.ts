/** Opaque per-document metadata the engine stores and echoes back but never
 * interprets (category, authors, URLs, source flag, …). Kept so callers can
 * render results and compute facets without a second data-store round trip. */
export type DocMeta = Record<string, string | string[] | number | boolean | null>;

/**
 * A document as handed to the engine for indexing. `id` is the caller's stable
 * identifier (e.g. an arXiv id); the engine assigns its own dense integer id
 * internally for compact postings.
 */
export interface EngineDocument {
  id: string;
  title: string;
  /** Main searchable text (for CogniFetch: the abstract, optionally + OCR body). */
  body: string;
  /** Optional passthrough metadata, returned on every hit. */
  meta?: DocMeta;
}

/** Tunable knobs for indexing and scoring. */
export interface EngineOptions {
  /** Multiplier applied to term frequencies coming from the title field. */
  titleBoost: number;
  /** Drop terms shorter than this (after stemming). */
  minTermLength: number;
  /** Drop terms longer than this (usually junk / base64 / hashes). */
  maxTermLength: number;
  /** If true, apply the Porter stemmer; if false, index raw tokens. */
  stem: boolean;
  /** If true, remove English stopwords. */
  removeStopwords: boolean;
}

export const DEFAULT_OPTIONS: EngineOptions = {
  titleBoost: 3,
  minTermLength: 2,
  maxTermLength: 40,
  stem: true,
  removeStopwords: true,
};

/** One entry in a term's postings list. */
export interface Posting {
  /** Internal dense document id. */
  doc: number;
  /** Effective term frequency in the document (title occurrences pre-multiplied). */
  tf: number;
}

/** A term's dictionary entry. */
export interface TermEntry {
  df: number;
  postings: Posting[];
}

/** Per-document statistics needed for cosine normalisation and display. */
export interface DocStats {
  /** Internal dense id. */
  doc: number;
  /** Caller id. */
  externalId: string;
  /** Number of tokens after analysis (title + body). */
  length: number;
  /** Euclidean norm of the document's lnc weight vector. */
  norm: number;
}

/** A single search hit. */
export interface SearchHit {
  id: string;
  score: number;
  /** Rank, 1-based. */
  rank: number;
  /** Query terms (stemmed) that matched this document. */
  matchedTerms: string[];
  /** Highlighted snippet with <mark>…</mark> around matches, or null if unavailable. */
  snippet: string | null;
  title: string;
  /** Passthrough metadata supplied at index time. */
  meta: DocMeta;
}

/** One bucket of a facet: a metadata value and how many matches carried it. */
export interface FacetBucket {
  value: string;
  count: number;
}

export interface SearchResult {
  query: string;
  /** Analysed (stemmed) query terms actually used for retrieval. */
  terms: string[];
  /** Total number of documents that matched at least one term. */
  totalHits: number;
  hits: SearchHit[];
  /** Value counts for each requested facet key, over *all* matched documents. */
  facets: Record<string, FacetBucket[]>;
  /** Wall-clock time spent scoring + ranking, milliseconds. */
  tookMs: number;
}

export interface SearchParams {
  query: string;
  /** Max hits to return. */
  limit?: number;
  /** Hits to skip (pagination). */
  offset?: number;
  /** Generate highlighted snippets (adds a little latency). */
  snippets?: boolean;
  /** Metadata keys to tally across the matched set (e.g. `["primaryCategory"]`). */
  facets?: string[];
  /** Keep only documents whose meta[key] equals / contains one of the values. */
  filters?: Record<string, string[]>;
}

/** Serialisable form of a built index, for persistence in MongoDB. */
export interface SerializedIndex {
  version: 1;
  options: EngineOptions;
  docCount: number;
  /** term -> [df, [[doc, tf], ...]] */
  dictionary: Record<string, [number, Array<[number, number]>]>;
  docs: Array<{
    doc: number;
    externalId: string;
    title: string;
    body: string;
    length: number;
    norm: number;
    meta: DocMeta;
  }>;
}

import { STOPWORDS } from './stopwords.js';
import { stem } from './stemmer.js';
import type { EngineOptions } from './types.js';

/** A single analysed token together with its position in the token stream. */
export interface AnalyzedToken {
  term: string;
  position: number;
}

const SPLIT_RE = /[^\p{L}\p{N}]+/u;
const COMBINING_MARKS_RE = /[̀-ͯ]/g;

/** Lowercase, strip accents, drop symbols. Keeps letters and digits only. */
function normalize(text: string): string {
  return text.normalize('NFKD').replace(COMBINING_MARKS_RE, '').toLowerCase();
}

/**
 * Split raw text into raw (non-stemmed, non-filtered) lowercase tokens.
 * Exposed for callers that need positions without the full analysis pipeline.
 */
export function tokenizeRaw(text: string): string[] {
  return normalize(text).split(SPLIT_RE).filter(Boolean);
}

/**
 * Full analysis pipeline: normalise -> split -> stopword filter -> length filter
 * -> stem. Positions are assigned over the *raw* token stream so snippet code can
 * map a matched term back to a character range in the original text.
 */
export function analyze(text: string, options: EngineOptions): AnalyzedToken[] {
  const raw = tokenizeRaw(text);
  const out: AnalyzedToken[] = [];

  for (let i = 0; i < raw.length; i++) {
    let tok = raw[i]!;
    if (options.removeStopwords && STOPWORDS.has(tok)) continue;
    if (tok.length < options.minTermLength || tok.length > options.maxTermLength) continue;
    if (options.stem) tok = stem(tok);
    if (tok.length < options.minTermLength) continue;
    out.push({ term: tok, position: i });
  }

  return out;
}

/** Analyse a query string into the list of stemmed terms used for retrieval. */
export function analyzeQuery(query: string, options: EngineOptions): string[] {
  return analyze(query, options).map((t) => t.term);
}

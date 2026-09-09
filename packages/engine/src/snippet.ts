import { stem } from './stemmer.js';

const WORD_RE = /[\p{L}\p{N}]+/gu;
const COMBINING_MARKS_RE = /[̀-ͯ]/g;

interface OffsetToken {
  raw: string;
  norm: string;
  start: number;
  end: number;
}

function normalizeToken(t: string): string {
  return t.normalize('NFKD').replace(COMBINING_MARKS_RE, '').toLowerCase();
}

function tokenizeWithOffsets(text: string): OffsetToken[] {
  const out: OffsetToken[] = [];
  for (const m of text.matchAll(WORD_RE)) {
    const raw = m[0];
    out.push({
      raw,
      norm: normalizeToken(raw),
      start: m.index,
      end: m.index + raw.length,
    });
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface SnippetOptions {
  /** Target snippet length in characters. */
  maxChars: number;
  /** Number of tokens to consider as a scoring window. */
  windowTokens: number;
}

export const DEFAULT_SNIPPET_OPTIONS: SnippetOptions = { maxChars: 260, windowTokens: 40 };

/**
 * Build an HTML snippet: pick the densest window of query-term matches, clip to
 * `maxChars`, HTML-escape, and wrap each matching token in `<mark>…</mark>`.
 * `stemmedTerms` are the analysed query terms (already stemmed).
 */
export function makeSnippet(
  text: string,
  stemmedTerms: readonly string[],
  options: SnippetOptions = DEFAULT_SNIPPET_OPTIONS,
): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length === 0) return '';

  const wanted = new Set(stemmedTerms);
  const tokens = tokenizeWithOffsets(clean);
  if (tokens.length === 0) return escapeHtml(clean.slice(0, options.maxChars));

  const isMatch = tokens.map((t) => wanted.has(stem(t.norm)) || wanted.has(t.norm));

  // Slide a token window, find the offset with the most matches.
  const win = Math.min(options.windowTokens, tokens.length);
  let running = 0;
  for (let i = 0; i < win; i++) if (isMatch[i]) running++;
  let bestStart = 0;
  let bestScore = running;
  for (let i = win; i < tokens.length; i++) {
    if (isMatch[i]) running++;
    if (isMatch[i - win]) running--;
    if (running > bestScore) {
      bestScore = running;
      bestStart = i - win + 1;
    }
  }

  const firstTok = tokens[bestStart]!;
  const lastTok = tokens[Math.min(bestStart + win - 1, tokens.length - 1)]!;
  const from = firstTok.start;
  let to = lastTok.end;
  if (to - from > options.maxChars) to = from + options.maxChars;

  // Snap to word boundaries / add ellipses.
  const prefix = from > 0 ? '…' : '';
  const suffix = to < clean.length ? '…' : '';

  // Rebuild the window, escaping text and marking matched tokens.
  let html = '';
  let cursor = from;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok.end <= from || tok.start >= to) continue;
    if (tok.start > cursor) html += escapeHtml(clean.slice(cursor, tok.start));
    const piece = escapeHtml(clean.slice(Math.max(tok.start, from), Math.min(tok.end, to)));
    html += isMatch[i] ? `<mark>${piece}</mark>` : piece;
    cursor = Math.min(tok.end, to);
  }
  if (cursor < to) html += escapeHtml(clean.slice(cursor, to));

  return prefix + html + suffix;
}

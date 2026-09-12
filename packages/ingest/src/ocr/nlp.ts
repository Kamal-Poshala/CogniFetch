import { STOPWORDS } from '@cognifetch/engine';
import { dehyphenate, collapseWhitespace } from '../text.js';

export interface StructuredOcr {
  title: string;
  abstract: string;
  /** Fraction of tokens that are common English stopwords — a rough "is this
   * real prose?" signal. Low values suggest OCR garbage. */
  englishScore: number;
  /** True when the text passed the quality gate. */
  usable: boolean;
}

/** Remove line-break hyphenation, stray control chars, repeated punctuation. */
function cleanOcrText(raw: string): string {
  return dehyphenate(raw)
    .replace(/[^\S\n]+/g, ' ') // collapse spaces/tabs but keep newlines
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[|¦]/g, 'I') // common vertical-bar misread
    .replace(/(\S)\1{4,}/g, '$1') // runs of the same char (scan speckle)
    .trim();
}

function englishStopwordRatio(text: string): number {
  const tokens = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (tokens.length < 10) return 0;
  const hits = tokens.filter((t) => STOPWORDS.has(t)).length;
  return hits / tokens.length;
}

/**
 * Turn raw OCR output into a {title, abstract} record. The synthetic scans put
 * the title on the first line(s), then a blank line, then the abstract — the
 * same layout as an arXiv paper's first page.
 */
export function structureOcr(raw: string): StructuredOcr {
  const cleaned = cleanOcrText(raw);
  const blocks = cleaned
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  let title: string;
  let abstract: string;

  if (blocks.length >= 2) {
    title = collapseWhitespace(blocks[0]!).slice(0, 400);
    abstract = collapseWhitespace(blocks.slice(1).join(' '));
  } else {
    // No blank-line paragraph break survived OCR (common when the title wraps
    // right into the body with no extra vertical gap). Fall back to the first
    // line break instead of treating the whole page as both title and body.
    const lines = (blocks[0] ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    title = collapseWhitespace(lines[0] ?? '').slice(0, 400);
    abstract = collapseWhitespace(lines.slice(1).join(' ')) || title;
  }

  const englishScore = englishStopwordRatio(abstract || title);
  const usable = title.length >= 8 && abstract.length >= 60 && englishScore >= 0.12;

  return { title, abstract, englishScore, usable };
}

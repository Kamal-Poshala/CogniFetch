import { levenshtein } from './levenshtein.js';

export interface AccuracyScore {
  /** Character error rate: edit distance / reference length, clamped to [0, 1]. */
  cer: number;
  /** Word error rate: word-level edit distance / reference word count. */
  wer: number;
  refChars: number;
  refWords: number;
}

const words = (s: string): string[] => s.trim().split(/\s+/).filter(Boolean);

/** Compare an OCR hypothesis against ground truth. Whitespace is normalised first. */
export function scoreAccuracy(reference: string, hypothesis: string): AccuracyScore {
  const ref = reference.replace(/\s+/g, ' ').trim();
  const hyp = hypothesis.replace(/\s+/g, ' ').trim();
  const refWordList = words(ref);
  const hypWordList = words(hyp);

  const charDist = levenshtein(ref, hyp);
  const wordDist = levenshtein(refWordList, hypWordList);

  return {
    cer: ref.length === 0 ? 0 : Math.min(1, charDist / ref.length),
    wer: refWordList.length === 0 ? 0 : Math.min(1, wordDist / refWordList.length),
    refChars: ref.length,
    refWords: refWordList.length,
  };
}

export interface AggregateAccuracy {
  count: number;
  meanCer: number;
  meanWer: number;
  medianCer: number;
  p90Cer: number;
}

/** Aggregate per-document scores (micro-average weighted by reference length). */
export function aggregateAccuracy(scores: AccuracyScore[]): AggregateAccuracy {
  if (scores.length === 0) {
    return { count: 0, meanCer: 0, meanWer: 0, medianCer: 0, p90Cer: 0 };
  }
  const totalChars = scores.reduce((s, x) => s + x.refChars, 0) || 1;
  const totalWords = scores.reduce((s, x) => s + x.refWords, 0) || 1;
  const meanCer = scores.reduce((s, x) => s + x.cer * x.refChars, 0) / totalChars;
  const meanWer = scores.reduce((s, x) => s + x.wer * x.refWords, 0) / totalWords;

  const sortedCer = scores.map((x) => x.cer).sort((a, b) => a - b);
  const at = (q: number): number =>
    sortedCer[Math.min(sortedCer.length - 1, Math.floor(q * sortedCer.length))]!;

  return {
    count: scores.length,
    meanCer,
    meanWer,
    medianCer: at(0.5),
    p90Cer: at(0.9),
  };
}

import { describe, expect, it } from 'vitest';
import { levenshtein } from './levenshtein.js';
import { scoreAccuracy, aggregateAccuracy } from './eval.js';
import { structureOcr } from './nlp.js';
import { wrapText } from './synth.js';

describe('levenshtein', () => {
  it('computes character edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });

  it('works on token arrays', () => {
    expect(levenshtein(['a', 'b', 'c'], ['a', 'x', 'c'])).toBe(1);
  });
});

describe('scoreAccuracy', () => {
  it('is zero for a perfect match', () => {
    const s = scoreAccuracy('the quick brown fox', 'the quick brown fox');
    expect(s.cer).toBe(0);
    expect(s.wer).toBe(0);
  });

  it('rises with errors and is normalised whitespace-insensitively', () => {
    const s = scoreAccuracy('the quick brown fox', 'the  quikc  brown  fox');
    expect(s.cer).toBeGreaterThan(0);
    expect(s.cer).toBeLessThan(0.2);
    expect(s.wer).toBeCloseTo(1 / 4, 5);
  });

  it('clamps to 1', () => {
    expect(scoreAccuracy('abc', 'completely different and much longer').cer).toBe(1);
  });
});

describe('aggregateAccuracy', () => {
  it('micro-averages by reference length', () => {
    const agg = aggregateAccuracy([
      { cer: 0, wer: 0, refChars: 100, refWords: 20 },
      { cer: 0.5, wer: 0.5, refChars: 100, refWords: 20 },
    ]);
    expect(agg.meanCer).toBeCloseTo(0.25, 5);
    expect(agg.count).toBe(2);
  });
});

describe('wrapText', () => {
  it('wraps to a character budget without splitting words', () => {
    const lines = wrapText('one two three four five six seven', 12);
    expect(lines.every((l) => l.length <= 12)).toBe(true);
    expect(lines.join(' ')).toBe('one two three four five six seven');
  });
});

describe('structureOcr', () => {
  it('splits a title block from the abstract body', () => {
    const raw =
      'Distributed Consensus under Byzantine Faults\n\n' +
      'We present a protocol that tolerates faulty replicas in an asynchronous ' +
      'network and prove safety and liveness under a partial synchrony assumption.';
    const s = structureOcr(raw);
    expect(s.title).toBe('Distributed Consensus under Byzantine Faults');
    expect(s.abstract).toMatch(/^We present a protocol/);
    expect(s.usable).toBe(true);
    expect(s.englishScore).toBeGreaterThan(0.15);
  });

  it('repairs hyphenated line breaks', () => {
    const raw =
      'A Title Here\n\nWe study convo-\nlutional networks for vision tasks and report strong results.';
    expect(structureOcr(raw).abstract).toContain('convolutional networks');
  });

  it('falls back to the first line break when no blank line survives OCR', () => {
    // No blank line between title and body (title wrapped straight into the
    // abstract) — must not duplicate the whole page into both fields.
    const raw =
      'A note on t-designs in isodual codes\n' +
      'In the present paper, we construct 3-designs using extended binary ' +
      'quadratic residue codes and their dual codes for several applications.';
    const s = structureOcr(raw);
    expect(s.title).toBe('A note on t-designs in isodual codes');
    expect(s.abstract).toMatch(/^In the present paper/);
    expect(s.abstract).not.toContain('A note on t-designs');
    expect(s.usable).toBe(true);
  });

  it('rejects OCR garbage', () => {
    const s = structureOcr('X9 !!!\n\n@@@ ~~~ qwx zzt vvm %%% |||  lkj hgf');
    expect(s.usable).toBe(false);
  });
});

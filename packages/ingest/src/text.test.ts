import { describe, expect, it } from 'vitest';
import {
  dehyphenate,
  collapseWhitespace,
  normalizeAbstract,
  normalizeTitle,
  stripLatex,
} from './text.js';

describe('text normalisation', () => {
  it('dehyphenates words split across a line break', () => {
    expect(dehyphenate('convo-\nlutional neural net-\n  works')).toBe(
      'convolutional neural networks',
    );
  });

  it('does not join a genuine hyphenated compound on one line', () => {
    expect(dehyphenate('state-of-the-art results')).toBe('state-of-the-art results');
  });

  it('collapses whitespace', () => {
    expect(collapseWhitespace('  a\n\t b   c  ')).toBe('a b c');
  });

  it('normalises an abstract end to end', () => {
    const raw = '  We study contrastive representa-\nlearning   for  pre-training\n\tof models.  ';
    expect(normalizeAbstract(raw)).toBe(
      'We study contrastive representalearning for pre-training of models.',
    );
  });

  it('strips a trailing period from a title', () => {
    expect(normalizeTitle('Attention Is All You Need.')).toBe('Attention Is All You Need');
  });

  it('lightly de-TeXes math and formatting commands', () => {
    expect(stripLatex('the {\\it measure-many} automata over $\\Sigma$')).toBe(
      'the measure-many automata over',
    );
    expect(normalizeAbstract('We bound $O(n^2)$ using \\cite{smith2020} results.')).toBe(
      'We bound O(n 2) using results.',
    );
  });
});

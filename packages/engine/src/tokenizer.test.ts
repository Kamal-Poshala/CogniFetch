import { describe, expect, it } from 'vitest';
import { analyze, analyzeQuery, tokenizeRaw } from './tokenizer.js';
import { DEFAULT_OPTIONS } from './types.js';

describe('tokenizeRaw', () => {
  it('lowercases, strips punctuation and accents', () => {
    expect(tokenizeRaw('Convolutional Neural-Networks (CNNs)!')).toEqual([
      'convolutional',
      'neural',
      'networks',
      'cnns',
    ]);
    expect(tokenizeRaw('Schrödinger équation')).toEqual(['schrodinger', 'equation']);
  });

  it('keeps digits and alphanumerics', () => {
    expect(tokenizeRaw('GPT-4 achieves 92% on MMLU')).toEqual([
      'gpt',
      '4',
      'achieves',
      '92',
      'on',
      'mmlu',
    ]);
  });
});

describe('analyze', () => {
  it('removes stopwords, applies length filter and stemming', () => {
    const terms = analyze('The study of distributed consensus algorithms', DEFAULT_OPTIONS).map(
      (t) => t.term,
    );
    expect(terms).toEqual(['studi', 'distribut', 'consensu', 'algorithm']);
  });

  it('assigns positions over the raw token stream', () => {
    const tokens = analyze('the quick brown fox', DEFAULT_OPTIONS);
    expect(tokens).toEqual([
      { term: 'quick', position: 1 },
      { term: 'brown', position: 2 },
      { term: 'fox', position: 3 },
    ]);
  });

  it('can disable stemming and stopword removal', () => {
    const terms = analyze('the running systems', {
      ...DEFAULT_OPTIONS,
      stem: false,
      removeStopwords: false,
    }).map((t) => t.term);
    expect(terms).toEqual(['the', 'running', 'systems']);
  });
});

describe('analyzeQuery', () => {
  it('produces the same stemmed terms as document analysis', () => {
    expect(analyzeQuery('Distributed Systems', DEFAULT_OPTIONS)).toEqual(['distribut', 'system']);
  });
});

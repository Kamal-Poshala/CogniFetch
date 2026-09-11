import { describe, expect, it } from 'vitest';
import { stem } from './stemmer.js';

/**
 * Full-stemmer output pairs (not per-step snapshots). Traced against the
 * original 1980 algorithm; these are the values a canonical Porter
 * implementation produces end-to-end.
 */
describe('Porter stemmer', () => {
  const cases: Array<[string, string]> = [
    // step 1a
    ['caresses', 'caress'],
    ['ponies', 'poni'],
    ['ties', 'ti'],
    ['caress', 'caress'],
    ['cats', 'cat'],
    // step 1b
    ['feed', 'feed'],
    ['agreed', 'agre'],
    ['plastered', 'plaster'],
    ['bled', 'bled'],
    ['motoring', 'motor'],
    ['sing', 'sing'],
    ['conflated', 'conflat'],
    ['troubling', 'troubl'],
    ['hopping', 'hop'],
    ['falling', 'fall'],
    // step 1c
    ['happy', 'happi'],
    ['sky', 'sky'],
    // steps 2-4 (end-to-end)
    ['relational', 'relat'],
    ['conditional', 'condit'],
    ['rational', 'ration'],
    ['digitizer', 'digit'],
    ['radically', 'radic'],
    ['differently', 'differ'],
    ['analogously', 'analog'],
    ['predication', 'predic'],
    ['operator', 'oper'],
    ['feudalism', 'feudal'],
    ['decisiveness', 'decis'],
    ['hopefulness', 'hope'],
    ['formality', 'formal'],
    ['sensitivity', 'sensit'],
    ['electrical', 'electr'],
    ['adjustable', 'adjust'],
    ['defensible', 'defens'],
    ['replacement', 'replac'],
    ['dependent', 'depend'],
    ['adoption', 'adopt'],
    ['communism', 'commun'],
    ['activate', 'activ'],
    ['effective', 'effect'],
    // step 5
    ['probate', 'probat'],
    ['rate', 'rate'],
    ['controlling', 'control'],
    ['rolling', 'roll'],
  ];

  it.each(cases)('stems %s -> %s', (input, expected) => {
    expect(stem(input)).toBe(expected);
  });

  it('leaves very short words untouched', () => {
    expect(stem('as')).toBe('as');
    expect(stem('a')).toBe('a');
    expect(stem('by')).toBe('by');
  });
});

import { describe, expect, it } from 'vitest';
import { makeSnippet } from './snippet.js';

describe('makeSnippet', () => {
  const text =
    'We present a distributed consensus protocol for replicated state machines. ' +
    'The protocol tolerates Byzantine faults and achieves consensus in three rounds ' +
    'under partial synchrony, improving on prior asynchronous Byzantine agreement schemes.';

  it('wraps matched terms in <mark> tags', () => {
    const snip = makeSnippet(text, ['consensu', 'byzantin']);
    expect(snip).toContain('<mark>consensus</mark>');
    expect(snip).toContain('<mark>Byzantine</mark>');
  });

  it('focuses on the densest window of matches', () => {
    const snip = makeSnippet(text, ['byzantin', 'fault']);
    expect(snip).toContain('<mark>Byzantine</mark> <mark>faults</mark>');
  });

  it('HTML-escapes the source text', () => {
    const snip = makeSnippet('Bounds on f(x) < g(x) & h(x) for all x', ['bound']);
    expect(snip).toContain('&lt; g(x) &amp; h(x)');
    expect(snip).not.toMatch(/<(?!\/?mark>)/);
  });

  it('returns empty string for empty input', () => {
    expect(makeSnippet('', ['x'])).toBe('');
  });

  it('adds ellipses when clipped', () => {
    const long = 'alpha '.repeat(200) + 'needle ' + 'omega '.repeat(200);
    const snip = makeSnippet(long, ['needl']);
    expect(snip.startsWith('…')).toBe(true);
    expect(snip.endsWith('…')).toBe(true);
    expect(snip).toContain('<mark>needle</mark>');
  });
});

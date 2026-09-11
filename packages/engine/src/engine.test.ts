import { describe, expect, it } from 'vitest';
import { RetrievalEngine } from './engine.js';
import type { EngineDocument } from './types.js';

const CORPUS: EngineDocument[] = [
  {
    id: 'd1',
    title: 'Distributed Consensus with Byzantine Fault Tolerance',
    body: 'A consensus protocol for replicated state machines that tolerates Byzantine faults among distributed replicas.',
  },
  {
    id: 'd2',
    title: 'Raft: In Search of an Understandable Consensus Algorithm',
    body: 'Raft is a consensus algorithm for managing a replicated log, designed to be easier to understand than Paxos.',
  },
  {
    id: 'd3',
    title: 'Deep Residual Learning for Image Recognition',
    body: 'We present residual networks that ease the training of very deep neural networks for image classification.',
  },
  {
    id: 'd4',
    title: 'Attention Is All You Need',
    body: 'The Transformer architecture relies entirely on self-attention, dispensing with recurrence and convolutions.',
  },
  {
    id: 'd5',
    title: 'A Byzantine Generals Problem Primer',
    body: 'An introduction to the Byzantine generals problem and its implications for fault-tolerant distributed systems.',
  },
];

describe('RetrievalEngine', () => {
  const engine = RetrievalEngine.build(CORPUS, { keepDocTerms: true });

  it('indexes every document', () => {
    expect(engine.size).toBe(5);
    expect(engine.vocabularySize).toBeGreaterThan(20);
  });

  it('ranks the title-and-body match above the body-only match', () => {
    const { hits } = engine.search({ query: 'byzantine fault tolerance' });
    expect(hits[0]?.id).toBe('d1');
    expect(hits.map((h) => h.id)).toContain('d5');
    // The ML papers share no query terms and must not appear.
    expect(hits.map((h) => h.id)).not.toContain('d3');
    expect(hits.map((h) => h.id)).not.toContain('d4');
  });

  it('returns consensus papers for a consensus query, best first', () => {
    const { hits, terms } = engine.search({ query: 'consensus algorithm' });
    expect(terms).toEqual(['consensu', 'algorithm']);
    expect(
      hits
        .slice(0, 2)
        .map((h) => h.id)
        .sort(),
    ).toEqual(['d1', 'd2']);
    // d2 has both terms in the title -> should edge out d1.
    expect(hits[0]?.id).toBe('d2');
  });

  it('produces identical rankings via the inverted index and the linear scan', () => {
    for (const query of [
      'byzantine fault tolerance',
      'consensus algorithm',
      'deep neural networks',
      'transformer attention',
      'distributed replicated log',
    ]) {
      const fast = engine.search({ query, snippets: false });
      const slow = engine.searchLinear({ query, snippets: false });
      expect(fast.hits.map((h) => [h.id, h.score])).toEqual(slow.hits.map((h) => [h.id, h.score]));
      expect(fast.totalHits).toBe(slow.totalHits);
    }
  });

  it('reports matched terms and snippets per hit', () => {
    const { hits } = engine.search({ query: 'byzantine consensus' });
    const top = hits[0];
    expect(top?.matchedTerms.sort()).toEqual(['byzantin', 'consensu']);
    expect(top?.snippet).toContain('<mark>');
  });

  it('returns nothing for an out-of-vocabulary query', () => {
    const { hits, totalHits } = engine.search({ query: 'quantum entanglement photonics' });
    expect(totalHits).toBe(0);
    expect(hits).toEqual([]);
  });

  it('paginates deterministically', () => {
    const query = 'consensus protocol replicated distributed byzantine';
    const all = engine.search({ query, limit: 10, offset: 0 });
    expect(all.hits.length).toBeGreaterThanOrEqual(3);
    const page1 = engine.search({ query, limit: 2, offset: 0 });
    const page2 = engine.search({ query, limit: 2, offset: 2 });
    const overlap = page1.hits.filter((h) => page2.hits.some((x) => x.id === h.id));
    expect(overlap).toHaveLength(0);
    expect(page1.hits[0]?.rank).toBe(1);
    expect(page2.hits[0]?.rank).toBe(3);
    expect(page2.hits[0]?.id).toBe(all.hits[2]?.id);
  });

  it('round-trips through JSON serialisation', () => {
    const json = JSON.parse(JSON.stringify(engine.toJSON())) as ReturnType<typeof engine.toJSON>;
    const restored = RetrievalEngine.fromJSON(json);
    const a = engine.search({ query: 'byzantine fault tolerance', snippets: false });
    const b = restored.search({ query: 'byzantine fault tolerance', snippets: false });
    expect(b.hits.map((h) => h.id)).toEqual(a.hits.map((h) => h.id));
    expect(restored.size).toBe(engine.size);
    expect(restored.vocabularySize).toBe(engine.vocabularySize);
  });

  it('echoes passthrough meta on every hit and through serialisation', () => {
    const withMeta = RetrievalEngine.build([
      {
        id: 'm1',
        title: 'Consensus protocols',
        body: 'byzantine fault tolerance',
        meta: { category: 'cs.DC', year: 2024 },
      },
      {
        id: 'm2',
        title: 'Neural networks',
        body: 'gradient descent optimisation',
        meta: { category: 'cs.LG', year: 2023 },
      },
    ]);
    const hit = withMeta.search({ query: 'byzantine' }).hits[0];
    expect(hit?.id).toBe('m1');
    expect(hit?.meta).toEqual({ category: 'cs.DC', year: 2024 });

    const restored = RetrievalEngine.fromJSON(
      JSON.parse(JSON.stringify(withMeta.toJSON())) as ReturnType<typeof withMeta.toJSON>,
    );
    expect(restored.search({ query: 'byzantine' }).hits[0]?.meta).toEqual({
      category: 'cs.DC',
      year: 2024,
    });
  });

  it('tallies facets and applies filters over the matched set', () => {
    const corpus: EngineDocument[] = [
      { id: 'a', title: 'consensus', body: 'distributed consensus', meta: { cat: 'cs.DC' } },
      {
        id: 'b',
        title: 'consensus voting',
        body: 'distributed consensus voting',
        meta: { cat: 'cs.DC' },
      },
      {
        id: 'c',
        title: 'consensus learning',
        body: 'distributed consensus in learning',
        meta: { cat: 'cs.LG' },
      },
      {
        id: 'd',
        title: 'unrelated topic',
        body: 'compilers and type systems',
        meta: { cat: 'cs.PL' },
      },
    ];
    const eng = RetrievalEngine.build(corpus);
    const res = eng.search({ query: 'consensus', facets: ['cat'] });
    expect(res.facets.cat).toEqual([
      { value: 'cs.DC', count: 2 },
      { value: 'cs.LG', count: 1 },
    ]);

    const filtered = eng.search({
      query: 'consensus',
      facets: ['cat'],
      filters: { cat: ['cs.LG'] },
    });
    expect(filtered.totalHits).toBe(1);
    expect(filtered.hits.map((h) => h.id)).toEqual(['c']);
    expect(filtered.facets.cat).toEqual([{ value: 'cs.LG', count: 1 }]);
  });

  it('rejects duplicate document ids', () => {
    expect(() => {
      RetrievalEngine.build([
        { id: 'x', title: 'a', body: 'b' },
        { id: 'x', title: 'c', body: 'd' },
      ]);
    }).toThrow(/[Dd]uplicate/);
  });

  it('refuses linear search unless doc terms were retained', () => {
    const lean = RetrievalEngine.build(CORPUS);
    expect(() => lean.searchLinear({ query: 'consensus' })).toThrow();
  });
});

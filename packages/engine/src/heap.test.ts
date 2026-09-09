import { describe, expect, it } from 'vitest';
import { TopKHeap } from './heap.js';

describe('TopKHeap', () => {
  it('keeps only the K highest scores', () => {
    const heap = new TopKHeap(3);
    for (const [doc, score] of [
      [1, 0.1],
      [2, 0.9],
      [3, 0.5],
      [4, 0.7],
      [5, 0.2],
    ] as const) {
      heap.push(doc, score);
    }
    expect(heap.size).toBe(3);
    expect(heap.toSorted().map((s) => s.doc)).toEqual([2, 4, 3]);
  });

  it('matches a full sort for random input', () => {
    const scored = Array.from({ length: 500 }, (_, i) => ({ doc: i, score: Math.random() }));
    const heap = new TopKHeap(10);
    for (const s of scored) heap.push(s.doc, s.score);
    const expected = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => s.doc);
    expect(heap.toSorted().map((s) => s.doc)).toEqual(expected);
  });

  it('breaks ties by ascending doc id', () => {
    const heap = new TopKHeap(2);
    heap.push(9, 0.5);
    heap.push(3, 0.5);
    heap.push(7, 0.5);
    expect(heap.toSorted().map((s) => s.doc)).toEqual([3, 7]);
  });

  it('rejects a non-positive capacity', () => {
    expect(() => new TopKHeap(0)).toThrow();
  });
});

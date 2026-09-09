import { describe, expect, it } from 'vitest';
import { RetrievalEngine, type EngineDocument } from '@cognifetch/engine';
import { buildWorkload, CURATED_QUERIES } from './queries.js';
import { runBenchmark } from './harness.js';

function syntheticCorpus(n: number): EngineDocument[] {
  const topics = [
    'neural',
    'graph',
    'consensus',
    'diffusion',
    'transformer',
    'privacy',
    'quantum',
    'bayesian',
  ];
  return Array.from({ length: n }, (_, i) => {
    const a = topics[i % topics.length]!;
    const b = topics[(i * 7 + 3) % topics.length]!;
    return {
      id: `d${i}`,
      title: `${a} methods for ${b} systems`,
      body: `A study of ${a} learning applied to ${b} problems, with analysis of ${a} ${b} tradeoffs and empirical results on benchmark datasets number ${i}.`,
    };
  });
}

describe('benchmark harness', () => {
  const engine = RetrievalEngine.build(syntheticCorpus(800), { keepDocTerms: true });

  it('builds a workload of the requested size from real vocabulary', () => {
    const workload = buildWorkload(engine, 60);
    expect(workload).toHaveLength(60);
    expect(workload.slice(0, CURATED_QUERIES.length)).toEqual(CURATED_QUERIES.slice(0, 60));
    expect(workload.every((q) => q.length > 0)).toBe(true);
  });

  it('produces a well-formed result where the inverted index wins', () => {
    const workload = buildWorkload(engine, 40);
    const result = runBenchmark(engine, workload, { iterations: 3, warmupIterations: 1 });

    expect(result.corpus.docs).toBe(800);
    expect(result.inverted.count).toBe(40 * 3);
    expect(result.inverted.p95Ms).toBeGreaterThan(0);
    expect(result.inverted.p50Ms).toBeLessThanOrEqual(result.inverted.p95Ms);
    // The whole point: fewer docs visited -> faster.
    expect(result.linear.meanMs).toBeGreaterThan(result.inverted.meanMs);
    expect(result.comparison.speedupMean).toBeGreaterThan(1);
    expect(result.comparison.latencyReductionMeanPct).toBeGreaterThan(0);
  });
});

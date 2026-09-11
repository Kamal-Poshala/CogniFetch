import { cpus, totalmem } from 'node:os';
import type { RetrievalEngine } from '@cognifetch/engine';

export interface LatencySummary {
  count: number;
  meanMs: number;
  minMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  /** Queries per second, single-threaded. */
  qps: number;
}

export interface BenchmarkResult {
  generatedAt: string;
  machine: {
    node: string;
    platform: string;
    cpu: string;
    cores: number;
    memGiB: number;
  };
  corpus: { docs: number; vocab: number };
  config: { queries: number; iterations: number; warmupIterations: number; snippets: boolean };
  inverted: LatencySummary;
  linear: LatencySummary;
  comparison: {
    /** linear.pXX / inverted.pXX — "the inverted index is Nx faster at pXX". */
    speedupP50: number;
    speedupP95: number;
    speedupMean: number;
    /** 1 - inverted/linear, as a percentage. */
    latencyReductionP95Pct: number;
    latencyReductionMeanPct: number;
  };
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, idx)]!;
}

function summarize(samplesMs: number[]): LatencySummary {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const sum = sorted.reduce((s, x) => s + x, 0);
  const mean = sum / sorted.length;
  return {
    count: sorted.length,
    meanMs: mean,
    minMs: sorted[0] ?? 0,
    p50Ms: percentile(sorted, 0.5),
    p90Ms: percentile(sorted, 0.9),
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    maxMs: sorted[sorted.length - 1] ?? 0,
    qps: mean > 0 ? 1000 / mean : 0,
  };
}

export interface BenchmarkOptions {
  iterations: number;
  warmupIterations: number;
  snippets: boolean;
}

export const DEFAULT_BENCHMARK_OPTIONS: BenchmarkOptions = {
  iterations: 20,
  warmupIterations: 3,
  snippets: false,
};

/**
 * Time `search()` (inverted index) against `searchLinear()` (full scan) over the
 * same workload. The engine must be built with `{ keepDocTerms: true }`.
 */
export function runBenchmark(
  engine: RetrievalEngine,
  workload: readonly string[],
  options: Partial<BenchmarkOptions> = {},
): BenchmarkResult {
  const opts = { ...DEFAULT_BENCHMARK_OPTIONS, ...options };
  const params = { snippets: opts.snippets, limit: 10 } as const;

  const time = (fn: () => void): number => {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
  };

  // Warm up JIT + caches for both paths.
  for (let i = 0; i < opts.warmupIterations; i++) {
    for (const q of workload) {
      engine.search({ query: q, ...params });
      engine.searchLinear({ query: q, ...params });
    }
  }

  const invertedSamples: number[] = [];
  const linearSamples: number[] = [];
  for (let i = 0; i < opts.iterations; i++) {
    for (const q of workload) {
      invertedSamples.push(time(() => void engine.search({ query: q, ...params })));
      linearSamples.push(time(() => void engine.searchLinear({ query: q, ...params })));
    }
  }

  const inverted = summarize(invertedSamples);
  const linear = summarize(linearSamples);
  const cpu = cpus();

  return {
    generatedAt: new Date().toISOString(),
    machine: {
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      cpu: cpu[0]?.model.trim() ?? 'unknown',
      cores: cpu.length,
      memGiB: Math.round((totalmem() / 1024 ** 3) * 10) / 10,
    },
    corpus: { docs: engine.size, vocab: engine.vocabularySize },
    config: {
      queries: workload.length,
      iterations: opts.iterations,
      warmupIterations: opts.warmupIterations,
      snippets: opts.snippets,
    },
    inverted,
    linear,
    comparison: {
      speedupP50: linear.p50Ms / inverted.p50Ms,
      speedupP95: linear.p95Ms / inverted.p95Ms,
      speedupMean: linear.meanMs / inverted.meanMs,
      latencyReductionP95Pct: (1 - inverted.p95Ms / linear.p95Ms) * 100,
      latencyReductionMeanPct: (1 - inverted.meanMs / linear.meanMs) * 100,
    },
  };
}

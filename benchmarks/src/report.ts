import type { BenchmarkResult, LatencySummary } from './harness.js';

const ms = (n: number): string => `${n.toFixed(2)} ms`;

function row(label: string, s: LatencySummary): string {
  return `| ${label} | ${ms(s.meanMs)} | ${ms(s.p50Ms)} | ${ms(s.p95Ms)} | ${ms(s.p99Ms)} | ${ms(s.maxMs)} | ${s.qps.toFixed(0)} |`;
}

/** Render a benchmark result as a Markdown section suitable for the README. */
export function toMarkdown(r: BenchmarkResult): string {
  const c = r.comparison;
  return `## Retrieval latency benchmark

_${r.generatedAt} · ${r.machine.cpu} (${r.machine.cores} cores) · Node ${r.machine.node} · ${r.machine.platform}_

Corpus: **${r.corpus.docs.toLocaleString()} documents**, ${r.corpus.vocab.toLocaleString()} unique terms.
Workload: ${r.config.queries} queries × ${r.config.iterations} iterations (${r.config.warmupIterations} warm-up), snippets ${r.config.snippets ? 'on' : 'off'}.

| Scorer | mean | p50 | p95 | p99 | max | QPS |
|---|---:|---:|---:|---:|---:|---:|
${row('Inverted index + TF-IDF cosine', r.inverted)}
${row('Linear scan (baseline)', r.linear)}

**Inverted index vs linear scan:** ${c.speedupP95.toFixed(1)}× faster at p95, ${c.speedupMean.toFixed(1)}× faster on average — a **${c.latencyReductionP95Pct.toFixed(0)}% p95 latency reduction** (${c.latencyReductionMeanPct.toFixed(0)}% mean).
p95 query latency: **${ms(r.inverted.p95Ms)}**.
`;
}

/** One-line console summary. */
export function toConsoleLine(r: BenchmarkResult): string {
  return (
    `${r.corpus.docs} docs | inverted p95 ${ms(r.inverted.p95Ms)} ` +
    `(mean ${ms(r.inverted.meanMs)}, ${r.inverted.qps.toFixed(0)} qps) | ` +
    `linear p95 ${ms(r.linear.p95Ms)} | ` +
    `${r.comparison.speedupP95.toFixed(1)}x faster @p95 (${r.comparison.latencyReductionP95Pct.toFixed(0)}% reduction)`
  );
}

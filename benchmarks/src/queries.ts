import type { RetrievalEngine } from '@cognifetch/engine';

/** Hand-written queries spanning short/long and rare/common, CS-flavoured. */
export const CURATED_QUERIES: readonly string[] = [
  'transformer attention mechanism',
  'diffusion models for image generation',
  'byzantine fault tolerant consensus',
  'large language model reasoning',
  'graph neural network representation learning',
  'reinforcement learning from human feedback',
  'differential privacy deep learning',
  'retrieval augmented generation',
  'contrastive self-supervised pretraining',
  'neural architecture search',
  'federated learning communication efficiency',
  'knowledge distillation',
  'vision language models zero-shot',
  'spiking neural networks neuromorphic',
  'causal inference observational data',
  'optimal transport domain adaptation',
  'sparse mixture of experts',
  'continual learning catastrophic forgetting',
  'protein structure prediction',
  'speech recognition end to end',
  'quantum error correction codes',
  'differential equations neural solver',
  'adversarial robustness certified defense',
  'multi agent reinforcement learning coordination',
  'time series forecasting probabilistic',
  'semantic segmentation weak supervision',
  'code generation program synthesis',
  'recommender systems implicit feedback',
  'active learning acquisition function',
  'bayesian optimization gaussian process',
  'transfer learning fine tuning',
  'attention is all you need',
  'batch normalization',
  'dropout regularization',
  'gradient descent convergence',
  'convolutional network image classification',
  'word embeddings',
  'topic modeling',
  'hashing nearest neighbor search',
  'compiler optimization',
  'distributed systems replication',
  'differentiable rendering',
  'model compression quantization',
  'out of distribution detection',
  'prompt engineering in context learning',
  'video understanding temporal',
  'tabular data deep learning',
  'explainable machine learning interpretability',
  'meta learning few shot',
  'self attention long sequences',
];

/** Mulberry32 PRNG for deterministic query generation. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a fixed benchmark workload: the curated queries plus deterministic
 * synthetic queries drawn from real corpus vocabulary (mid-frequency terms, so
 * queries actually hit postings), padded/truncated to `size`.
 */
export function buildWorkload(engine: RetrievalEngine, size = 200, seed = 42): string[] {
  const rand = rng(seed);
  const serialized = engine.toJSON();
  const n = serialized.docCount;

  // Prefer mid-frequency terms (appear in 2+ docs but not near-universal) so
  // queries actually traverse postings; widen the band if the corpus is tiny.
  const upper = Math.max(50, n * 0.4);
  const midFreq = Object.entries(serialized.dictionary)
    .filter(([, [df]]) => df >= 2 && df <= upper)
    .map(([term]) => term);
  const anyTerm = Object.keys(serialized.dictionary);
  const pool = midFreq.length >= 8 ? midFreq : anyTerm;

  const pick = (): string => pool[Math.floor(rand() * pool.length)] ?? 'learning';

  const queries = [...CURATED_QUERIES];
  let guard = 0;
  while (queries.length < size && guard++ < size * 20) {
    if (pool.length === 0) {
      queries.push(CURATED_QUERIES[queries.length % CURATED_QUERIES.length]!);
      continue;
    }
    const termCount = 1 + Math.floor(rand() * 3);
    const terms = new Set<string>();
    for (let i = 0; i < termCount; i++) terms.add(pick());
    queries.push([...terms].join(' '));
  }
  return queries.slice(0, size);
}

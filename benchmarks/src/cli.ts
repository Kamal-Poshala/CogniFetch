import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RetrievalEngine } from '@cognifetch/engine';
import { toEngineDocument, type StoredDocument } from '@cognifetch/ingest';
import { buildWorkload } from './queries.js';
import { runBenchmark } from './harness.js';
import { toMarkdown, toConsoleLine } from './report.js';

// benchmarks/src/cli.ts -> repo root is two levels up.
const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? (process.argv[i + 1] ?? fallback) : fallback;
}

function resolveCorpus(): string {
  const explicit = arg('input', '');
  if (explicit) return resolve(process.cwd(), explicit);
  for (const rel of ['data/bench/corpus.jsonl', 'data/seed/corpus.jsonl']) {
    const p = resolve(REPO_ROOT, rel);
    if (existsSync(p)) return p;
  }
  throw new Error('No corpus file. Pass --input <file.jsonl> or run a harvest.');
}

function loadDocs(path: string): StoredDocument[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as StoredDocument);
}

function main(): void {
  const corpusPath = resolveCorpus();
  const iterations = Number(arg('iterations', '20'));
  const querySize = Number(arg('queries', '200'));

  console.log(`corpus:     ${corpusPath}`);
  const docs = loadDocs(corpusPath);
  console.log(`building index over ${docs.length} documents...`);
  const t0 = performance.now();
  const engine = RetrievalEngine.build(docs.map(toEngineDocument), { keepDocTerms: true });
  console.log(`  built in ${((performance.now() - t0) / 1000).toFixed(2)}s\n`);

  const workload = buildWorkload(engine, querySize);
  console.log(
    `running ${workload.length} queries x ${iterations} iterations (inverted + linear)...\n`,
  );
  const result = runBenchmark(engine, workload, { iterations });

  const outDir = resolve(REPO_ROOT, 'benchmarks/results');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'latest.json'), JSON.stringify(result, null, 2));
  const md = toMarkdown(result);
  writeFileSync(resolve(outDir, 'latest.md'), md);

  console.log(md);
  console.log(toConsoleLine(result));
  console.log(`\nwrote ${resolve(outDir, 'latest.json')}`);
}

main();

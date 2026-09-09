import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RetrievalEngine } from '@cognifetch/engine';

/**
 * Ad-hoc retrieval against a JSONL corpus file, no database.
 * Usage: npm run search:file -- [--input data/seed/corpus.jsonl] [--k 5] your query terms
 */
function parseArgs(argv: string[]): { input: string; k: number; query: string } {
  let input = 'data/seed/corpus.jsonl';
  let k = 5;
  const words: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--input') input = argv[++i] ?? input;
    else if (a === '--k') k = Number(argv[++i] ?? k);
    else words.push(a);
  }
  return { input, k, query: words.join(' ') };
}

const { input, k, query } = parseArgs(process.argv.slice(2));
if (!query) throw new Error('Provide a query string');

const rows = readFileSync(resolve(process.cwd(), input), 'utf8').trim().split('\n');
const docs = rows.map((line) => {
  const d = JSON.parse(line) as { _id: string; title: string; abstract: string };
  return { id: d._id, title: d.title, body: d.abstract };
});

const t0 = performance.now();
const engine = RetrievalEngine.build(docs);
console.log(
  `indexed ${engine.size} docs / ${engine.vocabularySize} terms in ${(performance.now() - t0).toFixed(0)}ms\n`,
);

const res = engine.search({ query, limit: k });
console.log(
  `"${query}"  ->  ${res.totalHits} hits in ${res.tookMs.toFixed(2)}ms  [terms: ${res.terms.join(', ')}]\n`,
);
for (const h of res.hits) {
  console.log(`  #${h.rank}  score=${h.score.toFixed(4)}  ${h.id}`);
  console.log(`      ${h.title}`);
  if (h.snippet) console.log(`      ${h.snippet.replace(/<\/?mark>/g, '*').slice(0, 160)}`);
}

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';
import { ArxivOaiClient, type OaiRecord } from '../arxiv/oai-client.js';
import type { StoredDocument } from '../documents.js';

/**
 * Harvest a small corpus straight from arXiv OAI-PMH into a committed JSONL seed
 * file — no MongoDB required. Used to (re)generate data/seed/corpus.jsonl.
 *
 * Usage: npm run seed:harvest -- --count 500 --output data/seed/corpus.jsonl [--sets cs,stat]
 */
function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? (process.argv[i + 1] ?? fallback) : fallback;
}

function isUsable(rec: OaiRecord): boolean {
  return !rec.deleted && rec.title.length > 3 && rec.abstract.length > 40;
}

function toStoredDocument(rec: OaiRecord): StoredDocument {
  return {
    _id: rec.id,
    source: 'arxiv',
    title: rec.title,
    abstract: rec.abstract,
    authors: rec.authors,
    categories: rec.categories,
    primaryCategory: rec.primaryCategory,
    published: rec.created,
    updated: rec.updated,
    arxivUrl: `https://arxiv.org/abs/${rec.id}`,
    pdfUrl: `https://arxiv.org/pdf/${rec.id}`,
    ingestedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const count = Number(arg('count', '500'));
  const output = resolve(process.cwd(), arg('output', 'data/seed/corpus.jsonl'));
  const sets = arg('sets', config.ARXIV_SETS.join(','))
    .split(',')
    .map((s) => s.trim());
  // Default to recent papers so the committed sample is recognisable.
  const from = arg('from', new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10));
  const until = arg('until', '');
  const range = until ? { from, until } : { from };

  const client = new ArxivOaiClient({
    endpoint: config.ARXIV_OAI_ENDPOINT,
    requestDelayMs: config.ARXIV_REQUEST_DELAY_MS,
  });

  console.log(
    `Harvesting ${count} seed records from sets [${sets.join(', ')}] ` +
      `in [${from} .. ${until || 'now'}]...`,
  );
  const docs: StoredDocument[] = [];
  const seen = new Set<string>();

  for (const set of sets) {
    if (docs.length >= count) break;
    let page = await client.listRecords(set, range);
    for (;;) {
      for (const rec of page.records) {
        if (docs.length >= count) break;
        if (!isUsable(rec) || seen.has(rec.id)) continue;
        seen.add(rec.id);
        docs.push(toStoredDocument(rec));
      }
      console.log(`  ${set}: ${docs.length}/${count}`);
      if (docs.length >= count || !page.resumptionToken) break;
      page = await client.resume(page.resumptionToken);
    }
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, docs.map((d) => JSON.stringify(d)).join('\n') + '\n', 'utf8');
  console.log(`\nWrote ${docs.length} documents to ${output}`);
}

main().catch((err: unknown) => {
  console.error('Seed harvest failed:', err);
  process.exit(1);
});

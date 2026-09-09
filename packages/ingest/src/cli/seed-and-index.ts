import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, closeDb } from '../db.js';
import { countDocuments } from '../documents.js';
import { loadSeed } from '../seed.js';
import { buildEngineFromDb, persistIndex, readIndexMeta } from '../index-store.js';

/**
 * One-shot bootstrap for `docker compose`: load the committed seed corpus (if the
 * corpus is empty) and (re)build the persisted index. Idempotent.
 *
 * Usage: node packages/ingest/dist/cli/seed-and-index.js [--input data/seed/corpus.jsonl]
 */
async function main(): Promise<void> {
  const inputIdx = process.argv.indexOf('--input');
  const input = inputIdx !== -1 ? process.argv[inputIdx + 1]! : 'data/seed/corpus.jsonl';
  const path = resolve(process.cwd(), input);

  const db = await getDb();
  const existing = await countDocuments(db);

  if (existing === 0) {
    if (!existsSync(path)) {
      throw new Error(`Corpus is empty and seed file not found at ${path}`);
    }
    const { read, inserted } = await loadSeed(db, path);
    console.log(`seed: loaded ${read} docs (${inserted} new)`);
  } else {
    console.log(`seed: corpus already has ${existing} docs, skipping load`);
  }

  const meta = await readIndexMeta(db);
  const corpusSize = await countDocuments(db);
  if (meta?.docCount === corpusSize) {
    console.log(`index: already current (${corpusSize} docs), skipping build`);
  } else {
    const engine = await buildEngineFromDb(db);
    const built = await persistIndex(db, engine);
    console.log(
      `index: built over ${engine.size} docs, ${engine.vocabularySize} terms (${(built.sizeBytesGzip / 1024 / 1024).toFixed(2)} MiB gzip)`,
    );
  }

  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('seed-and-index failed:', err);
  await closeDb();
  process.exit(1);
});

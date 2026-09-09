import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, closeDb } from '../db.js';
import { countDocuments } from '../documents.js';
import { loadSeed } from '../seed.js';

/**
 * Load a JSONL corpus file into the `documents` collection.
 *
 * Usage: npm run seed:load -- --input data/seed/corpus.jsonl
 */
async function main(): Promise<void> {
  const inputArg = process.argv.indexOf('--input');
  const input = inputArg !== -1 ? process.argv[inputArg + 1] : 'data/seed/corpus.jsonl';
  if (!input) throw new Error('Missing --input path');

  const path = resolve(process.cwd(), input);
  if (!existsSync(path)) {
    console.error(`Seed file not found: ${path}`);
    await closeDb();
    process.exit(1);
  }

  const db = await getDb();
  console.log(`Loading seed corpus from ${input} ...`);
  const { read, inserted } = await loadSeed(db, path);
  const total = await countDocuments(db);

  console.log(`  rows read:     ${read}`);
  console.log(`  newly inserted: ${inserted}`);
  console.log(`  corpus size:   ${total}`);

  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('Seed load failed:', err);
  await closeDb();
  process.exit(1);
});

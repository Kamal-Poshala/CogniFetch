import { resolve } from 'node:path';
import { getDb, closeDb } from '../db.js';
import { dumpSeed } from '../seed.js';

/**
 * Export the current corpus to a JSONL file (used to refresh the committed seed).
 *
 * Usage: npm run seed:dump -- --output data/seed/corpus.jsonl [--limit 500]
 */
async function main(): Promise<void> {
  const outArg = process.argv.indexOf('--output');
  const output = outArg !== -1 ? process.argv[outArg + 1] : 'data/seed/corpus.jsonl';
  if (!output) throw new Error('Missing --output path');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : undefined;

  const db = await getDb();
  const path = resolve(process.cwd(), output);
  const count = await dumpSeed(db, path, limit ? { limit } : {});
  console.log(`Wrote ${count} documents to ${output}`);
  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('Seed dump failed:', err);
  await closeDb();
  process.exit(1);
});

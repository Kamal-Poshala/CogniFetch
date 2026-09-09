import { getDb, closeDb } from '../db.js';
import { countDocuments } from '../documents.js';
import { buildEngineFromDb, persistIndex } from '../index-store.js';

/**
 * Build the inverted index from the `documents` collection and persist a
 * gzipped snapshot to GridFS for fast server cold-starts.
 *
 * Usage: npm run index:build
 */
async function main(): Promise<void> {
  const db = await getDb();
  const total = await countDocuments(db);
  if (total === 0) {
    console.error(
      'No documents in the corpus. Run `npm run harvest` or `npm run seed:load` first.',
    );
    await closeDb();
    process.exit(1);
  }

  console.log(`Building index over ${total} documents...`);
  const t0 = performance.now();
  const engine = await buildEngineFromDb(db);
  const buildMs = performance.now() - t0;

  console.log(`  built in ${(buildMs / 1000).toFixed(2)}s`);
  console.log(`  documents: ${engine.size}`);
  console.log(`  vocabulary: ${engine.vocabularySize} terms`);

  const meta = await persistIndex(db, engine);
  console.log(`\nPersisted to GridFS:`);
  console.log(`  gzip size: ${(meta.sizeBytesGzip / 1024 / 1024).toFixed(2)} MiB`);
  console.log(`  built at:  ${meta.builtAt}`);

  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('Index build failed:', err);
  await closeDb();
  process.exit(1);
});

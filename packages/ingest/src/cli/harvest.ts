import { config } from '../config.js';
import { getDb, closeDb } from '../db.js';
import { countDocuments } from '../documents.js';
import { harvest } from '../arxiv/harvester.js';

/**
 * Usage: npm run harvest -- [--limit N] [--sets cs,stat] [--delay 3100]
 */
async function main(): Promise<void> {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, '');
    if (key) args.set(key, process.argv[i + 1] ?? '');
  }

  const limit = args.has('limit') ? Number(args.get('limit')) : config.HARVEST_LIMIT;
  const sets = args.has('sets')
    ? args
        .get('sets')!
        .split(',')
        .map((s) => s.trim())
    : config.ARXIV_SETS;
  const requestDelayMs = args.has('delay')
    ? Number(args.get('delay'))
    : config.ARXIV_REQUEST_DELAY_MS;

  console.log(`Harvesting up to ${limit} arXiv records from sets [${sets.join(', ')}]`);
  console.log(`Endpoint: ${config.ARXIV_OAI_ENDPOINT}  ·  delay: ${requestDelayMs}ms/request\n`);

  const db = await getDb();
  const startCount = await countDocuments(db);
  const startedAt = Date.now();

  const summary = await harvest(db, {
    sets,
    limit,
    endpoint: config.ARXIV_OAI_ENDPOINT,
    requestDelayMs,
    onProgress: (p) => {
      const pct = ((p.persisted / p.totalTarget) * 100).toFixed(1);
      process.stdout.write(
        `\r  ${p.set}: ${p.persisted}/${p.totalTarget} persisted (${pct}%)  ` +
          `${p.inserted} new  ·  ${p.fetched} scanned   `,
      );
    },
  });

  const mins = ((Date.now() - startedAt) / 60_000).toFixed(1);
  const endCount = await countDocuments(db);
  console.log(`\n\nDone in ${mins} min.`);
  console.log(`  scanned:   ${summary.fetched}`);
  console.log(`  persisted: ${summary.persisted}`);
  console.log(`  new:       ${summary.inserted}`);
  console.log(`  by set:    ${JSON.stringify(summary.bySet)}`);
  console.log(`  corpus:    ${startCount} -> ${endCount} documents`);

  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('\nHarvest failed:', err);
  await closeDb();
  process.exit(1);
});

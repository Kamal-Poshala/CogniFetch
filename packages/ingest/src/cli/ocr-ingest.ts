import { readFile } from 'node:fs/promises';
import { getDb, closeDb } from '../db.js';
import { countDocuments, upsertDocuments, type StoredDocument } from '../documents.js';
import { ocrPaths, type OcrResultRow } from '../ocr/pipeline.js';

/**
 * Load OCR'd documents (that passed the quality gate) into the corpus with
 * `source: 'ocr'` and their measured accuracy recorded as provenance.
 *
 * Usage: npm run ocr:ingest -- [--out data/ocr] [--all]
 */
async function main(): Promise<void> {
  const paths = ocrPaths();
  const includeUnusable = process.argv.includes('--all');

  const rows = (await readFile(paths.results, 'utf8'))
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as OcrResultRow)
    .filter((r) => includeUnusable || r.usable);

  const now = new Date().toISOString();
  const docs: StoredDocument[] = rows.map((r) => ({
    _id: `ocr:${r.id}`,
    source: 'ocr',
    title: r.title,
    abstract: r.abstract,
    authors: [],
    categories: [],
    primaryCategory: '',
    published: '',
    updated: '',
    arxivUrl: `https://arxiv.org/abs/${r.id}`,
    pdfUrl: `https://arxiv.org/pdf/${r.id}`,
    ocr: {
      engine: 'tesseract.js@7',
      cer: r.cer,
      wer: r.wer,
      sourcePaper: r.id,
      scannedAt: now,
    },
    ingestedAt: now,
  }));

  const db = await getDb();
  const { inserted } = await upsertDocuments(db, docs);
  const total = await countDocuments(db);
  const ocrTotal = await countDocuments(db, 'ocr');

  console.log(`Ingested ${docs.length} OCR documents (${inserted} new).`);
  console.log(`  corpus: ${total} total, ${ocrTotal} from OCR`);
  console.log(`\nRebuild the index:  npm run index:build`);

  await closeDb();
}

main().catch(async (err: unknown) => {
  console.error('ocr:ingest failed:', err);
  await closeDb();
  process.exit(1);
});

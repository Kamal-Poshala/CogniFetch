import { createReadStream } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { z } from 'zod';
import type { Db } from 'mongodb';
import {
  documentsCollection,
  ensureIndexes,
  upsertDocuments,
  type StoredDocument,
} from './documents.js';

const StoredDocumentSchema = z.object({
  _id: z.string().min(1),
  source: z.enum(['arxiv', 'ocr']),
  title: z.string().min(1),
  abstract: z.string().min(1),
  authors: z.array(z.string()),
  categories: z.array(z.string()),
  primaryCategory: z.string(),
  published: z.string(),
  updated: z.string(),
  arxivUrl: z.string(),
  pdfUrl: z.string(),
  ocr: z
    .object({
      engine: z.string(),
      cer: z.number(),
      wer: z.number(),
      sourcePaper: z.string(),
      scannedAt: z.string(),
    })
    .optional(),
  ingestedAt: z.string(),
});

/** Load a JSONL file of {@link StoredDocument} rows into the `documents` collection. */
export async function loadSeed(db: Db, path: string): Promise<{ read: number; inserted: number }> {
  await ensureIndexes(db);
  const rl = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });

  let read = 0;
  let inserted = 0;
  let batch: StoredDocument[] = [];

  const flush = async (): Promise<void> => {
    if (batch.length === 0) return;
    const res = await upsertDocuments(db, batch);
    inserted += res.inserted;
    batch = [];
  };

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parsed = StoredDocumentSchema.parse(JSON.parse(trimmed));
    batch.push(parsed as StoredDocument);
    read++;
    if (batch.length >= 500) await flush();
  }
  await flush();

  return { read, inserted };
}

/** Dump the current corpus (or a capped sample) to a JSONL file. */
export async function dumpSeed(
  db: Db,
  path: string,
  opts: { limit?: number } = {},
): Promise<number> {
  await mkdir(dirname(path), { recursive: true });
  const cursor = documentsCollection(db).find({}).sort({ _id: 1 });
  if (opts.limit) cursor.limit(opts.limit);

  const lines: string[] = [];
  for await (const doc of cursor) {
    lines.push(JSON.stringify(doc));
  }
  await writeFile(path, lines.join('\n') + '\n', 'utf8');
  return lines.length;
}

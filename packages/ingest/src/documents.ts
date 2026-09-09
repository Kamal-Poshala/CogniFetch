import type { Collection, Db } from 'mongodb';
import type { EngineDocument } from '@cognifetch/engine';

/** Provenance of a stored document. */
export type DocumentSource = 'arxiv' | 'ocr';

/** OCR provenance, present only when `source === 'ocr'`. */
export interface OcrProvenance {
  /** OCR engine identifier, e.g. `tesseract.js@6`. */
  engine: string;
  /** Character error rate against the known ground truth (0–1). */
  cer: number;
  /** Word error rate against the known ground truth (0–1). */
  wer: number;
  /** arXiv id of the held-out paper the synthetic scan was rendered from. */
  sourcePaper: string;
  scannedAt: string;
}

/**
 * A document in the corpus. `_id` is the arXiv identifier
 * (`2401.01234` or the legacy `cs/0501001` form).
 */
export interface StoredDocument {
  _id: string;
  source: DocumentSource;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  primaryCategory: string;
  published: string;
  updated: string;
  arxivUrl: string;
  pdfUrl: string;
  ocr?: OcrProvenance;
  ingestedAt: string;
}

export const COLLECTION = 'documents';

export function documentsCollection(db: Db): Collection<StoredDocument> {
  return db.collection<StoredDocument>(COLLECTION);
}

type EngineDocFields = Pick<
  StoredDocument,
  | '_id'
  | 'title'
  | 'abstract'
  | 'source'
  | 'primaryCategory'
  | 'categories'
  | 'authors'
  | 'published'
  | 'arxivUrl'
>;

/** Fields the engine needs projected out of MongoDB. */
export const ENGINE_DOC_PROJECTION = {
  _id: 1,
  title: 1,
  abstract: 1,
  source: 1,
  primaryCategory: 1,
  categories: 1,
  authors: 1,
  published: 1,
  arxivUrl: 1,
} as const;

/** Map a stored document to the shape the retrieval engine indexes, carrying
 * display/facet metadata through as opaque `meta`. */
export function toEngineDocument(doc: EngineDocFields): EngineDocument {
  return {
    id: doc._id,
    title: doc.title,
    body: doc.abstract,
    meta: {
      source: doc.source,
      primaryCategory: doc.primaryCategory,
      categories: doc.categories,
      authors: doc.authors.slice(0, 8),
      published: doc.published,
      url: doc.arxivUrl,
    },
  };
}

export async function ensureIndexes(db: Db): Promise<void> {
  const col = documentsCollection(db);
  await col.createIndexes([
    { key: { source: 1 } },
    { key: { primaryCategory: 1 } },
    { key: { published: -1 } },
    { key: { ingestedAt: -1 } },
  ]);
}

/** Upsert a batch of documents, returning how many were newly inserted. */
export async function upsertDocuments(
  db: Db,
  docs: StoredDocument[],
): Promise<{ inserted: number; modified: number }> {
  if (docs.length === 0) return { inserted: 0, modified: 0 };
  const res = await documentsCollection(db).bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  return { inserted: res.upsertedCount, modified: res.modifiedCount };
}

export async function countDocuments(db: Db, source?: DocumentSource): Promise<number> {
  return documentsCollection(db).countDocuments(source ? { source } : {});
}

/** Async-iterate the whole corpus in `_id` order, projecting only index fields. */
export async function* iterateEngineDocuments(db: Db): AsyncGenerator<EngineDocument> {
  const cursor = documentsCollection(db)
    .find({}, { projection: ENGINE_DOC_PROJECTION })
    .sort({ _id: 1 });
  for await (const doc of cursor) {
    yield toEngineDocument(doc);
  }
}

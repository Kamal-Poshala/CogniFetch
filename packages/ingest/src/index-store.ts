import { gzipSync, gunzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import { GridFSBucket, type Db } from 'mongodb';
import { RetrievalEngine, type SerializedIndex } from '@cognifetch/engine';
import { iterateEngineDocuments, countDocuments } from './documents.js';

const BUCKET = 'search_index';
const FILENAME = 'index-v1.json.gz';
export const META_COLLECTION = 'index_meta';

export interface IndexMeta {
  _id: 'current';
  builtAt: string;
  docCount: number;
  vocabSize: number;
  sizeBytesGzip: number;
  engineOptions: SerializedIndex['options'];
}

/** Build an in-memory engine by streaming the entire corpus out of MongoDB. */
export async function buildEngineFromDb(
  db: Db,
  opts: { keepDocTerms?: boolean } = {},
): Promise<RetrievalEngine> {
  const engine = new RetrievalEngine({ keepDocTerms: opts.keepDocTerms ?? false });
  for await (const doc of iterateEngineDocuments(db)) {
    engine.addDocument(doc);
  }
  engine.finalize();
  return engine;
}

/** Serialise + gzip an engine and store it in GridFS, replacing any prior blob. */
export async function persistIndex(db: Db, engine: RetrievalEngine): Promise<IndexMeta> {
  const bucket = new GridFSBucket(db, { bucketName: BUCKET });

  // Drop previous revisions.
  for await (const file of bucket.find({ filename: FILENAME })) {
    await bucket.delete(file._id);
  }

  const json = Buffer.from(JSON.stringify(engine.toJSON()), 'utf8');
  const gz = gzipSync(json, { level: 9 });

  await new Promise<void>((resolvePromise, reject) => {
    const stream = bucket.openUploadStream(FILENAME, {
      metadata: { contentType: 'application/gzip', version: 1 },
    });
    stream.on('error', reject);
    stream.on('finish', () => {
      resolvePromise();
    });
    stream.end(gz);
  });

  const meta: IndexMeta = {
    _id: 'current',
    builtAt: new Date().toISOString(),
    docCount: engine.size,
    vocabSize: engine.vocabularySize,
    sizeBytesGzip: gz.byteLength,
    engineOptions: engine.options,
  };
  await db.collection<IndexMeta>(META_COLLECTION).replaceOne({ _id: 'current' }, meta, {
    upsert: true,
  });
  return meta;
}

/** Load the persisted index blob, or `null` if none has been built. */
export async function loadPersistedIndex(
  db: Db,
  opts: { keepDocTerms?: boolean } = {},
): Promise<RetrievalEngine | null> {
  const bucket = new GridFSBucket(db, { bucketName: BUCKET });
  const files = await bucket.find({ filename: FILENAME }).toArray();
  if (files.length === 0) return null;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolvePromise, reject) => {
    bucket
      .openDownloadStreamByName(FILENAME)
      .on('data', (c: Buffer) => chunks.push(c))
      .on('error', reject)
      .on('end', () => {
        resolvePromise();
      });
  });

  const json = gunzipSync(Buffer.concat(chunks)).toString('utf8');
  const data = JSON.parse(json) as SerializedIndex;
  return RetrievalEngine.fromJSON(data, { keepDocTerms: opts.keepDocTerms ?? false });
}

export async function readIndexMeta(db: Db): Promise<IndexMeta | null> {
  return db.collection<IndexMeta>(META_COLLECTION).findOne({ _id: 'current' });
}

/**
 * Return a ready engine: use the persisted blob when it matches the current
 * corpus size, otherwise rebuild from documents (and persist if asked).
 */
export async function getEngine(
  db: Db,
  opts: { persistIfRebuilt?: boolean; keepDocTerms?: boolean } = {},
): Promise<{ engine: RetrievalEngine; source: 'persisted' | 'rebuilt' }> {
  const [meta, corpusSize] = await Promise.all([readIndexMeta(db), countDocuments(db)]);

  if (meta && meta.docCount === corpusSize && corpusSize > 0) {
    const engine = await loadPersistedIndex(db, opts);
    if (engine) return { engine, source: 'persisted' };
  }

  const engine = await buildEngineFromDb(db, opts);
  if (opts.persistIfRebuilt && engine.size > 0) {
    await persistIndex(db, engine);
  }
  return { engine, source: 'rebuilt' };
}

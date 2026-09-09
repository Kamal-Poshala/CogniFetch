export { config, type IngestConfig } from './config.js';
export { getDb, closeDb } from './db.js';
export {
  COLLECTION,
  documentsCollection,
  ensureIndexes,
  upsertDocuments,
  countDocuments,
  iterateEngineDocuments,
  toEngineDocument,
  type StoredDocument,
  type DocumentSource,
  type OcrProvenance,
} from './documents.js';
export {
  buildEngineFromDb,
  persistIndex,
  loadPersistedIndex,
  readIndexMeta,
  getEngine,
  META_COLLECTION,
  type IndexMeta,
} from './index-store.js';
export {
  harvest,
  type HarvestOptions,
  type HarvestSummary,
  type HarvestProgress,
} from './arxiv/harvester.js';
export { ArxivOaiClient, type OaiRecord, type ListRecordsPage } from './arxiv/oai-client.js';
export { loadSeed, dumpSeed } from './seed.js';
export {
  normalizeAbstract,
  normalizeTitle,
  dehyphenate,
  collapseWhitespace,
  stripLatex,
} from './text.js';

// The OCR pipeline (sharp, tesseract.js, pdf-lib) is deliberately NOT re-exported
// here — import it from '@cognifetch/ingest/ocr' so the API server never pulls in
// those native dependencies.

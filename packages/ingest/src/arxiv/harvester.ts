import type { Db } from 'mongodb';
import { ensureIndexes, upsertDocuments, type StoredDocument } from '../documents.js';
import { ArxivOaiClient, type OaiRecord } from './oai-client.js';

export interface HarvestOptions {
  sets: string[];
  limit: number;
  endpoint: string;
  requestDelayMs: number;
  /** Progress callback, fired after every persisted batch. */
  onProgress?: (progress: HarvestProgress) => void;
  fetchImpl?: typeof fetch;
}

export interface HarvestProgress {
  set: string;
  fetched: number;
  persisted: number;
  inserted: number;
  totalTarget: number;
}

export interface HarvestSummary {
  fetched: number;
  persisted: number;
  inserted: number;
  bySet: Record<string, number>;
}

function toStoredDocument(rec: OaiRecord): StoredDocument {
  const now = new Date().toISOString();
  return {
    _id: rec.id,
    source: 'arxiv',
    title: rec.title,
    abstract: rec.abstract,
    authors: rec.authors,
    categories: rec.categories,
    primaryCategory: rec.primaryCategory,
    published: rec.created,
    updated: rec.updated,
    arxivUrl: `https://arxiv.org/abs/${rec.id}`,
    pdfUrl: `https://arxiv.org/pdf/${rec.id}`,
    ingestedAt: now,
  };
}

/** Keep only records with enough text to be worth indexing. */
function isUsable(rec: OaiRecord): boolean {
  return !rec.deleted && rec.title.length > 3 && rec.abstract.length > 40;
}

/**
 * Harvest arXiv metadata via OAI-PMH into the `documents` collection, stopping
 * once `limit` documents have been persisted. Resumable: re-running upserts, so
 * an interrupted harvest just continues to fill the gap on the next run.
 */
export async function harvest(db: Db, options: HarvestOptions): Promise<HarvestSummary> {
  await ensureIndexes(db);
  const client = new ArxivOaiClient({
    endpoint: options.endpoint,
    requestDelayMs: options.requestDelayMs,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });

  const summary: HarvestSummary = { fetched: 0, persisted: 0, inserted: 0, bySet: {} };
  const seen = new Set<string>();

  for (const set of options.sets) {
    if (summary.persisted >= options.limit) break;
    summary.bySet[set] ??= 0;

    let page = await client.listRecords(set);
    for (;;) {
      const batch: StoredDocument[] = [];
      for (const rec of page.records) {
        summary.fetched++;
        if (!isUsable(rec) || seen.has(rec.id)) continue;
        seen.add(rec.id);
        batch.push(toStoredDocument(rec));
        if (summary.persisted + batch.length >= options.limit) break;
      }

      if (batch.length > 0) {
        const { inserted } = await upsertDocuments(db, batch);
        summary.persisted += batch.length;
        summary.inserted += inserted;
        summary.bySet[set] += batch.length;
        options.onProgress?.({
          set,
          fetched: summary.fetched,
          persisted: summary.persisted,
          inserted: summary.inserted,
          totalTarget: options.limit,
        });
      }

      if (summary.persisted >= options.limit || !page.resumptionToken) break;
      page = await client.resume(page.resumptionToken);
    }
  }

  return summary;
}

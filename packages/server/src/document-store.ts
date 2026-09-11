import type { Db } from 'mongodb';
import { documentsCollection, type StoredDocument } from '@cognifetch/ingest';

/** A document as returned by the API (Mongo's `_id` renamed to `id`). */
export interface DocumentView extends Omit<StoredDocument, '_id'> {
  id: string;
}

export interface CorpusStats {
  total: number;
  bySource: Record<string, number>;
  topCategories: Array<{ category: string; count: number }>;
  newest: string | null;
}

/** Read model the API needs beyond the in-memory index. */
export interface DocumentStore {
  getById(id: string): Promise<DocumentView | null>;
  corpusStats(): Promise<CorpusStats>;
}

function toView(doc: StoredDocument): DocumentView {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

export class MongoDocumentStore implements DocumentStore {
  constructor(private readonly db: Db) {}

  async getById(id: string): Promise<DocumentView | null> {
    const doc = await documentsCollection(this.db).findOne({ _id: id });
    return doc ? toView(doc) : null;
  }

  async corpusStats(): Promise<CorpusStats> {
    const col = documentsCollection(this.db);
    const [total, bySourceAgg, byCategoryAgg, newestDoc] = await Promise.all([
      col.estimatedDocumentCount(),
      col
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$source', count: { $sum: 1 } } },
        ])
        .toArray(),
      col
        .aggregate<{ _id: string; count: number }>([
          { $match: { primaryCategory: { $ne: '' } } },
          { $group: { _id: '$primaryCategory', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 12 },
        ])
        .toArray(),
      col.find({}, { projection: { published: 1 }, sort: { published: -1 }, limit: 1 }).toArray(),
    ]);

    return {
      total,
      bySource: Object.fromEntries(bySourceAgg.map((r) => [r._id, r.count])),
      topCategories: byCategoryAgg.map((r) => ({ category: r._id, count: r.count })),
      newest: newestDoc[0]?.published ?? null,
    };
  }
}

/** In-memory store for tests. */
export class InMemoryDocumentStore implements DocumentStore {
  private readonly byId = new Map<string, DocumentView>();

  constructor(docs: StoredDocument[]) {
    for (const doc of docs) this.byId.set(doc._id, toView(doc));
  }

  getById(id: string): Promise<DocumentView | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  corpusStats(): Promise<CorpusStats> {
    const docs = [...this.byId.values()];
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let newest: string | null = null;
    for (const d of docs) {
      bySource[d.source] = (bySource[d.source] ?? 0) + 1;
      if (d.primaryCategory)
        byCategory[d.primaryCategory] = (byCategory[d.primaryCategory] ?? 0) + 1;
      if (d.published && (!newest || d.published > newest)) newest = d.published;
    }
    return Promise.resolve({
      total: docs.length,
      bySource,
      topCategories: Object.entries(byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      newest,
    });
  }
}

import type { RetrievalEngine, SearchResult } from '@cognifetch/engine';
import type { DocumentStore, DocumentView, CorpusStats } from './document-store.js';

export interface IndexSnapshot {
  /** Where the in-memory index came from at boot. */
  source: 'persisted' | 'rebuilt' | 'memory';
  docCount: number;
  vocabSize: number;
  loadedAt: string;
}

export interface SearchInput {
  query: string;
  limit: number;
  offset: number;
  snippets: boolean;
  facets: string[];
  filters: Record<string, string[]>;
}

export interface SearchResponse extends SearchResult {
  limit: number;
  offset: number;
}

const FACET_KEYS = ['primaryCategory', 'source'];

/**
 * Coordinates the in-memory {@link RetrievalEngine} with the {@link DocumentStore}.
 * The HTTP layer depends only on this class, so tests can drive it without Mongo.
 */
export class SearchService {
  constructor(
    private readonly engine: RetrievalEngine,
    private readonly docStore: DocumentStore,
    private readonly snapshot: IndexSnapshot,
  ) {}

  search(input: SearchInput): SearchResponse {
    const result = this.engine.search({
      query: input.query,
      limit: input.limit,
      offset: input.offset,
      snippets: input.snippets,
      facets: input.facets.length > 0 ? input.facets : FACET_KEYS,
      filters: input.filters,
    });
    return { ...result, limit: input.limit, offset: input.offset };
  }

  getDocument(id: string): Promise<DocumentView | null> {
    return this.docStore.getById(id);
  }

  async stats(): Promise<CorpusStats & { index: IndexSnapshot }> {
    const corpus = await this.docStore.corpusStats();
    return { ...corpus, index: this.indexSnapshot() };
  }

  indexSnapshot(): IndexSnapshot {
    return {
      ...this.snapshot,
      docCount: this.engine.size,
      vocabSize: this.engine.vocabularySize,
    };
  }
}

export { createApp } from './app.js';
export {
  SearchService,
  type SearchInput,
  type SearchResponse,
  type IndexSnapshot,
} from './search-service.js';
export {
  type DocumentStore,
  type DocumentView,
  type CorpusStats,
  MongoDocumentStore,
  InMemoryDocumentStore,
} from './document-store.js';
export { ApiError } from './errors.js';
export { SearchQuerySchema, DocumentIdSchema } from './validation.js';
export { config, type ServerConfig } from './config.js';

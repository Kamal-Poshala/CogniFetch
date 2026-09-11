import { getDb, closeDb, getEngine } from '@cognifetch/ingest';
import { config } from './config.js';
import { logger } from './logger.js';
import { createApp } from './app.js';
import { MongoDocumentStore } from './document-store.js';
import { SearchService, type IndexSnapshot } from './search-service.js';

async function main(): Promise<void> {
  logger.info({ db: config.MONGO_DB }, 'connecting to MongoDB');
  const db = await getDb();

  const t0 = performance.now();
  const { engine, source } = await getEngine(db, { persistIfRebuilt: false });
  const snapshot: IndexSnapshot = {
    source,
    docCount: engine.size,
    vocabSize: engine.vocabularySize,
    loadedAt: new Date().toISOString(),
  };
  logger.info(
    {
      source,
      docCount: engine.size,
      vocabSize: engine.vocabularySize,
      ms: Math.round(performance.now() - t0),
    },
    'search index ready',
  );

  if (engine.size === 0) {
    logger.warn('index is empty — run `npm run harvest` / `npm run ingest:demo` then restart');
  }

  const service = new SearchService(engine, new MongoDocumentStore(db), snapshot);
  const app = createApp(service);

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'CogniFetch API listening');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
      void closeDb().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'failed to start');
  void closeDb().finally(() => process.exit(1));
});

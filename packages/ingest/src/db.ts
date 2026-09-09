import { MongoClient, type Db } from 'mongodb';
import { config } from './config.js';

let client: MongoClient | undefined;

/** Connect once and reuse. Callers should {@link closeDb} when a CLI finishes. */
export async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(config.MONGO_URL, {
      serverSelectionTimeoutMS: 10_000,
      retryWrites: true,
    });
    await client.connect();
  }
  return client.db(config.MONGO_DB);
}

export async function closeDb(): Promise<void> {
  await client?.close();
  client = undefined;
}

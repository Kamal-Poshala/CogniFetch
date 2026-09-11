import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load the repo-root .env if present (ingest is run from the repo root or its own dir).
for (const candidate of ['.env', '../../.env', resolve(process.cwd(), '.env')]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}

const Schema = z.object({
  MONGO_URL: z.string().default('mongodb://localhost:27017'),
  MONGO_DB: z.string().default('cognifetch'),
  ARXIV_OAI_ENDPOINT: z.string().default('https://export.arxiv.org/oai2'),
  ARXIV_SETS: z
    .string()
    .default('cs,stat')
    .transform((s) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  HARVEST_LIMIT: z.coerce.number().int().positive().default(15_000),
  ARXIV_REQUEST_DELAY_MS: z.coerce.number().int().min(3000).default(3100),
  OCR_SYNTH_COUNT: z.coerce.number().int().positive().default(2500),
  OCR_CONCURRENCY: z.coerce.number().int().positive().max(16).default(4),
});

export type IngestConfig = z.infer<typeof Schema>;

export const config: IngestConfig = Schema.parse(process.env);

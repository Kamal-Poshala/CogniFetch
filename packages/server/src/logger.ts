import { pino } from 'pino';
import { config } from './config.js';

/**
 * Structured JSON logs. In development, pipe the process through `pino-pretty`
 * for readable output (`npm run dev | npx pino-pretty`).
 */
export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
});

export type Logger = typeof logger;

import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { createApiRouter, createHealthRouter } from './routes.js';
import type { SearchService } from './search-service.js';

/**
 * Build the Express app around a ready {@link SearchService}. Pure and
 * side-effect-free (no listening, no DB) so tests can exercise it directly.
 */
export function createApp(service: SearchService): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS.includes('*') ? true : config.CORS_ORIGINS,
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.use('/', createHealthRouter(service));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: config.RATE_LIMIT_PER_MIN,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'rate_limited', message: 'Too many requests, slow down.' } },
    }),
    createApiRouter(service),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

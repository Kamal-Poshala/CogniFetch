import { Router } from 'express';
import { ApiError } from './errors.js';
import { SearchQuerySchema, DocumentIdSchema } from './validation.js';
import type { SearchService } from './search-service.js';

/** All API routes, given a ready {@link SearchService}. */
export function createApiRouter(service: SearchService): Router {
  const router = Router();

  router.get('/search', (req, res) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid search parameters', parsed.error.issues);
    }
    const t0 = performance.now();
    const result = service.search(parsed.data);
    res.set(
      'Server-Timing',
      `search;dur=${result.tookMs.toFixed(2)}, total;dur=${(performance.now() - t0).toFixed(2)}`,
    );
    res.json(result);
  });

  router.get('/documents/:id', async (req, res) => {
    const id = DocumentIdSchema.parse(req.params.id);
    const doc = await service.getDocument(id);
    if (!doc) throw ApiError.notFound(`No document with id "${id}"`);
    res.json(doc);
  });

  router.get('/stats', async (_req, res) => {
    res.json(await service.stats());
  });

  return router;
}

/** Liveness/readiness probe. */
export function createHealthRouter(service: SearchService): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    const index = service.indexSnapshot();
    const healthy = index.docCount > 0;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      uptimeSec: Math.round(process.uptime()),
      index,
    });
  });
  return router;
}

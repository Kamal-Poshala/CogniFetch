import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RetrievalEngine } from '@cognifetch/engine';
import { toEngineDocument, type StoredDocument } from '@cognifetch/ingest';
import { createApp } from './app.js';
import { InMemoryDocumentStore } from './document-store.js';
import { SearchService } from './search-service.js';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

function loadSeed(): StoredDocument[] {
  const path = resolve(REPO_ROOT, 'data/seed/corpus.jsonl');
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as StoredDocument);
}

describe('CogniFetch API', () => {
  let app: ReturnType<typeof createApp>;
  let docs: StoredDocument[];

  beforeAll(() => {
    docs = loadSeed();
    const engine = RetrievalEngine.build(docs.map(toEngineDocument));
    const service = new SearchService(engine, new InMemoryDocumentStore(docs), {
      source: 'memory',
      docCount: engine.size,
      vocabSize: engine.vocabularySize,
      loadedAt: new Date().toISOString(),
    });
    app = createApp(service);
  });

  describe('GET /health', () => {
    it('reports ok with index stats', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.index.docCount).toBe(docs.length);
      expect(res.body.index.vocabSize).toBeGreaterThan(1000);
    });
  });

  describe('GET /api/search', () => {
    it('returns ranked hits with snippets and facets', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: 'neural network training', limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body.hits.length).toBeGreaterThan(0);
      expect(res.body.hits.length).toBeLessThanOrEqual(5);
      expect(res.body.hits[0]).toHaveProperty('score');
      expect(res.body.hits[0].snippet).toContain('<mark>');
      expect(res.body.terms).toContain('neural');
      expect(res.body.facets).toHaveProperty('primaryCategory');
      expect(res.headers['server-timing']).toMatch(/search;dur=/);
    });

    it('ranks a strong lexical match first', async () => {
      const res = await request(app).get('/api/search').query({ q: 'transformer attention' });
      const top = res.body.hits[0];
      expect(`${top.title} ${top.snippet}`.toLowerCase()).toMatch(/transformer|attention/);
    });

    it('paginates without overlap', async () => {
      const p1 = await request(app)
        .get('/api/search')
        .query({ q: 'learning', limit: 5, offset: 0 });
      const p2 = await request(app)
        .get('/api/search')
        .query({ q: 'learning', limit: 5, offset: 5 });
      const ids1 = new Set(p1.body.hits.map((h: { id: string }) => h.id));
      expect(p2.body.hits.some((h: { id: string }) => ids1.has(h.id))).toBe(false);
      expect(p2.body.hits[0].rank).toBe(6);
    });

    it('applies a category filter', async () => {
      const unfiltered = await request(app).get('/api/search').query({ q: 'learning' });
      const category = unfiltered.body.facets.primaryCategory[0].value as string;
      const filtered = await request(app)
        .get('/api/search')
        .query({ q: 'learning', filter: `primaryCategory:${category}` });
      expect(
        filtered.body.hits.every(
          (h: { meta: { primaryCategory: string } }) => h.meta.primaryCategory === category,
        ),
      ).toBe(true);
      expect(filtered.body.totalHits).toBeLessThanOrEqual(unfiltered.body.totalHits);
    });

    it('400s on a missing query', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('bad_request');
    });

    it('400s on an out-of-range limit', async () => {
      const res = await request(app).get('/api/search').query({ q: 'x', limit: 999 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('returns a full document', async () => {
      const id = docs[0]!._id;
      const res = await request(app).get(`/api/documents/${encodeURIComponent(id)}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.abstract).toBe(docs[0]!.abstract);
      expect(res.body).not.toHaveProperty('_id');
    });

    it('404s for an unknown id', async () => {
      const res = await request(app).get('/api/documents/9999.99999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('not_found');
    });
  });

  describe('GET /api/stats', () => {
    it('summarises the corpus', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(docs.length);
      expect(res.body.bySource.arxiv).toBe(docs.length);
      expect(Array.isArray(res.body.topCategories)).toBe(true);
      expect(res.body.index.vocabSize).toBeGreaterThan(0);
    });
  });

  it('404s unknown routes through the error envelope', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code');
  });
});

import { z } from 'zod';
import type { SearchInput } from './search-service.js';

const csv = (value: unknown): string[] =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

/**
 * `GET /api/search` query parameters. `filter` may be repeated
 * (`?filter=primaryCategory:cs.LG&filter=source:arxiv`).
 */
export const SearchQuerySchema = z
  .object({
    q: z.string().trim().min(1, 'q is required').max(400),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).max(1000).default(0),
    snippets: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    facets: z.string().optional().transform(csv),
    filter: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
  })
  .transform((raw): SearchInput => {
    const filters: Record<string, string[]> = {};
    for (const clause of raw.filter) {
      const idx = clause.indexOf(':');
      if (idx <= 0) continue;
      const key = clause.slice(0, idx);
      const value = clause.slice(idx + 1);
      if (value) (filters[key] ??= []).push(value);
    }
    return {
      query: raw.q,
      limit: raw.limit,
      offset: raw.offset,
      snippets: raw.snippets,
      facets: raw.facets,
      filters,
    };
  });

export const DocumentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\w./:-]+$/, 'invalid document id');

import type { ApiErrorBody, CorpusStats, DocumentView, SearchResponse } from './types.ts';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      signal: signal ?? null,
      headers: { accept: 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Could not reach the search API.');
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      e?.code ?? 'error',
      e?.message ?? `Request failed (${res.status})`,
    );
  }
  return body as T;
}

export interface SearchArgs {
  q: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string[]>;
  signal?: AbortSignal;
}

export function search({
  q,
  limit = 10,
  offset = 0,
  filters = {},
  signal,
}: SearchArgs): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) });
  for (const [key, values] of Object.entries(filters)) {
    for (const value of values) params.append('filter', `${key}:${value}`);
  }
  return get<SearchResponse>(`/api/search?${params.toString()}`, signal);
}

export function fetchDocument(id: string, signal?: AbortSignal): Promise<DocumentView> {
  return get<DocumentView>(`/api/documents/${encodeURIComponent(id)}`, signal);
}

export function fetchStats(signal?: AbortSignal): Promise<CorpusStats> {
  return get<CorpusStats>('/api/stats', signal);
}

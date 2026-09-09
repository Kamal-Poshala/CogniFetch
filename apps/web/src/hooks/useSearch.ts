import { useEffect, useRef, useState } from 'react';
import { ApiError, search } from '../api/client.ts';
import type { SearchResponse } from '../api/types.ts';
import { useDebouncedValue } from './useDebouncedValue.ts';

export interface SearchState {
  data: SearchResponse | null;
  /** Previous results kept visible while a new query is in flight. */
  isLoading: boolean;
  error: string | null;
}

export interface UseSearchArgs {
  query: string;
  page: number;
  pageSize: number;
  filters: Record<string, string[]>;
}

/**
 * Debounced, race-safe search. Keeps the last successful result on screen while
 * the next request runs, and cancels superseded requests.
 */
export function useSearch({ query, page, pageSize, filters }: UseSearchArgs): SearchState {
  const debouncedQuery = useDebouncedValue(query.trim(), 220);
  const filterKey = JSON.stringify(filters);
  const [state, setState] = useState<SearchState>({ data: null, isLoading: false, error: null });
  const requestId = useRef(0);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    setState((s) => ({ ...s, isLoading: true, error: null }));

    search({
      q: debouncedQuery,
      limit: pageSize,
      offset: page * pageSize,
      filters,
      signal: controller.signal,
    })
      .then((data) => {
        if (id === requestId.current) setState({ data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        const message = err instanceof ApiError ? err.message : 'Something went wrong.';
        setState((s) => ({ ...s, isLoading: false, error: message }));
      });

    return () => controller.abort();
  }, [debouncedQuery, page, pageSize, filterKey, filters]);

  return state;
}

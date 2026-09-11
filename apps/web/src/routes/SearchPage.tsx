import { useCallback, useMemo, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar.tsx';
import { ResultCard } from '../components/ResultCard.tsx';
import { FacetPanel } from '../components/FacetPanel.tsx';
import { Pagination } from '../components/Pagination.tsx';
import { ResultSkeleton, EmptyState, ErrorState, Welcome } from '../components/states.tsx';
import { useSearch } from '../hooks/useSearch.ts';
import { formatCount, formatMs } from '../lib/format.ts';

const PAGE_SIZE = 10;
const FILTERABLE = [
  { key: 'primaryCategory', title: 'Category' },
  { key: 'source', title: 'Source' },
];

function parseFilters(params: URLSearchParams): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const clause of params.getAll('filter')) {
    const idx = clause.indexOf(':');
    if (idx <= 0) continue;
    (filters[clause.slice(0, idx)] ??= []).push(clause.slice(idx + 1));
  }
  return filters;
}

export function SearchPage(): ReactElement {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const page = Math.max(0, Number(params.get('page') ?? '0') || 0);
  const filters = useMemo(() => parseFilters(params), [params]);

  const { data, isLoading, error } = useSearch({ query, page, pageSize: PAGE_SIZE, filters });

  const setQuery = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set('q', next);
          else p.delete('q');
          p.delete('page');
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPage = useCallback(
    (next: number) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev);
        if (next > 0) p.set('page', String(next));
        else p.delete('page');
        return p;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams],
  );

  const toggleFilter = useCallback(
    (key: string, value: string) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev);
        const clause = `${key}:${value}`;
        const existing = p.getAll('filter');
        p.delete('filter');
        const next = existing.includes(clause)
          ? existing.filter((c) => c !== clause)
          : [...existing, clause];
        for (const c of next) p.append('filter', c);
        p.delete('page');
        return p;
      });
    },
    [setParams],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SearchBar value={query} onChange={setQuery} busy={isLoading} />

      {data && (
        <p className="mt-3 font-mono text-xs text-mist-400">
          {formatCount(data.totalHits)} result{data.totalHits === 1 ? '' : 's'} in{' '}
          {formatMs(data.tookMs)}
          {data.terms.length > 0 && (
            <span className="text-mist-500"> · terms: {data.terms.join(' ')}</span>
          )}
        </p>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          {FILTERABLE.map((f) => (
            <FacetPanel
              key={f.key}
              title={f.title}
              facetKey={f.key}
              buckets={data.facets[f.key]}
              selected={filters[f.key] ?? []}
              onToggle={toggleFilter}
            />
          ))}
        </div>
      )}

      <div className="mt-5">
        {!hasQuery && <Welcome />}
        {hasQuery && error && <ErrorState message={error} />}
        {hasQuery && !error && !data && isLoading && <ResultSkeleton />}
        {hasQuery && !error && data && data.hits.length === 0 && <EmptyState query={query} />}
        {data && data.hits.length > 0 && (
          <div className="space-y-3">
            {data.hits.map((hit) => (
              <ResultCard key={hit.id} hit={hit} />
            ))}
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalHits={data.totalHits}
              onPage={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

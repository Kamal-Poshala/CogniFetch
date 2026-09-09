import { type ReactElement } from 'react';

interface Props {
  page: number;
  pageSize: number;
  totalHits: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageSize, totalHits, onPage }: Props): ReactElement | null {
  const pageCount = Math.ceil(Math.min(totalHits, 1000) / pageSize);
  if (pageCount <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min(totalHits, (page + 1) * pageSize);

  return (
    <nav
      className="flex items-center justify-between pt-2 text-sm text-mist-400"
      aria-label="Pagination"
    >
      <span className="font-mono">
        {from.toLocaleString()}–{to.toLocaleString()}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="chip disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          ← Prev
        </button>
        <span className="px-2 py-1 font-mono text-xs">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="chip disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page + 1 >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

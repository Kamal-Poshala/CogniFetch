import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { SearchHit } from '../api/types.ts';
import { Highlight } from './Highlight.tsx';
import { formatDate, metaList, metaString } from '../lib/format.ts';

export function ResultCard({ hit }: { hit: SearchHit }): ReactElement {
  const category = metaString(hit.meta.primaryCategory);
  const source = metaString(hit.meta.source);
  const authors = metaList(hit.meta.authors);
  const published = metaString(hit.meta.published);
  const url = metaString(hit.meta.url);

  return (
    <article className="card p-4 transition hover:border-ink-600 sm:p-5">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-mist-400">#{hit.rank}</span>
        {category && <span className="chip">{category}</span>}
        {source === 'ocr' && (
          <span
            className="chip border-amber-500/40 text-amber-300"
            title="Ingested via the OCR pipeline"
          >
            OCR
          </span>
        )}
        <span className="font-mono text-mist-400" title="Relevance score (cosine similarity)">
          {hit.score.toFixed(3)}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-mist-100">
        <Link to={`/doc/${encodeURIComponent(hit.id)}`} className="hover:text-accent-300">
          {hit.title}
        </Link>
      </h3>

      {authors.length > 0 && (
        <p className="mt-1 truncate text-sm text-mist-400">
          {authors.slice(0, 4).join(', ')}
          {authors.length > 4 ? ' et al.' : ''}
          {published ? ` · ${formatDate(published)}` : ''}
        </p>
      )}

      {hit.snippet && (
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          <Highlight html={hit.snippet} />
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-mist-400">
        <Link to={`/doc/${encodeURIComponent(hit.id)}`} className="hover:text-accent-300">
          Details
        </Link>
        {url && (
          <a href={url} target="_blank" rel="noreferrer noopener" className="hover:text-accent-300">
            arXiv ↗
          </a>
        )}
        <span className="font-mono">{hit.id}</span>
      </div>
    </article>
  );
}

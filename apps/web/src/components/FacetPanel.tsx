import { type ReactElement } from 'react';
import type { FacetBucket } from '../api/types.ts';

interface Props {
  title: string;
  facetKey: string;
  buckets: FacetBucket[] | undefined;
  selected: string[];
  onToggle: (key: string, value: string) => void;
}

export function FacetPanel({
  title,
  facetKey,
  buckets,
  selected,
  onToggle,
}: Props): ReactElement | null {
  if (!buckets || buckets.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">{title}</h2>
      <ul className="flex flex-wrap gap-1.5">
        {buckets.slice(0, 12).map((b) => {
          const active = selected.includes(b.value);
          return (
            <li key={b.value}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(facetKey, b.value)}
                className={`chip ${active ? 'chip-active' : ''}`}
              >
                {b.value}
                <span className="font-mono text-[0.65rem] text-mist-400">{b.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

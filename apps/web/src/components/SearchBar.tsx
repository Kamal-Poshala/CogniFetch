import { type ChangeEvent, type ReactElement } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  busy?: boolean;
}

export function SearchBar({ value, onChange, busy = false }: Props): ReactElement {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mist-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        role="searchbox"
        aria-label="Search the corpus"
        autoFocus
        spellCheck={false}
        placeholder="Search 12,000 arXiv abstracts…"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-700 bg-ink-900/80 py-3.5 pl-12 pr-12 text-lg text-mist-100 shadow-lg shadow-black/20 outline-none transition placeholder:text-mist-400/70 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
      />
      {busy && (
        <span
          className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ink-600 border-t-accent-400"
          aria-label="Loading"
        />
      )}
    </div>
  );
}

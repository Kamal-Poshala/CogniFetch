import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useStats } from '../hooks/useStats.ts';
import { formatCount } from '../lib/format.ts';

export function Header(): ReactElement {
  const stats = useStats();
  return (
    <header className="border-b border-ink-800/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-mist-100">CogniFetch</span>
          <span className="hidden text-xs text-mist-400 sm:inline">academic search</span>
        </Link>
        {stats && (
          <p className="font-mono text-xs text-mist-400">
            {formatCount(stats.total)} docs · {formatCount(stats.index.vocabSize)} terms
          </p>
        )}
      </div>
    </header>
  );
}

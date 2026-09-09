import { type ReactElement } from 'react';

export function ResultSkeleton(): ReactElement {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card animate-pulse p-5">
          <div className="mb-3 h-3 w-24 rounded bg-ink-700" />
          <div className="mb-2 h-4 w-3/4 rounded bg-ink-700" />
          <div className="h-3 w-full rounded bg-ink-800" />
          <div className="mt-1.5 h-3 w-5/6 rounded bg-ink-800" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ query }: { query: string }): ReactElement {
  return (
    <div className="card px-6 py-16 text-center">
      <p className="text-mist-300">
        No documents match <span className="font-semibold text-mist-100">“{query}”</span>.
      </p>
      <p className="mt-1 text-sm text-mist-400">Try broader or differently spelled terms.</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }): ReactElement {
  return (
    <div className="card border-red-500/40 bg-red-500/5 px-6 py-10 text-center">
      <p className="font-medium text-red-300">{message}</p>
      <p className="mt-1 text-sm text-mist-400">
        Make sure the API is running and the corpus has been indexed.
      </p>
    </div>
  );
}

export function Welcome(): ReactElement {
  return (
    <div className="card px-6 py-16 text-center">
      <p className="text-mist-300">Search a corpus of arXiv abstracts.</p>
      <p className="mt-1 text-sm text-mist-400">
        Ranked by TF-IDF cosine similarity over a hand-rolled inverted index.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {[
          'diffusion models',
          'byzantine consensus',
          'graph neural network',
          'differential privacy',
        ].map((example) => (
          <a key={example} href={`/?q=${encodeURIComponent(example)}`} className="chip">
            {example}
          </a>
        ))}
      </div>
    </div>
  );
}

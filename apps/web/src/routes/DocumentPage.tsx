import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, fetchDocument } from '../api/client.ts';
import type { DocumentView } from '../api/types.ts';
import { ErrorState } from '../components/states.tsx';
import { formatDate } from '../lib/format.ts';

export function DocumentPage(): ReactElement {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setDoc(null);
    setError(null);
    fetchDocument(id, controller.signal)
      .then(setDoc)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load the document.');
      });
    return () => controller.abort();
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={() => void navigate(-1)}
        className="text-sm text-mist-400 hover:text-accent-300"
      >
        ← Back to results
      </button>

      <div className="mt-4">
        {error && <ErrorState message={error} />}
        {!error && !doc && <div className="card h-48 animate-pulse" />}
        {doc && (
          <article className="card p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              {doc.primaryCategory && <span className="chip">{doc.primaryCategory}</span>}
              {doc.source === 'ocr' && (
                <span className="chip border-amber-500/40 text-amber-300">OCR ingested</span>
              )}
              {doc.published && <span className="text-mist-400">{formatDate(doc.published)}</span>}
            </div>

            <h1 className="text-2xl font-bold leading-tight text-mist-100">{doc.title}</h1>

            {doc.authors.length > 0 && (
              <p className="mt-2 text-sm text-mist-300">{doc.authors.join(', ')}</p>
            )}

            <p className="mt-4 whitespace-pre-line leading-relaxed text-mist-200">{doc.abstract}</p>

            {doc.ocr && (
              <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/80">
                Reconstructed from a scanned PDF via {doc.ocr.engine} — measured character error
                rate {(doc.ocr.cer * 100).toFixed(1)}%, word error rate{' '}
                {(doc.ocr.wer * 100).toFixed(1)}%.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              {doc.arxivUrl && (
                <a
                  href={doc.arxivUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent-300 hover:underline"
                >
                  View on arXiv ↗
                </a>
              )}
              {doc.pdfUrl && (
                <a
                  href={doc.pdfUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent-300 hover:underline"
                >
                  PDF ↗
                </a>
              )}
              <span className="font-mono text-mist-400">{doc.id}</span>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

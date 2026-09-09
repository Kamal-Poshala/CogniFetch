import type { SearchHit, FacetBucket } from '@cognifetch/engine';

export type { SearchHit, FacetBucket };

export interface SearchResponse {
  query: string;
  terms: string[];
  totalHits: number;
  hits: SearchHit[];
  facets: Record<string, FacetBucket[]>;
  tookMs: number;
  limit: number;
  offset: number;
}

export interface DocumentView {
  id: string;
  source: 'arxiv' | 'ocr';
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  primaryCategory: string;
  published: string;
  updated: string;
  arxivUrl: string;
  pdfUrl: string;
  ocr?: { engine: string; cer: number; wer: number; sourcePaper: string; scannedAt: string };
  ingestedAt: string;
}

export interface CorpusStats {
  total: number;
  bySource: Record<string, number>;
  topCategories: Array<{ category: string; count: number }>;
  newest: string | null;
  index: { source: string; docCount: number; vocabSize: number; loadedAt: string };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

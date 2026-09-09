import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { App } from '../App.tsx';
import type { SearchResponse } from '../api/types.ts';

const STATS = {
  total: 12000,
  bySource: { arxiv: 12000 },
  topCategories: [{ category: 'cs.LG', count: 3000 }],
  newest: '2026-06-01',
  index: {
    source: 'persisted',
    docCount: 12000,
    vocabSize: 31651,
    loadedAt: '2026-06-01T00:00:00Z',
  },
};

function searchResponse(overrides: Partial<SearchResponse> = {}): SearchResponse {
  return {
    query: 'graph neural network',
    terms: ['graph', 'neural', 'network'],
    totalHits: 2,
    tookMs: 0.42,
    limit: 10,
    offset: 0,
    facets: {
      primaryCategory: [
        { value: 'cs.LG', count: 2 },
        { value: 'cs.AI', count: 1 },
      ],
      source: [{ value: 'arxiv', count: 2 }],
    },
    hits: [
      {
        id: '2601.00001',
        rank: 1,
        score: 0.42,
        title: 'Message Passing on Graphs',
        matchedTerms: ['graph', 'neural'],
        snippet:
          'We study <mark>graph</mark> <mark>neural</mark> networks for node classification.',
        meta: {
          primaryCategory: 'cs.LG',
          source: 'arxiv',
          authors: ['A. Researcher'],
          url: 'https://arxiv.org/abs/2601.00001',
          published: '2026-01-02',
        },
      },
      {
        id: '2601.00002',
        rank: 2,
        score: 0.31,
        title: 'Spectral Methods for Networks',
        matchedTerms: ['network'],
        snippet: 'A spectral view of <mark>network</mark> representation learning.',
        meta: { primaryCategory: 'cs.AI', source: 'arxiv', authors: [], url: '', published: '' },
      },
    ],
    ...overrides,
  };
}

function mockFetch(handler: (url: string) => unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(handler(url)),
      } as Response);
    }),
  );
}

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockFetch((url) => {
    if (url.includes('/api/stats')) return STATS;
    if (url.includes('/api/search')) return searchResponse();
    return {};
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SearchPage', () => {
  it('shows the welcome state before a query', async () => {
    renderApp();
    expect(await screen.findByText(/Search a corpus of arXiv abstracts/i)).toBeInTheDocument();
    expect(screen.getByText(/12,000 docs/)).toBeInTheDocument();
  });

  it('runs a search and renders ranked, highlighted results', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByRole('searchbox'), 'graph neural network');

    expect(await screen.findByText('Message Passing on Graphs')).toBeInTheDocument();
    expect(screen.getByText(/2 results in/)).toBeInTheDocument();

    const first = screen.getByText('Message Passing on Graphs').closest('article')!;
    expect(
      within(first)
        .getAllByText('graph')
        .some((el) => el.tagName === 'MARK'),
    ).toBe(true);
  });

  it('reflects the query in the URL and supports deep links', async () => {
    mockFetch((url) => (url.includes('/api/stats') ? STATS : searchResponse()));
    renderApp('/?q=graph%20neural%20network');
    expect(await screen.findByText('Message Passing on Graphs')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('graph neural network');
  });

  it('toggles a category facet filter', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    mockFetch((url) => {
      if (url.includes('/api/stats')) return STATS;
      calls.push(url);
      return searchResponse();
    });
    renderApp('/?q=graph');
    await screen.findByText('Message Passing on Graphs');

    await user.click(screen.getByRole('button', { name: /cs\.LG/ }));
    await waitFor(() => {
      expect(calls.some((u) => u.includes('filter=primaryCategory%3Acs.LG'))).toBe(true);
    });
  });

  it('shows an error state when the API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL) => {
        const url = input.toString();
        if (url.includes('/api/stats')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(STATS),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: { code: 'degraded', message: 'Index is empty' } }),
        } as Response);
      }),
    );
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByRole('searchbox'), 'anything');
    expect(await screen.findByText('Index is empty')).toBeInTheDocument();
  });
});

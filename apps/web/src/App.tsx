import { type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header.tsx';
import { SearchPage } from './routes/SearchPage.tsx';
import { DocumentPage } from './routes/DocumentPage.tsx';

export function App(): ReactElement {
  return (
    <div className="min-h-dvh">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/doc/:id" element={<DocumentPage />} />
          <Route path="*" element={<SearchPage />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-mist-500">
        arXiv metadata under the{' '}
        <a
          href="https://info.arxiv.org/help/api/tou.html"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-mist-300"
        >
          arXiv API Terms of Use
        </a>
        . Not affiliated with arXiv or Cornell University.
      </footer>
    </div>
  );
}

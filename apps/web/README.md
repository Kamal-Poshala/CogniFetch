# @cognifetch/web

React + Vite + Tailwind v4 search UI.

```bash
npm run dev --workspace @cognifetch/web       # :5173, proxies /api → :3500
npm run build --workspace @cognifetch/web     # tsc -b && vite build → dist/
```

- The URL query string (`q`, `page`, `filter`) is the single source of truth —
  every search is a shareable link and the back button works.
- Debounced search-as-you-type with race-safe aborts; previous results stay on
  screen while the next query runs.
- Engine snippets arrive HTML-escaped with `<mark>` tags; `Highlight.tsx` parses
  those tags — no `dangerouslySetInnerHTML`.
- `VITE_API_BASE_URL` sets the API origin for production builds (unset → same
  origin, which is what the nginx/compose setup uses).

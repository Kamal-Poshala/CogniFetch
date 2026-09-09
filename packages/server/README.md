# @cognifetch/server

Express 5 REST API. Loads the inverted index on boot, then serves queries from
memory.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | `{ status, uptimeSec, index }`; 503 until the index has docs |
| `GET` | `/api/search` | `q` (required), `limit` (1–50), `offset` (0–1000), `snippets`, `facets`, repeatable `filter=key:value`. Sends a `Server-Timing` header. |
| `GET` | `/api/documents/:id` | full `StoredDocument` (`_id` → `id`) |
| `GET` | `/api/stats` | corpus counts by source / category + index snapshot |

Errors are `{ error: { code, message, details? } }`.

## Design

`createApp(service)` takes a `SearchService` and is side-effect-free, so
`app.test.ts` exercises every route against the seed corpus with no database.
`SearchService` wraps a `RetrievalEngine` and a `DocumentStore` (Mongo in prod,
in-memory in tests). `server.ts` wires the Mongo-backed version and handles
boot + graceful shutdown.

```bash
npm run dev --workspace @cognifetch/server     # tsx watch on :3500
npm start  --workspace @cognifetch/server      # node dist/server.js
```

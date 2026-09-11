# Seed corpus

`corpus.jsonl` is a small (~600 document) sample of the arXiv metadata corpus,
one `StoredDocument` JSON object per line. It is committed so that
`docker compose up` and the test/benchmark suites work with **zero network
access** — no arXiv harvest required.

Regenerate it with:

```bash
npm run seed:harvest -- --count 600 --sets cs,stat --output data/seed/corpus.jsonl
```

The full corpus (10,000+ documents) is built separately with `npm run harvest`
against a running MongoDB; see the root `README.md`.

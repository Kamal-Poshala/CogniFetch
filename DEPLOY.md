# Deployment

The reference deployment is **MongoDB Atlas** + **Render** (API) + **Vercel**
(UI). All three have free tiers sufficient for a seeded demo corpus. You run
these steps — they need your accounts.

## 1. MongoDB Atlas

1. Create a free **M0** cluster. Add a database user and allow network access
   from anywhere (`0.0.0.0/0`) or from Render's egress ranges.
2. Copy the `mongodb+srv://…` connection string. This is a **new** credential —
   do not reuse anything from git history.
3. Seed it from your machine:
   ```bash
   MONGO_URL="mongodb+srv://USER:PASS@CLUSTER/?retryWrites=true&w=majority" \
   MONGO_DB=cognifetch \
   npm run harvest -- --limit 12000        # or: npm run seed:load && npm run index:build
   MONGO_URL="…" MONGO_DB=cognifetch npm run index:build
   ```

## 2. API on Render

1. New **Web Service** from the GitHub repo.
2. Runtime: **Docker**. Dockerfile path `./Dockerfile`, **Docker target
   `server`** (Render → *Advanced* → *Dockerfile Target Stage*).
3. Environment:
   | Key | Value |
   |---|---|
   | `MONGO_URL` | your Atlas SRV string |
   | `MONGO_DB` | `cognifetch` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://cognifetch.vercel.app` |
   | `PORT` | `3500` (Render sets `PORT`; the app already reads it) |
4. Health check path: `/health`.
5. Deploy. Confirm `https://<service>.onrender.com/health` returns
   `{"status":"ok",...}` with a non-zero `docCount`.

## 3. UI on Vercel

The nginx proxy is for `docker compose` only; on Vercel the browser calls the
API directly, so set the API base URL at build time.

1. Import the repo. **Root directory:** `apps/web`. Framework preset: **Vite**.
2. Build command `npm run build`, output directory `dist`.
   (Vercel installs from the repo root workspace automatically.)
3. Environment variable: `VITE_API_BASE_URL` = `https://<service>.onrender.com`.
4. Deploy, then add that Vercel URL to the API's `CORS_ORIGINS` and redeploy the
   API.

## 4. Point the résumé at it

Add the live URL to the repo's GitHub *About* section and to the résumé line.
Render free services cold-start after ~15 min idle — the first request takes a
few seconds, then the persisted GridFS index loads in well under a second.

## Alternative: single host with docker compose

On any VM with Docker:

```bash
git clone … && cd CogniFetch
docker compose up -d --build          # mongo + seed + api + web on :8080
```

Swap the `mongo` service for an Atlas `MONGO_URL` on the `api` and `seed`
services to use managed storage.

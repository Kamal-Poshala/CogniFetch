# syntax=docker/dockerfile:1
# Multi-target build for the CogniFetch monorepo.
#   --target server   -> the REST API
#   --target ingest   -> harvest / index-build / seed CLIs (one-shot jobs)
#   --target web       -> nginx serving the built React app
ARG NODE_VERSION=22

# ── shared build stage: install once, build every workspace ──────────────────
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app
ENV npm_config_fund=false npm_config_audit=false
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/ingest/package.json ./packages/ingest/
COPY packages/server/package.json ./packages/server/
COPY benchmarks/package.json ./benchmarks/
COPY apps/web/package.json ./apps/web/
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ── server runtime ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS server
WORKDIR /app
ENV NODE_ENV=production PORT=3500
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/engine/package.json ./packages/engine/package.json
COPY --from=build /app/packages/engine/dist ./packages/engine/dist
COPY --from=build /app/packages/ingest/package.json ./packages/ingest/package.json
COPY --from=build /app/packages/ingest/dist ./packages/ingest/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
EXPOSE 3500
USER node
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD curl -fsS http://localhost:3500/health || exit 1
CMD ["node", "packages/server/dist/server.js"]

# ── ingestion CLIs (one-shot jobs) ──────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS ingest
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/engine/package.json ./packages/engine/package.json
COPY --from=build /app/packages/engine/dist ./packages/engine/dist
COPY --from=build /app/packages/ingest/package.json ./packages/ingest/package.json
COPY --from=build /app/packages/ingest/dist ./packages/ingest/dist
COPY --from=build /app/data/seed ./data/seed
USER node
ENTRYPOINT ["node"]
CMD ["packages/ingest/dist/cli/harvest.js"]

# ── web (static, served + proxied by nginx) ─────────────────────────────────
FROM nginx:1.29-alpine AS web
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

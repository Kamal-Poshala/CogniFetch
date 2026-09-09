import { defineWorkspace } from 'vitest/config';

// Extended as workspaces are added: packages/ingest, packages/server, apps/web, benchmarks.
export default defineWorkspace(['packages/engine']);

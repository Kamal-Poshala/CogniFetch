import { defineWorkspace } from 'vitest/config';

// Extended as workspaces are added: apps/web, benchmarks.
export default defineWorkspace(['packages/engine', 'packages/ingest', 'packages/server']);

import { defineWorkspace } from 'vitest/config';

// Extended as workspaces are added: apps/web.
export default defineWorkspace([
  'packages/engine',
  'packages/ingest',
  'packages/server',
  'benchmarks',
]);

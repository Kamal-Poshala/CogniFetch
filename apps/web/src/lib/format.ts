export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${ms.toFixed(0)} ms`;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Meta values from the engine are `string | string[] | number | boolean | null`. */
type MetaValue = string | number | boolean | null | Array<string | number | boolean | null>;

function scalarString(value: string | number | boolean | null): string {
  return value == null ? '' : typeof value === 'string' ? value : String(value);
}

export function metaString(value: MetaValue | undefined): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(scalarString).filter(Boolean).join(', ');
  return scalarString(value);
}

export function metaList(value: MetaValue | undefined): string[] {
  if (Array.isArray(value)) return value.map(scalarString).filter(Boolean);
  const s = scalarString(value ?? null);
  return s ? [s] : [];
}

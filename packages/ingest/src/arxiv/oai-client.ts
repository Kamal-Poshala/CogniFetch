import { XMLParser } from 'fast-xml-parser';
import { normalizeAbstract, normalizeTitle } from '../text.js';

/** One record parsed from an OAI-PMH `arXiv` metadata payload. */
export interface OaiRecord {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  primaryCategory: string;
  created: string;
  updated: string;
  deleted: boolean;
}

export interface ListRecordsPage {
  records: OaiRecord[];
  resumptionToken: string | null;
  /** Total record count for the query, when arXiv reports it. */
  completeListSize: number | null;
}

export interface OaiClientOptions {
  endpoint: string;
  /** Politeness delay between requests (ms). arXiv ToS: >= 3000. */
  requestDelayMs: number;
  /** Max attempts per request before giving up. */
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['record', 'author'].includes(name),
  trimValues: true,
});

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && '#text' in value) return String(value['#text']);
  return '';
}

interface RawArxivMeta {
  id?: unknown;
  title?: unknown;
  abstract?: unknown;
  created?: unknown;
  updated?: unknown;
  categories?: unknown;
  authors?: { author?: unknown };
}

function parseRecord(record: Record<string, unknown>): OaiRecord | null {
  const header = record.header as Record<string, unknown> | undefined;
  if (!header) return null;
  const deleted = (header['@_status'] as string | undefined) === 'deleted';
  const identifier = textOf(header.identifier);
  const fallbackId = identifier.replace(/^oai:arXiv\.org:/, '');

  const metadata = record.metadata as Record<string, unknown> | undefined;
  const meta = (metadata?.arXiv ?? {}) as RawArxivMeta;

  const id = textOf(meta.id) || fallbackId;
  if (!id) return null;

  if (deleted) {
    return {
      id,
      title: '',
      abstract: '',
      authors: [],
      categories: [],
      primaryCategory: '',
      created: '',
      updated: '',
      deleted: true,
    };
  }

  const categories = textOf(meta.categories).split(/\s+/).filter(Boolean);
  const authorNodes = asArray(meta.authors?.author) as Array<Record<string, unknown>>;
  const authors = authorNodes
    .map((a) => [textOf(a.forenames), textOf(a.keyname)].filter(Boolean).join(' ').trim())
    .filter(Boolean);

  return {
    id,
    title: normalizeTitle(textOf(meta.title)),
    abstract: normalizeAbstract(textOf(meta.abstract)),
    authors,
    categories,
    primaryCategory: categories[0] ?? '',
    created: textOf(meta.created),
    updated: textOf(meta.updated) || textOf(meta.created),
    deleted: false,
  };
}

/**
 * Minimal OAI-PMH client for arXiv's `ListRecords` verb. Enforces the request
 * delay, honours HTTP 503 `Retry-After`, and follows `resumptionToken`
 * pagination one page at a time.
 */
export class ArxivOaiClient {
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private lastRequestAt = 0;

  constructor(private readonly options: OaiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxRetries = options.maxRetries ?? 5;
  }

  /** Fetch the first page for a set, optionally bounded by datestamp. */
  listRecords(
    set: string,
    range: { from?: string; until?: string } = {},
  ): Promise<ListRecordsPage> {
    const url = new URL(this.options.endpoint);
    url.searchParams.set('verb', 'ListRecords');
    url.searchParams.set('metadataPrefix', 'arXiv');
    url.searchParams.set('set', set);
    if (range.from) url.searchParams.set('from', range.from);
    if (range.until) url.searchParams.set('until', range.until);
    return this.request(url);
  }

  /** Fetch a continuation page. */
  resume(token: string): Promise<ListRecordsPage> {
    const url = new URL(this.options.endpoint);
    url.searchParams.set('verb', 'ListRecords');
    url.searchParams.set('resumptionToken', token);
    return this.request(url);
  }

  /** Parse a raw OAI-PMH XML string. Exposed for tests. */
  static parseXml(xml: string): ListRecordsPage {
    const doc = parser.parse(xml) as Record<string, unknown>;
    const envelope = doc['OAI-PMH'] as Record<string, unknown> | undefined;
    if (!envelope) throw new Error('Not an OAI-PMH response');
    if (envelope.error) {
      const err = envelope.error as Record<string, unknown>;
      const code = (err['@_code'] as string | undefined) ?? 'unknown';
      if (code === 'noRecordsMatch') {
        return { records: [], resumptionToken: null, completeListSize: 0 };
      }
      throw new Error(`OAI-PMH error [${code}]: ${textOf(err)}`);
    }

    const listRecords = envelope.ListRecords as Record<string, unknown> | undefined;
    if (!listRecords) return { records: [], resumptionToken: null, completeListSize: 0 };

    const records = asArray(listRecords.record as Record<string, unknown>[] | undefined)
      .map(parseRecord)
      .filter((r): r is OaiRecord => r !== null);

    const tokenNode = listRecords.resumptionToken;
    const token = textOf(tokenNode).trim();
    const completeListSizeAttr =
      tokenNode && typeof tokenNode === 'object' && '@_completeListSize' in tokenNode
        ? Number((tokenNode as Record<string, string>)['@_completeListSize'])
        : NaN;

    return {
      records,
      resumptionToken: token.length > 0 ? token : null,
      completeListSize: Number.isFinite(completeListSizeAttr) ? completeListSizeAttr : null,
    };
  }

  private async request(url: URL): Promise<ListRecordsPage> {
    let attempt = 0;
    for (;;) {
      attempt++;
      await this.throttle();

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: { 'User-Agent': 'CogniFetch/1.0 (academic search project)' },
        });
      } catch (err) {
        if (attempt >= this.maxRetries) throw err;
        await sleep(this.backoff(attempt));
        continue;
      }

      if (response.status === 503) {
        const retryAfter = Number(response.headers.get('retry-after')) || 20;
        await sleep(retryAfter * 1000);
        continue;
      }
      if (!response.ok) {
        if (attempt >= this.maxRetries) {
          throw new Error(`OAI-PMH request failed: ${response.status} ${response.statusText}`);
        }
        await sleep(this.backoff(attempt));
        continue;
      }

      return ArxivOaiClient.parseXml(await response.text());
    }
  }

  private async throttle(): Promise<void> {
    const wait = this.options.requestDelayMs - (Date.now() - this.lastRequestAt);
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();
  }

  private backoff(attempt: number): number {
    return Math.min(30_000, this.options.requestDelayMs * 2 ** attempt);
  }
}

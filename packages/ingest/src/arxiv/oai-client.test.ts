import { describe, expect, it } from 'vitest';
import { ArxivOaiClient } from './oai-client.js';

const PAGE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>2026-01-01T00:00:00Z</responseDate>
  <request verb="ListRecords" metadataPrefix="arXiv" set="cs">https://export.arxiv.org/oai2</request>
  <ListRecords>
    <record>
      <header>
        <identifier>oai:arXiv.org:2401.01234</identifier>
        <datestamp>2024-01-05</datestamp>
        <setSpec>cs</setSpec>
      </header>
      <metadata>
        <arXiv xmlns="http://arxiv.org/OAI/arXiv/">
          <id>2401.01234</id>
          <created>2024-01-02</created>
          <updated>2024-01-04</updated>
          <authors>
            <author><keyname>Lamport</keyname><forenames>Leslie</forenames></author>
            <author><keyname>Shostak</keyname><forenames>Robert</forenames></author>
          </authors>
          <title>The Byzantine Generals Problem
          Revisited</title>
          <categories>cs.DC cs.LG</categories>
          <abstract>  We revisit fault-tolerant consensus among distributed
          processes and present a protocol tolerating Byzantine faults.
          </abstract>
        </arXiv>
      </metadata>
    </record>
    <record>
      <header status="deleted">
        <identifier>oai:arXiv.org:2402.00001</identifier>
        <datestamp>2024-02-01</datestamp>
      </header>
    </record>
    <resumptionToken completeListSize="12345" cursor="0">next-page-token-abc</resumptionToken>
  </ListRecords>
</OAI-PMH>`;

const EMPTY_XML = `<?xml version="1.0"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>2026-01-01T00:00:00Z</responseDate>
  <request verb="ListRecords">https://export.arxiv.org/oai2</request>
  <error code="noRecordsMatch">No matching records</error>
</OAI-PMH>`;

describe('ArxivOaiClient.parseXml', () => {
  it('parses records, normalising title and abstract whitespace', () => {
    const page = ArxivOaiClient.parseXml(PAGE_XML);
    expect(page.records).toHaveLength(2);

    const rec = page.records[0]!;
    expect(rec.id).toBe('2401.01234');
    expect(rec.title).toBe('The Byzantine Generals Problem Revisited');
    expect(rec.abstract).toBe(
      'We revisit fault-tolerant consensus among distributed processes and present a protocol tolerating Byzantine faults.',
    );
    expect(rec.authors).toEqual(['Leslie Lamport', 'Robert Shostak']);
    expect(rec.categories).toEqual(['cs.DC', 'cs.LG']);
    expect(rec.primaryCategory).toBe('cs.DC');
    expect(rec.deleted).toBe(false);
  });

  it('flags deleted records', () => {
    const page = ArxivOaiClient.parseXml(PAGE_XML);
    expect(page.records[1]).toMatchObject({ id: '2402.00001', deleted: true });
  });

  it('extracts the resumption token and complete list size', () => {
    const page = ArxivOaiClient.parseXml(PAGE_XML);
    expect(page.resumptionToken).toBe('next-page-token-abc');
    expect(page.completeListSize).toBe(12345);
  });

  it('treats noRecordsMatch as an empty final page', () => {
    const page = ArxivOaiClient.parseXml(EMPTY_XML);
    expect(page.records).toEqual([]);
    expect(page.resumptionToken).toBeNull();
  });

  it('throws on a non-OAI payload', () => {
    expect(() => ArxivOaiClient.parseXml('<html>nope</html>')).toThrow(/OAI-PMH/);
  });
});

describe('ArxivOaiClient pagination', () => {
  it('follows resumption tokens and honours the request delay', async () => {
    const calls: string[] = [];
    const pages = [
      PAGE_XML,
      PAGE_XML.replace('next-page-token-abc', '').replace('2401.01234', '2401.09999'),
    ];
    const fetchImpl = ((url: URL | string) => {
      calls.push(String(url));
      const body = pages.shift() ?? EMPTY_XML;
      return Promise.resolve(new Response(body, { status: 200 }));
    }) as typeof fetch;

    const client = new ArxivOaiClient({
      endpoint: 'https://export.arxiv.org/oai2',
      requestDelayMs: 3000,
      fetchImpl,
    });

    const t0 = Date.now();
    const first = await client.listRecords('cs');
    expect(first.resumptionToken).toBe('next-page-token-abc');
    const second = await client.resume(first.resumptionToken!);
    expect(second.resumptionToken).toBeNull();
    // Second request must have waited out the politeness delay.
    expect(Date.now() - t0).toBeGreaterThanOrEqual(2900);
    expect(calls).toHaveLength(2);
  }, 10_000);
});

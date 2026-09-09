import { useMemo, type ReactElement } from 'react';

/**
 * Render an engine snippet that contains `<mark>…</mark>` tags. The snippet text
 * is already HTML-escaped by the engine, so we parse only the mark tags and
 * never use `dangerouslySetInnerHTML`.
 */
export function Highlight({ html }: { html: string | null }): ReactElement | null {
  const parts = useMemo(() => {
    if (!html) return null;
    const out: Array<{ text: string; mark: boolean }> = [];
    const re = /<mark>(.*?)<\/mark>/gs;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      if (m.index > last) out.push({ text: unescapeHtml(html.slice(last, m.index)), mark: false });
      out.push({ text: unescapeHtml(m[1] ?? ''), mark: true });
      last = m.index + m[0].length;
    }
    if (last < html.length) out.push({ text: unescapeHtml(html.slice(last)), mark: false });
    return out;
  }, [html]);

  if (!parts) return null;
  return (
    <>
      {parts.map((p, i) =>
        p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>,
      )}
    </>
  );
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

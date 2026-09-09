/**
 * Text normalisation shared by the arXiv harvester and the OCR pipeline.
 * Deliberately conservative: it tidies whitespace and line-wrap artefacts but
 * does not try to strip LaTeX (retrieval tolerates the odd `$\alpha$`).
 */

/** Join words split across a hard line break by a hyphen: "convo-\nlution". */
export function dehyphenate(text: string): string {
  return text.replace(/([A-Za-z])-\s*\n\s*([a-z])/g, '$1$2');
}

/** Collapse all runs of whitespace (incl. newlines) to a single space, trim. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Lightly de-TeX an abstract: drop backslash-commands (`\textit`, `\mathcal`,
 * `\cite{...}`) and math/format delimiters, keeping the surrounding words. Not a
 * TeX parser — just enough to stop `{\it foo}` becoming the tokens `it`, `foo`.
 */
export function stripLatex(text: string): string {
  return text
    .replace(/\\[a-zA-Z]+\s*(?:\{[^{}]*\})?/g, ' ') // \cite{x}, \textit{...}, \alpha
    .replace(/\\[^a-zA-Z]/g, ' ') // escaped punctuation: \_ \& \{
    .replace(/[${}~^\\]/g, ' ') // leftover math / format delimiters
    .replace(/\s+/g, ' ')
    .trim();
}

/** Full cleanup for an abstract / OCR body. */
export function normalizeAbstract(raw: string): string {
  return collapseWhitespace(stripLatex(dehyphenate(raw)));
}

/** Title cleanup: single line, no trailing period noise from OCR. */
export function normalizeTitle(raw: string): string {
  return collapseWhitespace(raw).replace(/\s*\.\s*$/, '');
}

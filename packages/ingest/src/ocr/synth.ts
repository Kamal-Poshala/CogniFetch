import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export interface SynthPaper {
  id: string;
  title: string;
  abstract: string;
}

export interface SynthOptions {
  /** Page width in pixels (height grows to fit the text). */
  width: number;
  /** Characters per line for the body-text wrap. */
  charsPerLine: number;
  /** Max absolute skew angle in degrees. */
  maxSkewDeg: number;
  /** Gaussian blur sigma. */
  blurSigma: number;
  /** Gaussian noise sigma. */
  noiseSigma: number;
  /** JPEG quality of the final "scan". */
  jpegQuality: number;
  /** Deterministic seed so a run is reproducible. */
  seed: number;
}

export const DEFAULT_SYNTH_OPTIONS: SynthOptions = {
  width: 1000,
  charsPerLine: 78,
  maxSkewDeg: 1.8,
  blurSigma: 0.6,
  noiseSigma: 14,
  jpegQuality: 52,
  seed: 1,
};

export interface SynthResult {
  id: string;
  pdfBytes: Uint8Array;
  pageImage: Buffer;
  /** The exact text rendered onto the page — ground truth for OCR scoring. */
  groundTruth: string;
}

/** Mulberry32 — tiny deterministic PRNG. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Greedy word wrap to a character budget per line. */
export function wrapText(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line.length === 0) line = word;
    else if (line.length + 1 + word.length <= charsPerLine) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface RenderedPage {
  svg: string;
  height: number;
  /** Text as laid out on the page — the OCR ground truth. */
  groundTruth: string;
}

function buildPage(paper: SynthPaper, opts: SynthOptions): RenderedPage {
  const margin = 56;
  const titleSize = 30;
  const bodySize = 21;
  const lineGap = bodySize * 1.5;
  const font = "Georgia, 'Times New Roman', serif";

  const titleLines = wrapText(paper.title, Math.floor(opts.charsPerLine * 0.62));
  const bodyLines = wrapText(paper.abstract, opts.charsPerLine);

  let y = margin + titleSize;
  const svgLines: string[] = [];
  for (const t of titleLines) {
    svgLines.push(
      `<text x="${margin}" y="${y}" font-family="${font}" font-size="${titleSize}" font-weight="bold" fill="#111">${escapeXml(t)}</text>`,
    );
    y += titleSize * 1.35;
  }
  y += lineGap * 1.8; // wide gap so OCR emits a paragraph break after the title
  for (const t of bodyLines) {
    svgLines.push(
      `<text x="${margin}" y="${y}" font-family="${font}" font-size="${bodySize}" fill="#111">${escapeXml(t)}</text>`,
    );
    y += lineGap;
  }

  const height = Math.ceil(y + margin);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${height}">
<rect width="100%" height="100%" fill="#fdfdfb"/>
${svgLines.join('\n')}
</svg>`;

  return { svg, height, groundTruth: [...titleLines, '', ...bodyLines].join('\n') };
}

/**
 * Render a paper to a degraded, scan-like single-page PDF plus the ground-truth
 * text that was rendered. Deterministic given `options.seed` and the paper id.
 */
export async function synthesizeScan(
  paper: SynthPaper,
  options: Partial<SynthOptions> = {},
): Promise<SynthResult> {
  const opts = { ...DEFAULT_SYNTH_OPTIONS, ...options };
  const rand = rng(opts.seed ^ hashId(paper.id));
  const jitter = (base: number, amount: number): number => base + (rand() * 2 - 1) * amount;

  const { svg, height, groundTruth } = buildPage(paper, opts);
  const width = opts.width;

  const clean = await sharp(Buffer.from(svg)).png().toBuffer();

  const noiseLayer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: 'gaussian', mean: 128, sigma: Math.max(1, jitter(opts.noiseSigma, 4)) },
    },
  })
    .png()
    .toBuffer();

  const pageImage = await sharp(clean)
    .flatten({ background: '#fdfdfb' })
    .composite([{ input: noiseLayer, blend: 'overlay' }])
    .rotate(jitter(0, opts.maxSkewDeg), { background: '#ffffff' })
    .grayscale()
    .blur(Math.max(0.3, jitter(opts.blurSigma, 0.2)))
    .modulate({ brightness: jitter(1, 0.04) })
    .jpeg({ quality: Math.round(jitter(opts.jpegQuality, 6)) })
    .toBuffer();

  const pdf = await PDFDocument.create();
  const jpg = await pdf.embedJpg(pageImage);
  const page = pdf.addPage([jpg.width, jpg.height]);
  page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });
  const pdfBytes = await pdf.save();

  return { id: paper.id, pdfBytes, pageImage, groundTruth };
}

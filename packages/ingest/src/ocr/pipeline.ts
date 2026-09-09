import { mkdir, writeFile, readFile, readdir, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { synthesizeScan, type SynthPaper, type SynthOptions } from './synth.js';
import { OcrEngine } from './recognize.js';
import { structureOcr } from './nlp.js';
import { scoreAccuracy, aggregateAccuracy, type AccuracyScore } from './eval.js';

export interface OcrPaths {
  root: string;
  pdfs: string;
  groundTruth: string;
  results: string;
  report: string;
}

export function ocrPaths(root = 'data/ocr'): OcrPaths {
  const base = resolve(process.cwd(), root);
  return {
    root: base,
    pdfs: join(base, 'pdfs'),
    groundTruth: join(base, 'ground-truth.jsonl'),
    results: join(base, 'ocr-results.jsonl'),
    report: join(base, 'accuracy-report.json'),
  };
}

interface GroundTruthRow {
  id: string;
  pdf: string;
  /** Page raster stored next to the PDF; the OCR stage reads this. */
  image: string;
  groundTruth: string;
}

/**
 * Generate degraded scan PDFs for a set of papers and record ground truth.
 * Each scan is written both as a PDF (the artifact) and a PNG page raster (the
 * OCR input) so the OCR stage needs no PDF rasteriser.
 */
export async function generateScans(
  papers: SynthPaper[],
  paths: OcrPaths,
  synthOptions: Partial<SynthOptions> = {},
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  await mkdir(paths.pdfs, { recursive: true });
  const rows: string[] = [];
  let done = 0;
  for (const paper of papers) {
    const result = await synthesizeScan(paper, synthOptions);
    const stem = paper.id.replace(/\//g, '_');
    await writeFile(join(paths.pdfs, `${stem}.pdf`), Buffer.from(result.pdfBytes));
    await writeFile(join(paths.pdfs, `${stem}.png`), result.pageImage);
    rows.push(
      JSON.stringify({
        id: paper.id,
        pdf: `${stem}.pdf`,
        image: `${stem}.png`,
        groundTruth: result.groundTruth,
      }),
    );
    done++;
    onProgress?.(done, papers.length);
  }
  await writeFile(paths.groundTruth, rows.join('\n') + '\n', 'utf8');
  return done;
}

export interface OcrResultRow {
  id: string;
  rawText: string;
  confidence: number;
  title: string;
  abstract: string;
  englishScore: number;
  usable: boolean;
  cer: number;
  wer: number;
  refChars: number;
  refWords: number;
}

/** OCR every generated PDF, structure the text, and score it. Resumable. */
export async function runOcr(
  paths: OcrPaths,
  opts: { onProgress?: (done: number, total: number) => void } = {},
): Promise<OcrResultRow[]> {
  const gt = await readGroundTruth(paths);
  const alreadyDone = new Set<string>();
  if (existsSync(paths.results)) {
    for (const line of (await readFile(paths.results, 'utf8')).split('\n')) {
      if (line.trim()) alreadyDone.add((JSON.parse(line) as OcrResultRow).id);
    }
  }

  const pending = gt.filter((row) => !alreadyDone.has(row.id));
  const engine = new OcrEngine('eng');
  const out: OcrResultRow[] = [];
  let done = alreadyDone.size;

  try {
    for (const row of pending) {
      const image = await readFile(join(paths.pdfs, row.image));
      const { text, confidence } = await engine.recognizeImage(image);
      const structured = structureOcr(text);
      const score = scoreAccuracy(
        row.groundTruth,
        [structured.title, structured.abstract].join('\n'),
      );
      const result: OcrResultRow = {
        id: row.id,
        rawText: text,
        confidence,
        title: structured.title,
        abstract: structured.abstract,
        englishScore: structured.englishScore,
        usable: structured.usable,
        cer: score.cer,
        wer: score.wer,
        refChars: score.refChars,
        refWords: score.refWords,
      };
      out.push(result);
      await appendLine(paths.results, JSON.stringify(result));
      done++;
      opts.onProgress?.(done, gt.length);
    }
  } finally {
    await engine.close();
  }
  return out;
}

export async function evaluateOcr(paths: OcrPaths): Promise<{
  perDoc: OcrResultRow[];
  accuracy: ReturnType<typeof aggregateAccuracy>;
  usableRate: number;
}> {
  const rows = (await readFile(paths.results, 'utf8'))
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as OcrResultRow);
  const scores: AccuracyScore[] = rows.map((r) => ({
    cer: r.cer,
    wer: r.wer,
    refChars: r.refChars,
    refWords: r.refWords,
  }));
  const accuracy = aggregateAccuracy(scores);
  const usableRate = rows.length ? rows.filter((r) => r.usable).length / rows.length : 0;
  const report = {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    accuracy,
    usableRate,
  };
  await writeFile(paths.report, JSON.stringify(report, null, 2), 'utf8');
  return { perDoc: rows, accuracy, usableRate };
}

async function readGroundTruth(paths: OcrPaths): Promise<GroundTruthRow[]> {
  if (!existsSync(paths.groundTruth)) {
    const files = existsSync(paths.pdfs) ? await readdir(paths.pdfs) : [];
    throw new Error(
      `No ground-truth file at ${paths.groundTruth} (${files.length} PDFs present). Run ocr:synth first.`,
    );
  }
  return (await readFile(paths.groundTruth, 'utf8'))
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as GroundTruthRow);
}

async function appendLine(path: string, line: string): Promise<void> {
  await appendFile(path, line + '\n', 'utf8');
}

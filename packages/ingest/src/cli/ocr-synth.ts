import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { ocrPaths, generateScans } from '../ocr/pipeline.js';
import type { SynthPaper } from '../ocr/synth.js';

/**
 * Render synthetic "scanned" PDFs from held-out papers.
 *
 * Usage: npm run ocr:synth -- [--input data/seed/heldout.jsonl] [--count 2500] [--out data/ocr]
 */
function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? (process.argv[i + 1] ?? fallback) : fallback;
}

async function main(): Promise<void> {
  const input = resolve(process.cwd(), arg('input', 'data/seed/heldout.jsonl'));
  const count = Number(arg('count', String(config.OCR_SYNTH_COUNT)));
  const paths = ocrPaths(arg('out', 'data/ocr'));

  if (!existsSync(input)) {
    console.error(
      `Held-out corpus not found: ${input}\n` +
        `Create it with:  npm run seed:harvest -- --count ${count} --sets cs ` +
        `--from 2026-05-01 --until 2026-06-15 --output data/seed/heldout.jsonl`,
    );
    process.exit(1);
  }

  const papers: SynthPaper[] = readFileSync(input, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, count)
    .map((l) => {
      const d = JSON.parse(l) as { _id: string; title: string; abstract: string };
      return { id: d._id, title: d.title, abstract: d.abstract };
    });

  console.log(`Rendering ${papers.length} synthetic scans -> ${paths.pdfs}`);
  const t0 = Date.now();
  await generateScans(papers, paths, { seed: 20260101 }, (done, total) => {
    if (done % 25 === 0 || done === total) {
      process.stdout.write(`\r  ${done}/${total}`);
    }
  });
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`Ground truth: ${paths.groundTruth}`);
}

main().catch((err: unknown) => {
  console.error('\nocr:synth failed:', err);
  process.exit(1);
});

import { ocrPaths, evaluateOcr } from '../ocr/pipeline.js';

/**
 * Aggregate OCR accuracy against ground truth and write accuracy-report.json.
 *
 * Usage: npm run ocr:eval -- [--out data/ocr]
 */
async function main(): Promise<void> {
  const outIdx = process.argv.indexOf('--out');
  const paths = ocrPaths(outIdx !== -1 ? process.argv[outIdx + 1] : 'data/ocr');

  const { accuracy, usableRate, perDoc } = await evaluateOcr(paths);

  console.log(`OCR accuracy over ${accuracy.count} scanned PDFs`);
  console.log(`  mean CER:    ${(accuracy.meanCer * 100).toFixed(2)}%`);
  console.log(`  mean WER:    ${(accuracy.meanWer * 100).toFixed(2)}%`);
  console.log(`  median CER:  ${(accuracy.medianCer * 100).toFixed(2)}%`);
  console.log(`  p90 CER:     ${(accuracy.p90Cer * 100).toFixed(2)}%`);
  console.log(`  usable rate: ${(usableRate * 100).toFixed(1)}%  (passed the NLP quality gate)`);

  const worst = [...perDoc].sort((a, b) => b.cer - a.cer).slice(0, 3);
  if (worst.length > 0) {
    console.log(`\n  worst 3:`);
    for (const w of worst) {
      console.log(`    ${w.id}  CER ${(w.cer * 100).toFixed(1)}%  "${w.title.slice(0, 60)}"`);
    }
  }
  console.log(`\n  report: ${paths.report}`);
}

main().catch((err: unknown) => {
  console.error('ocr:eval failed:', err);
  process.exit(1);
});

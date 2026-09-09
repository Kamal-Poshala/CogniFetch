import { ocrPaths, runOcr } from '../ocr/pipeline.js';

/**
 * OCR every synthetic scan, structure the text, score it against ground truth.
 * Resumable: results are appended, so re-running only processes new PDFs.
 *
 * Usage: npm run ocr:run -- [--out data/ocr]
 */
async function main(): Promise<void> {
  const outIdx = process.argv.indexOf('--out');
  const paths = ocrPaths(outIdx !== -1 ? process.argv[outIdx + 1] : 'data/ocr');

  console.log('Running OCR (first invocation downloads the Tesseract model)...');
  const t0 = Date.now();
  const results = await runOcr(paths, {
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} pages`),
  });

  const mins = ((Date.now() - t0) / 60_000).toFixed(1);
  const processed = results.length;
  const meanCer = processed ? results.reduce((s, r) => s + r.cer, 0) / processed : 0;
  console.log(`\n\nProcessed ${processed} new page(s) in ${mins} min.`);
  console.log(`  mean CER (new pages): ${(meanCer * 100).toFixed(2)}%`);
  console.log(`  results: ${paths.results}`);
  console.log(`\nNext: npm run ocr:eval`);
}

main().catch((err: unknown) => {
  console.error('\nocr:run failed:', err);
  process.exit(1);
});

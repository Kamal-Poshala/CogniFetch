import { join } from 'node:path';
import { createWorker, type Worker } from 'tesseract.js';

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'tesseract');

export interface OcrPageResult {
  text: string;
  /** Mean Tesseract confidence for the page, 0–100. */
  confidence: number;
}

/**
 * A pooled Tesseract worker. Create once, reuse across many pages, terminate
 * when done — worker startup (WASM + traineddata load) dominates otherwise.
 *
 * Input is a page raster (PNG/JPEG buffer). Synthetic scans are generated and
 * stored as rasters alongside their PDF; ingesting a third-party PDF means
 * rasterising it first (e.g. `pdftoppm`), which the reproducible pipeline does
 * not need.
 */
export class OcrEngine {
  private worker: Worker | undefined;

  constructor(private readonly lang = 'eng') {}

  private async ready(): Promise<Worker> {
    this.worker ??= await createWorker(this.lang, undefined, { cachePath: CACHE_DIR });
    return this.worker;
  }

  async recognizeImage(image: Buffer): Promise<OcrPageResult> {
    const worker = await this.ready();
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence };
  }

  async close(): Promise<void> {
    await this.worker?.terminate();
    this.worker = undefined;
  }
}

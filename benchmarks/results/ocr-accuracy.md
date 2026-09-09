## OCR pipeline accuracy

_2026-09-09T07:01:58.076Z · tesseract.js over synthetically degraded page rasters_

60 held-out arXiv papers rendered to skewed / blurred / noisy /
JPEG-recompressed page scans, OCR'd, structured, and scored against the exact
text that was rendered.

| Metric | Value |
|---|---:|
| Median character error rate | 0.20% |
| Mean character error rate | 12.07% |
| Mean word error rate | 12.90% |
| p90 character error rate | 33.47% |
| Passed the NLP quality gate | 100.0% |

Most pages OCR near-perfectly; the error mass is a long tail of
notation-dense pages (QUBO formulations, interval-graph proofs) where OCR of
academic text is genuinely hard. Retrieval tolerates the noise — every
document still passed the language/structure gate and was indexed.

## OCR pipeline accuracy

_2026-09-12T03:13:31.047Z · tesseract.js over synthetically degraded page rasters_

2500 held-out arXiv papers rendered to skewed / blurred / noisy /
JPEG-recompressed page scans, OCR'd, structured, and scored against the exact
text that was rendered.

| Metric | Value |
|---|---:|
| Median character error rate | 0.00% |
| Mean character error rate | 1.09% |
| Mean word error rate | 1.62% |
| p90 character error rate | 0.30% |
| Passed the NLP quality gate | 99.9% |

Most pages OCR near-perfectly; the error mass is a long tail of
notation- and diagram-dense pages where OCR of academic text is genuinely
hard. Retrieval tolerates the noise — the overwhelming majority of documents
still passed the language/structure gate and were indexed.

Worst-performing pages in this run:

| arXiv id | CER | Title |
|---|---:|---|
| `2206.12076` | 59.4% | Synthesizing Rolling Bearing Fault Samples in New Conditions: A framew |
| `2109.06808` | 58.5% | What are the attackers doing now? Automating cyber threat intelligence |
| `2401.01341` | 56.2% | ATLASv2: ATLAS Attack Engagements, Version 2 ATLASv2 is based on a pre |

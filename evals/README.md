# evals/

All evaluation artifacts live here. This is what the teaching staff will read to grade the Milestone 3 classifier evaluation.

## Suggested structure

```
evals/
├── README.md                 — this file
├── datasets/
│   ├── allow/                — benign examples that should pass through
│   │   ├── source_notes.md   — where each batch came from, how collected/generated
│   │   └── *.{csv,jsonl,png,…}
│   └── unallow/              — abusive examples that must be caught
│       ├── source_notes.md
│       └── *.{csv,jsonl,png,…}
├── scripts/
│   ├── run_ml.py             — runs your traditional ML classifier against both sets
│   ├── run_llm.py            — runs your LLM-based classifier against both sets
│   ├── run_hybrid.py         — runs your hybrid approach
│   └── compute_metrics.py    — precision / recall / F1 / confusion matrix
└── results/
    ├── ml_results.json
    ├── llm_results.json
    ├── hybrid_results.json
    ├── summary_table.md      — human-readable comparison (used in the poster)
    └── confusion_matrices/
        └── *.png
```

## Required for Milestone 3

- At least **100 labeled examples** per set (allow and unallow). More is better.
- Each dataset directory must include a `source_notes.md` documenting where examples came from — public dataset citations, collection method, or how synthetic examples were generated.
- For illegal / extremely harmful content, use documented stand-ins (e.g., photos of nude kittens instead of CSAM). Note the substitution in `source_notes.md`.
- At least three detection approaches run against both sets: traditional ML classifier, LLM-as-classifier, and a hybrid.
- For each approach, report **precision, recall, F1, confusion matrix, per-1k-request cost, and latency (median + p99)**.
- The `summary_table.md` in `results/` should be drop-in-ready for the poster.

## Ethics reminder

- Don't commit real user data without consent.
- Don't commit PII (names, emails, phone numbers) — even in unallow sets, scrub or synthesize identifiers.
- If you scrape, check the platform's ToS and `robots.txt`; document your decision in `source_notes.md`.
- Flag any dataset licensing questions to a TA before committing.

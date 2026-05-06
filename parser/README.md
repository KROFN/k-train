# FIPI Parser MVP

> Phase 19: Local admin-side parser for the official FIPI open task bank

## Overview

This parser extracts questions from the FIPI open task bank (https://ege.fipi.ru/bank/) and outputs JSON files compatible with the Phase 18 import contract.

**This is a standalone tool** — it does not depend on the Next.js frontend and does not write to Supabase directly.

## Administrator Flow

```
1. Admin opens PC
2. Admin runs parser: cd parser && bun run parse -- --subject russian --exam ege
3. Parser collects questions from FIPI bank using Playwright
4. Parser saves output/parsed-questions.json
5. Admin runs validation: bun run ../scripts/validate-import.ts output/parsed-questions.json
6. Admin runs import: SUPABASE_SERVICE_ROLE_KEY=xxx bun run ../scripts/import-questions.ts output/parsed-questions.json
7. Supabase receives draft/published questions
8. Frontend displays published questions
```

## Prerequisites

1. **Bun** runtime (≥1.0)
2. **Chromium browser** for Playwright:
   ```bash
   cd parser
   bun install
   bun run install-browser
   ```

## Usage

### Parse all EGE Russian questions

```bash
cd parser
bun run parse -- --subject russian --exam ege
```

### Parse specific exam numbers only

```bash
bun run parse -- --subject russian --exam ege --numbers 4,5,6,7
```

### Dry run (no output file, just report)

```bash
bun run parse:dry -- --subject russian --exam ege
```

### Parse OGE Physics

```bash
bun run parse -- --subject physics --exam oge
```

### Custom output path

```bash
bun run parse -- --subject russian --exam ege --output my-questions.json
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--subject` | Subject to parse: `russian`, `physics`, `math` | `russian` |
| `--exam` | Exam type: `ege`, `oge` | `ege` |
| `--numbers` | Comma-separated exam task numbers (e.g., `4,5,6`) | All |
| `--output` | Output file path | `output/parsed-questions.json` |
| `--dry-run` | Report only, no file output | `false` |
| `--headless` | Run browser in headless mode | `true` |
| `--debug` | Save HTML snapshots for debugging | `false` |
| `--delay` | Delay between page loads in ms | `2000` |
| `--max-retries` | Max retries on page load failure | `3` |

## Output Format

The output matches the Phase 18 import contract:

```json
{
  "meta": {
    "source": "fipi",
    "courseId": "ege_russian",
    "description": "FIPI EGE Russian questions parsed on 2026-01-15",
    "generatedAt": "2026-01-15T10:30:00Z",
    "parserVersion": "1.0.0"
  },
  "questions": [...]
}
```

Each question has the ParsedQuestion format with `source: "fipi"`, `sourceUrl`, `answerStatus`, and `confidenceScore`.

## Architecture

```
parser/
├── package.json           # Independent bun project
├── README.md              # This file
├── config/
│   └── sources.ts         # FIPI URL mappings and subject config
├── src/
│   ├── index.ts           # Main entry point with CLI parsing
│   ├── navigator.ts       # Playwright FIPI navigation
│   ├── extractor.ts       # Question content extraction
│   ├── normalizer.ts      # Text normalization
│   ├── confidence.ts      # Confidence score computation
│   ├── safety.ts          # Rate limiting, delays, retries
│   └── output.ts          # JSON output writer
├── output/                # Generated JSON files (gitignored)
└── snapshots/             # Debug HTML snapshots (gitignored)
```

## Safety

- **Rate limiting**: 2-second delay between page loads (configurable)
- **Retries**: Up to 3 retries on page load failure
- **No spam**: The parser respects FIPI's servers with generous delays
- **Graceful failure**: If a page fails, it's logged and skipped
- **Resume**: The parser tracks visited pages and can resume if interrupted
- **No direct Supabase writes**: Parser only outputs JSON files

## Important Notes

- **FIPI HTML is not stable**: The parser may break if FIPI changes their HTML structure. Keep snapshots for debugging.
- **Answers may be incomplete**: FIPI often shows answers in collapsed/hidden sections. Some answers may be missing or need manual review.
- **Service role key is NOT needed**: The parser never touches Supabase. Use the import script separately.
- **Run locally**: The parser must run on a machine with browser access to FIPI.

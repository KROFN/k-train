# Import Contract — Admin Pipeline

> Phase 18: Admin import pipeline
> This document defines the format and rules for importing questions into Supabase.

## Overview

The import pipeline processes questions from external sources (FIPI, demo PDFs, manual entry) and safely uploads them to Supabase. The pipeline has three stages:

1. **Parse** — Extract questions from source into parsed-question JSON format
2. **Validate** — Run `scripts/validate-import.ts` to check all questions
3. **Import** — Run `scripts/import-questions.ts` to upload to Supabase

## Parsed Question Format

Each parsed question follows this schema (defined in `src/lib/import/parsed-question-schema.ts`):

```ts
{
  // --- Source identification ---
  externalId?: string;          // ID from the source system (e.g., FIPI question ID)
  source: "manual" | "fipi" | "demo_pdf" | "other";
  sourceUrl?: string;           // URL to the original question
  sourceYear?: number;          // Year of the source

  // --- Course & subject ---
  courseId: "ege_russian" | "oge_physics" | "belenkova_math";
  subject: "russian" | "physics" | "math";
  exam?: "ege" | "oge" | "school";
  examNumber?: number;          // Task number (1-27), optional

  // --- Content ---
  topic: string;                // Required
  subtopic?: string;
  difficulty?: "easy" | "medium" | "hard";
  type: QuestionType;           // single_choice, multi_choice, text_input, matching, formula_gap, numeric_input, flashcard_self_check
  prompt: string;               // Required — the question text
  presentation?: "default" | "formula" | "compact" | "card";

  // --- Type-specific content ---
  options?: QuestionOption[];   // For choice types
  pairs?: MatchingPair[];       // For matching
  formulaTemplate?: FormulaTemplate;  // For formula_gap
  numericConfig?: NumericConfig;      // For numeric_input

  // --- Answer & explanation (may be missing for parsed-only) ---
  correctAnswer?: CorrectAnswer;
  explanation?: QuestionExplanation;

  // --- Tags ---
  tags?: string[];

  // --- Import metadata ---
  answerStatus: "parsed" | "missing" | "needs_manual_review" | "verified";
  confidenceScore?: number;     // 0..1 — parser confidence
}
```

## Answer Status

| Status | Meaning | Auto-publish? |
|---|---|---|
| `parsed` | Answer extracted from source, not yet verified | No |
| `missing` | No answer found in source | No |
| `needs_manual_review` | Answer may be incorrect, needs human check | No |
| `verified` | Answer confirmed correct | Yes (if confidenceScore ≥ 0.8) |

**Critical rule**: Questions without `verified` answers are NEVER auto-published. They are imported as `draft` status and require manual review.

## Import File Format

The import file is a JSON file with optional metadata:

```json
{
  "meta": {
    "source": "fipi",
    "courseId": "ege_russian",
    "description": "FIPI EGE Russian 2026 questions",
    "generatedAt": "2026-01-15T10:30:00Z",
    "parserVersion": "1.0.0"
  },
  "questions": [
    { ... },
    { ... }
  ]
}
```

The `meta` field is optional. The `questions` array must contain at least 1 question.

A bare array `[...]` is also accepted (treated as questions only, no metadata).

## Deduplication

Before importing, each question is checked for duplicates using `source_hash`.

The hash is computed from stable fields:

- `courseId`
- `source`
- `sourceUrl` or `externalId` (whichever is present)
- `prompt` normalized (trimmed, collapsed whitespace)
- `options` normalized (sorted by id, trimmed text)

If a question with the same `source_hash` already exists in Supabase, it is **skipped** (not re-imported). This ensures re-running the import script does not create duplicates.

## Import Status Logic

When a question is imported:

- If `answerStatus === "verified"` AND `confidenceScore >= 0.8` (or missing confidenceScore):
  → `status = "published"`
- Otherwise:
  → `status = "draft"`

Draft questions are not shown in the app. They require manual review and status change to `published`.

## Validation Script

```bash
bun run scripts/validate-import.ts <path-to-json-file>
```

This script:
1. Reads the JSON file
2. Validates each question against the ParsedQuestionSchema
3. Prints statistics:
   - Total questions
   - Valid questions
   - Invalid questions (with error details)
   - Answer status breakdown
   - Course distribution
4. Does NOT upload anything

## Import Script

```bash
bun run scripts/import-questions.ts <path-to-json-file>
```

This script:
1. Reads the JSON file
2. Validates all questions
3. Computes `source_hash` for each question
4. Checks Supabase for existing questions with same hash (deduplication)
5. Upserts `question_texts` if any questions reference text blocks
6. Inserts new questions into `questions` table
7. Creates an `import_batches` row with statistics
8. Prints import report:
   - Total processed
   - Newly inserted
   - Duplicates skipped
   - Published count
   - Draft count
   - Error count

**Requirements**:
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Service role key is ONLY used in this script, never in frontend
- Script fails fast if env vars are missing

## Example File

See `examples/parsed-questions.example.json` for a complete example with one question per course.

## Safety Rules

1. Never auto-publish questions with missing or unverified answers
2. Re-running import does not create duplicates (source_hash dedup)
3. Service role key never appears in frontend code
4. Invalid questions are skipped, not crash the import
5. Import batch row tracks statistics for audit trail

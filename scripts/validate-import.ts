// ============================================================
// Validate Import Script
// Phase 18: Admin import pipeline
//
// Usage:
//   bun run scripts/validate-import.ts <path-to-json-file>
//
// This script:
// 1. Reads the JSON file
// 2. Validates each question against ParsedQuestionSchema
// 3. Prints statistics and error details
// 4. Does NOT upload anything to Supabase
// ============================================================

import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ParsedQuestionSchema,
  ImportFileSchema,
  type ParsedQuestion,
  type AnswerStatus,
  type ImportSource,
} from "@/lib/import/parsed-question-schema";
import {
  computeSourceHash,
  findInternalDuplicates,
} from "@/lib/import/dedup";

// -----------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("❌ Usage: bun run scripts/validate-import.ts <path-to-json-file>");
  process.exit(1);
}

const filePath = resolve(args[0]);

// -----------------------------------------------------------
// Read and parse JSON
// -----------------------------------------------------------

console.log(`\n📋 Validating import file: ${filePath}\n`);

let raw: unknown;
try {
  const fileContent = readFileSync(filePath, "utf-8");
  raw = JSON.parse(fileContent);
} catch (err) {
  console.error("❌ Failed to read or parse JSON file:", err);
  process.exit(1);
}

// -----------------------------------------------------------
// Detect format: bare array or wrapped object
// -----------------------------------------------------------

let questions: unknown[];

if (Array.isArray(raw)) {
  questions = raw;
  console.log("📦 Format: bare array (no metadata)\n");
} else if (raw && typeof raw === "object" && "questions" in raw) {
  // Validate the full import file structure
  const fileResult = ImportFileSchema.safeParse(raw);
  if (!fileResult.success) {
    console.error("❌ Import file metadata is invalid:");
    for (const issue of fileResult.error.issues) {
      console.error(
        `   meta.${issue.path.join(".")}: ${issue.message}`
      );
    }
    console.log("");
  } else {
    const meta = (raw as { meta?: Record<string, unknown> }).meta;
    if (meta) {
      console.log("📦 Format: wrapped object with metadata");
      console.log(`   Source: ${meta.source ?? "N/A"}`);
      console.log(`   Course: ${meta.courseId ?? "N/A"}`);
      console.log(`   Description: ${meta.description ?? "N/A"}`);
      console.log(`   Generated: ${meta.generatedAt ?? "N/A"}`);
      console.log("");
    }
  }
  questions = (raw as { questions: unknown[] }).questions;
} else {
  console.error(
    "❌ Invalid format: expected array or object with 'questions' field"
  );
  process.exit(1);
}

console.log(`📊 Total questions in file: ${questions.length}\n`);

// -----------------------------------------------------------
// Validate each question
// -----------------------------------------------------------

interface ValidationResult {
  valid: ParsedQuestion[];
  invalid: Array<{ index: number; errors: string[] }>;
  answerStatusBreakdown: Record<AnswerStatus, number>;
  sourceBreakdown: Record<string, number>;
  courseBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  hasAnswerCount: number;
  missingAnswerCount: number;
  avgConfidence: number | null;
}

const result: ValidationResult = {
  valid: [],
  invalid: [],
  answerStatusBreakdown: { parsed: 0, missing: 0, needs_manual_review: 0, verified: 0 },
  sourceBreakdown: {},
  courseBreakdown: {},
  typeBreakdown: {},
  hasAnswerCount: 0,
  missingAnswerCount: 0,
  avgConfidence: null,
};

let confidenceSum = 0;
let confidenceCount = 0;

for (let i = 0; i < questions.length; i++) {
  const parseResult = ParsedQuestionSchema.safeParse(questions[i]);

  if (parseResult.success) {
    const q = parseResult.data;
    result.valid.push(q);

    // Answer status
    result.answerStatusBreakdown[q.answerStatus]++;

    // Has answer?
    if (q.correctAnswer) {
      result.hasAnswerCount++;
    } else {
      result.missingAnswerCount++;
    }

    // Source
    result.sourceBreakdown[q.source] =
      (result.sourceBreakdown[q.source] ?? 0) + 1;

    // Course
    result.courseBreakdown[q.courseId] =
      (result.courseBreakdown[q.courseId] ?? 0) + 1;

    // Type
    result.typeBreakdown[q.type] =
      (result.typeBreakdown[q.type] ?? 0) + 1;

    // Confidence
    if (q.confidenceScore !== undefined) {
      confidenceSum += q.confidenceScore;
      confidenceCount++;
    }
  } else {
    const errors = parseResult.error.issues.map(
      (iss) => `${iss.path.join(".")}: ${iss.message}`
    );
    result.invalid.push({ index: i + 1, errors });
  }
}

result.avgConfidence =
  confidenceCount > 0 ? confidenceSum / confidenceCount : null;

// -----------------------------------------------------------
// Check internal duplicates
// -----------------------------------------------------------

const internalDupes = findInternalDuplicates(result.valid);

// -----------------------------------------------------------
// Print report
// -----------------------------------------------------------

console.log("═".repeat(60));
console.log("  VALIDATION REPORT");
console.log("═".repeat(60));

console.log(`\n✅ Valid questions:   ${result.valid.length}`);
console.log(`❌ Invalid questions: ${result.invalid.length}`);

console.log("\n── Answer Status ──");
console.log(
  `   verified:           ${result.answerStatusBreakdown.verified}`
);
console.log(
  `   parsed:             ${result.answerStatusBreakdown.parsed}`
);
console.log(
  `   needs_manual_review: ${result.answerStatusBreakdown.needs_manual_review}`
);
console.log(
  `   missing:            ${result.answerStatusBreakdown.missing}`
);

console.log("\n── Answer Availability ──");
console.log(`   Has answer:     ${result.hasAnswerCount}`);
console.log(`   Missing answer: ${result.missingAnswerCount}`);

console.log("\n── Source Distribution ──");
for (const [source, count] of Object.entries(result.sourceBreakdown).sort()) {
  console.log(`   ${source}: ${count}`);
}

console.log("\n── Course Distribution ──");
for (const [course, count] of Object.entries(result.courseBreakdown).sort()) {
  console.log(`   ${course}: ${count}`);
}

console.log("\n── Type Distribution ──");
for (const [type, count] of Object.entries(result.typeBreakdown).sort()) {
  console.log(`   ${type}: ${count}`);
}

if (result.avgConfidence !== null) {
  console.log(
    `\n── Average Confidence: ${(result.avgConfidence * 100).toFixed(1)}% ──`
  );
}

// Auto-publish estimate
const autoPublishCount = result.valid.filter(
  (q) => q.answerStatus === "verified" && (q.confidenceScore ?? 1) >= 0.8
).length;
const draftCount = result.valid.length - autoPublishCount;
console.log(
  `\n── Import Status Estimate ──`
);
console.log(`   Would be published: ${autoPublishCount}`);
console.log(`   Would be draft:     ${draftCount}`);

if (internalDupes.length > 0) {
  console.log(
    `\n⚠️  Internal duplicates found: ${internalDupes.length} groups`
  );
  for (const dupe of internalDupes.slice(0, 5)) {
    console.log(
      `   Hash ${dupe.hash.slice(0, 12)}... → questions #${dupe.indices.map((i) => i + 1).join(", #")}`
    );
  }
  if (internalDupes.length > 5) {
    console.log(`   ... and ${internalDupes.length - 5} more`);
  }
}

if (result.invalid.length > 0) {
  console.log("\n── Invalid Questions ──");
  for (const inv of result.invalid) {
    console.log(`\n   Question #${inv.index}:`);
    for (const err of inv.errors) {
      console.log(`     • ${err}`);
    }
  }
}

console.log("\n═".repeat(60));

if (result.invalid.length > 0) {
  console.log(
    `❌ VALIDATION FAILED: ${result.invalid.length} invalid question(s)`
  );
  process.exit(1);
} else {
  console.log("✅ ALL QUESTIONS VALID");
}

// Print dedup hashes for the valid questions
console.log("\n── Source Hashes (for dedup check) ──");
for (let i = 0; i < result.valid.length; i++) {
  const hash = computeSourceHash(result.valid[i]);
  const q = result.valid[i];
  console.log(
    `   #${i + 1} [${q.courseId}/${q.type}]: ${hash.slice(0, 16)}...`
  );
}

console.log("\n✅ Validation complete. No data was uploaded.\n");

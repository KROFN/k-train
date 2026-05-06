// ============================================================
// Import Questions Script — uploads validated questions to Supabase
// Phase 18: Admin import pipeline
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/import-questions.ts <path-to-json-file>
//
// This script:
// 1. Reads and validates the JSON file
// 2. Computes source_hash for deduplication
// 3. Checks Supabase for existing questions with same hash
// 4. Inserts new questions into Supabase
// 5. Creates an import_batch row with statistics
// 6. Prints import report
//
// IMPORTANT:
// - Requires SUPABASE_SERVICE_ROLE_KEY environment variable
// - Service role key is ONLY used in this script, never in frontend
// - Re-running import does not create duplicates (source_hash dedup)
// - Questions without verified answers are imported as draft, not published
// ============================================================

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import {
  ParsedQuestionSchema,
  ImportFileSchema,
  type ParsedQuestion,
} from "@/lib/import/parsed-question-schema";
import { computeSourceHash } from "@/lib/import/dedup";

// -----------------------------------------------------------
// CLI argument parsing
// -----------------------------------------------------------

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("❌ Usage: bun run scripts/import-questions.ts <path-to-json-file>");
  process.exit(1);
}

const filePath = resolve(args[0]);

// -----------------------------------------------------------
// Environment check
// -----------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing environment variables. Required:"
  );
  console.error("   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>");
  console.error("   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>");
  console.error(
    "\n   ⚠️  The service role key bypasses RLS. Keep it secret!"
  );
  process.exit(1);
}

// -----------------------------------------------------------
// Initialize Supabase client with service role key
// -----------------------------------------------------------

const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false, // No session needed for service role
      autoRefreshToken: false,
    },
  }
);

// -----------------------------------------------------------
// Read and parse JSON
// -----------------------------------------------------------

console.log(`\n📥 Importing questions from: ${filePath}\n`);

let raw: unknown;
try {
  const fileContent = readFileSync(filePath, "utf-8");
  raw = JSON.parse(fileContent);
} catch (err) {
  console.error("❌ Failed to read or parse JSON file:", err);
  process.exit(1);
}

// Detect format
let questions: unknown[];
let importSource: string = "other";
let importCourseId: string = "unknown";

if (Array.isArray(raw)) {
  questions = raw;
} else if (raw && typeof raw === "object" && "questions" in raw) {
  const obj = raw as { questions: unknown[]; meta?: Record<string, unknown> };
  questions = obj.questions;
  if (obj.meta?.source) importSource = obj.meta.source as string;
  if (obj.meta?.courseId) importCourseId = obj.meta.courseId as string;
} else {
  console.error("❌ Invalid format: expected array or object with 'questions' field");
  process.exit(1);
}

console.log(`📊 Total questions in file: ${questions.length}`);

// -----------------------------------------------------------
// Validate all questions
// -----------------------------------------------------------

const validQuestions: ParsedQuestion[] = [];
const validationErrors: Array<{ index: number; errors: string[] }> = [];

for (let i = 0; i < questions.length; i++) {
  const result = ParsedQuestionSchema.safeParse(questions[i]);
  if (result.success) {
    validQuestions.push(result.data);
  } else {
    const errors = result.error.issues.map(
      (iss) => `${iss.path.join(".")}: ${iss.message}`
    );
    validationErrors.push({ index: i + 1, errors });
  }
}

if (validationErrors.length > 0) {
  console.log(`\n❌ ${validationErrors.length} invalid questions found:`);
  for (const inv of validationErrors.slice(0, 10)) {
    console.log(`   Question #${inv.index}:`);
    for (const err of inv.errors) {
      console.log(`     • ${err}`);
    }
  }
  if (validationErrors.length > 10) {
    console.log(`   ... and ${validationErrors.length - 10} more`);
  }
  console.log(
    `\n⚠️  Skipping ${validationErrors.length} invalid questions. Proceeding with ${validQuestions.length} valid ones.\n`
  );
}

if (validQuestions.length === 0) {
  console.error("❌ No valid questions to import. Aborting.");
  process.exit(1);
}

// -----------------------------------------------------------
// Compute source hashes
// -----------------------------------------------------------

console.log("🔑 Computing source hashes for deduplication...");

const questionsWithHash = validQuestions.map((q) => ({
  question: q,
  sourceHash: computeSourceHash(q),
}));

// -----------------------------------------------------------
// Check existing hashes in Supabase
// -----------------------------------------------------------

console.log("🔍 Checking Supabase for existing questions...");

const allHashes = questionsWithHash.map((q) => q.sourceHash);
const existingHashes = new Set<string>();

// Check in batches of 100 (Supabase IN clause limit)
const BATCH_SIZE = 100;
for (let i = 0; i < allHashes.length; i += BATCH_SIZE) {
  const batch = allHashes.slice(i, i + BATCH_SIZE);
  const { data, error } = await supabase
    .from("questions")
    .select("source_hash")
    .in("source_hash", batch);

  if (error) {
    console.warn("⚠️  Could not check existing hashes:", error.message);
    // Continue anyway — worst case we might get duplicate insert errors
  } else if (data) {
    for (const row of data) {
      if (row.source_hash) {
        existingHashes.add(row.source_hash);
      }
    }
  }
}

console.log(`   Found ${existingHashes.size} existing questions in Supabase`);

// -----------------------------------------------------------
// Filter out duplicates
// -----------------------------------------------------------

const newQuestions = questionsWithHash.filter(
  (q) => !existingHashes.has(q.sourceHash)
);
const duplicateCount = questionsWithHash.length - newQuestions.length;

if (duplicateCount > 0) {
  console.log(`   ⏭️  Skipping ${duplicateCount} duplicate(s)`);
}

if (newQuestions.length === 0) {
  console.log("\n✅ All questions already exist. Nothing to import.\n");
  process.exit(0);
}

// -----------------------------------------------------------
// Prepare questions for insert
// -----------------------------------------------------------

console.log(`\n📝 Preparing ${newQuestions.length} questions for import...`);

let publishedCount = 0;
let draftCount = 0;

const rowsToInsert: Array<Database["public"]["Tables"]["questions"]["Insert"]> =
  [];

for (const { question, sourceHash } of newQuestions) {
  // Determine status: published only if verified + high confidence
  const isVerified = question.answerStatus === "verified";
  const highConfidence = (question.confidenceScore ?? 1) >= 0.8;
  const hasAnswer = !!question.correctAnswer;

  let status: string;
  if (isVerified && highConfidence && hasAnswer) {
    status = "published";
    publishedCount++;
  } else {
    status = "draft";
    draftCount++;
  }

  const row: Database["public"]["Tables"]["questions"]["Insert"] = {
    course_id: question.courseId,
    subject: question.subject,
    exam: question.exam ?? null,
    exam_number: question.examNumber ?? null,
    topic: question.topic,
    subtopic: question.subtopic ?? null,
    difficulty: question.difficulty ?? "medium",
    type: question.type,
    presentation: question.presentation ?? null,
    prompt: question.prompt,
    text_id: null, // text_id mapping not supported in this phase
    options: question.options ?? null,
    pairs: question.pairs ?? null,
    formula_template: question.formulaTemplate ?? null,
    numeric_config: question.numericConfig ?? null,
    correct_answer: question.correctAnswer ?? { type: "self_check", value: "known" },
    explanation: question.explanation ?? { short: "Объяснение не предоставлено" },
    tags: question.tags ?? null,
    status,
    source: question.source,
    source_url: question.sourceUrl ?? null,
    source_year: question.sourceYear ?? null,
    source_hash: sourceHash,
  };

  rowsToInsert.push(row);
}

// -----------------------------------------------------------
// Insert questions into Supabase
// -----------------------------------------------------------

console.log(`   Publishing: ${publishedCount}`);
console.log(`   As draft:   ${draftCount}`);
console.log(`\n⬆️  Inserting into Supabase...`);

// Insert in batches of 50
let insertedCount = 0;
let errorCount = 0;
const insertErrors: string[] = [];

for (let i = 0; i < rowsToInsert.length; i += 50) {
  const batch = rowsToInsert.slice(i, i + 50);

  const { data, error } = await supabase
    .from("questions")
    .insert(batch)
    .select("id");

  if (error) {
    errorCount += batch.length;
    insertErrors.push(
      `Batch ${Math.floor(i / 50) + 1}: ${error.message}`
    );
    console.warn(
      `   ⚠️  Batch ${Math.floor(i / 50) + 1} failed: ${error.message}`
    );
  } else if (data) {
    insertedCount += data.length;
  }
}

// -----------------------------------------------------------
// Create import_batch record
// -----------------------------------------------------------

if (insertedCount > 0) {
  console.log("\n📋 Creating import batch record...");

  const courseId = importCourseId !== "unknown"
    ? importCourseId
    : newQuestions[0]?.question.courseId ?? "ege_russian";

  const { error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source: importSource,
      course_id: courseId,
      total_questions: newQuestions.length,
      published_count: publishedCount,
      draft_count: draftCount,
      error_count: errorCount,
    });

  if (batchError) {
    console.warn(
      "⚠️  Could not create import batch record:",
      batchError.message
    );
  }
}

// -----------------------------------------------------------
// Print final report
// -----------------------------------------------------------

console.log("\n═".repeat(60));
console.log("  IMPORT REPORT");
console.log("═".repeat(60));

console.log(`\n   File:              ${filePath}`);
console.log(`   Total in file:     ${questions.length}`);
console.log(`   Valid:             ${validQuestions.length}`);
console.log(`   Invalid:           ${validationErrors.length}`);
console.log(`   Duplicates:        ${duplicateCount}`);
console.log(`   Newly inserted:    ${insertedCount}`);
console.log(`   Insert errors:     ${errorCount}`);
console.log(`   Published:         ${publishedCount}`);
console.log(`   Draft:             ${draftCount}`);

if (insertErrors.length > 0) {
  console.log("\n   Insert errors:");
  for (const err of insertErrors) {
    console.log(`     • ${err}`);
  }
}

console.log("\n═".repeat(60));

if (errorCount > 0 && insertedCount === 0) {
  console.log("❌ IMPORT FAILED: No questions were inserted");
  process.exit(1);
} else if (errorCount > 0) {
  console.log(
    `⚠️  IMPORT PARTIAL: ${insertedCount} inserted, ${errorCount} failed`
  );
} else {
  console.log("✅ IMPORT COMPLETE");
}

console.log("\n");

// ============================================================
// Upload local seed questions to Supabase
// Phase 16: Seed upload script
//
// This script reads local seed questions and uploads them to Supabase.
// It uses the service role key — NEVER expose this to the frontend.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/upload-local-questions-to-supabase.ts
//
// Requirements:
// - NEXT_PUBLIC_SUPABASE_URL must be set in .env
// - SUPABASE_SERVICE_ROLE_KEY must be set as env var
// - Supabase tables must exist (run migration 001 first)
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { getAllQuestions } from "../src/data/questions";
import { QuestionSchema } from "../src/lib/validators";
import type { Question } from "../src/types/quiz";
import type { CorrectAnswer, QuestionExplanation } from "../src/types/quiz";

// -----------------------------------------------------------
// Supabase client with service role key
// -----------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set");
  console.error("   Run: SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/upload-local-questions-to-supabase.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// -----------------------------------------------------------
// Mapper: Question → Supabase row
// -----------------------------------------------------------

function questionToRow(q: Question) {
  return {
    id: q.id,
    course_id: q.courseId,
    subject: q.subject,
    exam: q.exam ?? null,
    exam_number: q.examNumber ?? null,
    topic: q.topic,
    subtopic: q.subtopic ?? null,
    difficulty: q.difficulty,
    type: q.type,
    presentation: q.presentation ?? null,
    prompt: q.prompt,
    text_id: q.textId ?? null,
    options: q.options ?? null,
    pairs: q.pairs ?? null,
    formula_template: q.formulaTemplate ?? null,
    numeric_config: q.numericConfig ?? null,
    correct_answer: q.correctAnswer as unknown as object,
    explanation: q.explanation as unknown as object,
    tags: q.tags ?? null,
    status: "published" as const,  // All existing MVP content is published
    source: "manual" as const,
    source_hash: null,
  };
}

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------

async function main() {
  console.log("📦 Loading local seed questions...");

  const allQuestions = getAllQuestions();
  console.log(`   Found ${allQuestions.length} questions in local seed`);

  // Validate all questions with Zod
  let validCount = 0;
  let invalidCount = 0;
  const validatedQuestions: Question[] = [];

  for (const q of allQuestions) {
    const result = QuestionSchema.safeParse(q);
    if (result.success) {
      validatedQuestions.push(result.data as Question);
      validCount++;
    } else {
      invalidCount++;
      const msgs = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      console.warn(`   ⚠️  Invalid question "${q.id}": ${msgs}`);
    }
  }

  console.log(`   ✅ ${validCount} valid, ${invalidCount} invalid`);

  if (validatedQuestions.length === 0) {
    console.error("❌ No valid questions to upload");
    process.exit(1);
  }

  // Map to Supabase rows
  const rows = validatedQuestions.map(questionToRow);

  // Upload in batches of 50
  const BATCH_SIZE = 50;
  let uploaded = 0;
  let errors = 0;

  console.log(`📤 Uploading ${rows.length} questions to Supabase in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("questions")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errors += batch.length;
    } else {
      uploaded += batch.length;
      console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} questions uploaded`);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Total local questions:  ${allQuestions.length}`);
  console.log(`   Validated:              ${validCount}`);
  console.log(`   Invalid:                ${invalidCount}`);
  console.log(`   Uploaded to Supabase:   ${uploaded}`);
  console.log(`   Upload errors:          ${errors}`);

  if (errors > 0) {
    process.exit(1);
  }

  console.log("\n✅ Done! All questions uploaded to Supabase with status=published");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});

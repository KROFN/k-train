// ============================================================
// Question mapper — converts Supabase DB rows to Question objects
// Phase 16: Questions from Supabase with local fallback
//
// Requirements:
// - Convert DB row to Question type
// - Validate with Zod
// - Skip invalid questions safely
// - Log dev warning, not crash UI
// ============================================================

import type { Question } from "@/types/quiz";
import { QuestionSchema } from "@/lib/validators";

/** Supabase questions table row type */
export type QuestionRow = {
  id: string;
  course_id: string;
  subject: string;
  exam: string | null;
  exam_number: number | null;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  type: string;
  presentation: string | null;
  prompt: string;
  text_id: string | null;
  options: unknown | null;
  pairs: unknown | null;
  formula_template: unknown | null;
  numeric_config: unknown | null;
  correct_answer: unknown;
  explanation: unknown;
  tags: string[] | null;
  status: string;
  source: string | null;
  source_url: string | null;
  source_year: number | null;
  source_hash: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Map a Supabase questions row to a Question object.
 * Converts snake_case DB columns to camelCase TypeScript fields.
 * Does NOT validate — use validateMappedQuestion() for that.
 */
export function mapRowToQuestion(row: QuestionRow): unknown {
  return {
    id: row.id,
    courseId: row.course_id,
    subject: row.subject,
    exam: row.exam ?? undefined,
    examNumber: row.exam_number ?? undefined,
    type: row.type,
    topic: row.topic,
    subtopic: row.subtopic ?? undefined,
    difficulty: row.difficulty,
    prompt: row.prompt,
    presentation: row.presentation ?? undefined,
    textId: row.text_id ?? undefined,
    options: row.options ?? undefined,
    pairs: row.pairs ?? undefined,
    formulaTemplate: row.formula_template ?? undefined,
    numericConfig: row.numeric_config ?? undefined,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    tags: row.tags ?? undefined,
  };
}

/**
 * Validate a mapped question object with Zod.
 * Returns the validated Question if valid, or null if invalid.
 * Logs a dev warning for invalid questions (does not crash).
 */
export function validateMappedQuestion(mapped: unknown): Question | null {
  const result = QuestionSchema.safeParse(mapped);
  if (result.success) {
    return result.data as Question;
  }

  // Log the validation errors for debugging
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const id = (mapped as Record<string, unknown>)?.id ?? "unknown";
    const msgs = result.error.issues
      .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
      .join("; ");
    console.warn(
      `[QuestionMapper] Skipping invalid question "${id}": ${msgs}`
    );
  }

  return null;
}

/**
 * Map and validate an array of Supabase rows to Question objects.
 * Invalid rows are silently skipped.
 * Returns { questions, skippedCount } for logging/reporting.
 */
export function mapAndValidateRows(
  rows: QuestionRow[]
): { questions: Question[]; skippedCount: number } {
  const questions: Question[] = [];
  let skippedCount = 0;

  for (const row of rows) {
    const mapped = mapRowToQuestion(row);
    const validated = validateMappedQuestion(mapped);
    if (validated) {
      questions.push(validated);
    } else {
      skippedCount++;
    }
  }

  return { questions, skippedCount };
}

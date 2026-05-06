// ============================================================
// Parsed question schema — import contract for admin pipeline
// Phase 18: Admin import pipeline
//
// This schema defines the format of questions parsed from external
// sources (FIPI, demo PDFs, manual entry) before they are imported
// into Supabase.
//
// The schema is stricter than the runtime Question type because
// imported data must be validated before entering the database.
// ============================================================

import { z } from "zod";

// -----------------------------------------------------------
// Answer status — tracks verification state of imported questions
// -----------------------------------------------------------

/** Status of the correct answer in an imported question */
export type AnswerStatus =
  | "parsed"
  | "missing"
  | "needs_manual_review"
  | "verified";

export const AnswerStatusSchema = z.enum([
  "parsed",
  "missing",
  "needs_manual_review",
  "verified",
]);

// -----------------------------------------------------------
// Import source types
// -----------------------------------------------------------

export type ImportSource = "manual" | "fipi" | "demo_pdf" | "other";

export const ImportSourceSchema = z.enum([
  "manual",
  "fipi",
  "demo_pdf",
  "other",
]);

// -----------------------------------------------------------
// Re-use core schemas from validators.ts
// These are shared between seed data and import data
// -----------------------------------------------------------

import {
  QuestionTypeSchema,
  QuestionDifficultySchema,
  QuestionPresentationSchema,
  QuestionOptionSchema,
  MatchingPairSchema,
  CorrectAnswerSchema,
  QuestionExplanationSchema,
  FormulaTemplateSchema,
  NumericConfigSchema,
} from "@/lib/validators";

// -----------------------------------------------------------
// Parsed question schema
// -----------------------------------------------------------

/**
 * Schema for a question parsed from an external source.
 *
 * Key differences from the runtime Question type:
 * - `externalId`: optional identifier from the source system
 * - `source`: required — where this question came from
 * - `sourceUrl`: optional URL to the original question
 * - `sourceYear`: optional year of the source
 * - `correctAnswer`: optional — may be missing for parsed-only questions
 * - `explanation`: optional — may be missing for parsed-only questions
 * - `answerStatus`: tracks verification state
 * - `confidenceScore`: 0..1 indicating parse confidence
 */
export const ParsedQuestionSchema = z
  .object({
    externalId: z.string().min(1).optional(),
    source: ImportSourceSchema,
    sourceUrl: z.string().url().optional(),
    sourceYear: z.number().int().min(2000).max(2100).optional(),
    courseId: z.enum(["ege_russian", "oge_physics", "belenkova_math"]),
    subject: z.enum(["russian", "physics", "math"]),
    exam: z.enum(["ege", "oge", "school"]).optional(),
    examNumber: z.number().int().min(1).max(27).optional(),
    topic: z.string().min(1),
    subtopic: z.string().optional(),
    difficulty: QuestionDifficultySchema.optional(),
    type: QuestionTypeSchema,
    prompt: z.string().min(1),
    presentation: QuestionPresentationSchema.optional(),
    options: z.array(QuestionOptionSchema).optional(),
    pairs: z.array(MatchingPairSchema).optional(),
    formulaTemplate: FormulaTemplateSchema.optional(),
    numericConfig: NumericConfigSchema.optional(),
    correctAnswer: CorrectAnswerSchema.optional(),
    explanation: QuestionExplanationSchema.optional(),
    tags: z.array(z.string()).optional(),
    answerStatus: AnswerStatusSchema.default("parsed"),
    confidenceScore: z.number().min(0).max(1).optional(),
  })
  .refine(
    (q) => {
      // If answerStatus is "verified", correctAnswer must be present
      if (q.answerStatus === "verified" && !q.correctAnswer) {
        return false;
      }
      return true;
    },
    {
      message:
        "Verified questions must have a correctAnswer",
    }
  )
  .refine(
    (q) => {
      // If answerStatus is "missing", correctAnswer must be absent
      if (q.answerStatus === "missing" && q.correctAnswer) {
        return false;
      }
      return true;
    },
    {
      message:
        "Questions with missing answer status must not have a correctAnswer",
    }
  )
  .refine(
    (q) => {
      // single_choice must have options (if answer is present)
      if (q.type === "single_choice" && q.correctAnswer) {
        return (q.options?.length ?? 0) >= 2;
      }
      return true;
    },
    { message: "single_choice questions with answers must have at least 2 options" }
  )
  .refine(
    (q) => {
      // multi_choice must have options (if answer is present)
      if (q.type === "multi_choice" && q.correctAnswer) {
        return (q.options?.length ?? 0) >= 2;
      }
      return true;
    },
    { message: "multi_choice questions with answers must have at least 2 options" }
  )
  .refine(
    (q) => {
      // matching must have pairs (if answer is present)
      if (q.type === "matching" && q.correctAnswer) {
        return (q.pairs?.length ?? 0) >= 2;
      }
      return true;
    },
    { message: "matching questions with answers must have at least 2 pairs" }
  )
  .refine(
    (q) => {
      // formula_gap must have formulaTemplate and options (if answer is present)
      if (q.type === "formula_gap" && q.correctAnswer) {
        if (!q.formulaTemplate) return false;
        if ((q.options?.length ?? 0) < 2) return false;
      }
      return true;
    },
    {
      message:
        "formula_gap questions with answers must have formulaTemplate and at least 2 options",
    }
  )
  .refine(
    (q) => {
      // numeric_input with answer must have correctAnswer.type === "numeric"
      if (q.type === "numeric_input" && q.correctAnswer) {
        return q.correctAnswer.type === "numeric";
      }
      return true;
    },
    { message: "numeric_input questions with answers must have correctAnswer.type === 'numeric'" }
  );

// -----------------------------------------------------------
// Type export
// -----------------------------------------------------------

export type ParsedQuestion = z.infer<typeof ParsedQuestionSchema>;

// -----------------------------------------------------------
// Import file schema (array of parsed questions with metadata)
// -----------------------------------------------------------

export const ImportFileSchema = z.object({
  /** Metadata about this import file */
  meta: z
    .object({
      source: ImportSourceSchema.optional(),
      courseId: z.enum(["ege_russian", "oge_physics", "belenkova_math"]).optional(),
      description: z.string().optional(),
      generatedAt: z.string().optional(),
      parserVersion: z.string().optional(),
    })
    .optional(),
  /** Array of parsed questions */
  questions: z.array(ParsedQuestionSchema).min(1),
});

export type ImportFile = z.infer<typeof ImportFileSchema>;

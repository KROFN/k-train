// ============================================================
// Zod validation schemas for multi-course study trainer seed data
// Phase 12: Extended with formula_gap, numeric_input, flashcard_self_check
// ============================================================

import { z } from "zod";

// -----------------------------------------------------------
// Primitives
// -----------------------------------------------------------

export const QuestionTypeSchema = z.enum([
  "single_choice",
  "multi_choice",
  "text_input",
  "matching",
  "formula_gap",
  "numeric_input",
  "flashcard_self_check",
]);

export const QuestionDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const QuestionPresentationSchema = z.enum([
  "default",
  "formula",
  "compact",
  "card",
]);

// -----------------------------------------------------------
// FormulaTemplate (for formula_gap questions)
// -----------------------------------------------------------

export const FormulaTemplatePartSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    value: z.string().min(1),
  }),
  z.object({
    kind: z.literal("slot"),
    slotId: z.string().min(1),
    placeholder: z.string().optional(),
  }),
]);

export const FormulaTemplateSchema = z.object({
  parts: z.array(FormulaTemplatePartSchema).min(1),
});

// -----------------------------------------------------------
// NumericConfig (for numeric_input questions)
// -----------------------------------------------------------

export const NumericConfigSchema = z.object({
  kind: z.enum(["plain", "unit_conversion", "mental_formula_problem"]),
  expectedUnit: z.string().optional(),
  acceptedUnits: z.array(z.string()).optional(),
  tolerance: z.number().min(0).optional(),
});

// -----------------------------------------------------------
// QuestionOption
// -----------------------------------------------------------

export const QuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

// -----------------------------------------------------------
// MatchingPair
// -----------------------------------------------------------

export const MatchingPairSchema = z.object({
  leftId: z.string().min(1),
  leftText: z.string().min(1),
  rightId: z.string().min(1),
  rightText: z.string().min(1),
});

// -----------------------------------------------------------
// CorrectAnswer — discriminated union on "type"
// Phase 12: extended with numeric, slots, self_check
// -----------------------------------------------------------

export const CorrectAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("single"),
    value: z.string().min(1),
  }),
  z.object({
    type: z.literal("multiple"),
    value: z.array(z.string().min(1)).min(1),
    orderMatters: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("text"),
    value: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    normalize: z
      .enum(["strict", "lowercase", "no_spaces", "ege_sequence"])
      .optional(),
  }),
  z.object({
    type: z.literal("matching"),
    value: z.record(z.string().min(1), z.string().min(1)),
  }),
  z.object({
    type: z.literal("numeric"),
    value: z.number(),
    unit: z.string().optional(),
    acceptedUnits: z.array(z.string()).optional(),
    tolerance: z.number().min(0).optional(),
  }),
  z.object({
    type: z.literal("slots"),
    value: z.record(z.string().min(1), z.string().min(1)),
  }),
  z.object({
    type: z.literal("self_check"),
    value: z.literal("known"),
  }),
]);

// -----------------------------------------------------------
// QuestionExplanation
// -----------------------------------------------------------

export const QuestionExplanationSchema = z.object({
  short: z.string().min(1),
  detailed: z.string().optional(),
  rule: z.string().optional(),
  examples: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

// -----------------------------------------------------------
// Question
// -----------------------------------------------------------

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    courseId: z.enum(["ege_russian", "oge_physics", "belenkova_math"]),
    subject: z.enum(["russian", "physics", "math"]),
    exam: z.enum(["ege", "oge", "school"]).optional(),
    examNumber: z.number().int().min(1).max(27).optional(),
    type: QuestionTypeSchema,
    topic: z.string().min(1),
    subtopic: z.string().optional(),
    difficulty: QuestionDifficultySchema,
    prompt: z.string().min(1),
    presentation: QuestionPresentationSchema.optional(),
    textId: z.string().optional(),
    options: z.array(QuestionOptionSchema).optional(),
    pairs: z.array(MatchingPairSchema).optional(),
    formulaTemplate: FormulaTemplateSchema.optional(),
    numericConfig: NumericConfigSchema.optional(),
    correctAnswer: CorrectAnswerSchema,
    explanation: QuestionExplanationSchema,
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (q) => {
      // single_choice must have options
      if (q.type === "single_choice") return (q.options?.length ?? 0) >= 2;
      return true;
    },
    { message: "single_choice questions must have at least 2 options" }
  )
  .refine(
    (q) => {
      // multi_choice must have options
      if (q.type === "multi_choice") return (q.options?.length ?? 0) >= 2;
      return true;
    },
    { message: "multi_choice questions must have at least 2 options" }
  )
  .refine(
    (q) => {
      // matching must have pairs
      if (q.type === "matching") return (q.pairs?.length ?? 0) >= 2;
      return true;
    },
    { message: "matching questions must have at least 2 pairs" }
  )
  .refine(
    (q) => {
      // formula_gap must have formulaTemplate and options
      if (q.type === "formula_gap") {
        if (!q.formulaTemplate) return false;
        if ((q.options?.length ?? 0) < 2) return false;
      }
      return true;
    },
    {
      message:
        "formula_gap questions must have formulaTemplate and at least 2 options",
    }
  )
  .refine(
    (q) => {
      // numeric_input must have correctAnswer.type === "numeric"
      if (q.type === "numeric_input") {
        return q.correctAnswer.type === "numeric";
      }
      return true;
    },
    { message: "numeric_input questions must have correctAnswer.type === 'numeric'" }
  )
  .refine(
    (q) => {
      // flashcard_self_check must have explanation.answer or explanation.detailed
      if (q.type === "flashcard_self_check") {
        return !!(q.explanation.answer || q.explanation.detailed || q.explanation.rule);
      }
      return true;
    },
    {
      message:
        "flashcard_self_check questions must have explanation.answer or explanation.detailed or explanation.rule",
    }
  )
  .refine(
    (q) => {
      // formula_gap requires correctAnswer.type === "slots"
      if (q.type === "formula_gap") {
        return q.correctAnswer.type === "slots";
      }
      return true;
    },
    { message: "formula_gap questions must have correctAnswer.type === 'slots'" }
  )
  .refine(
    (q) => {
      // correctAnswer.type must match question type for existing types
      const typeMap: Record<string, string> = {
        single_choice: "single",
        multi_choice: "multiple",
        text_input: "text",
        matching: "matching",
      };
      const expected = typeMap[q.type];
      if (expected) return q.correctAnswer.type === expected;
      return true;
    },
    { message: "correctAnswer.type must match question type" }
  );

// -----------------------------------------------------------
// Validation helper
// -----------------------------------------------------------

/** Validate an array of questions, returning valid + errors */
export function validateQuestions(
  raw: unknown[]
): { valid: unknown[]; errors: string[] } {
  const valid: unknown[] = [];
  const errors: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const result = QuestionSchema.safeParse(raw[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const msgs = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      errors.push(`Question #${i + 1}: ${msgs}`);
    }
  }

  return { valid, errors };
}

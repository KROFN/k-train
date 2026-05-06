// ============================================================
// Confidence scorer — computes confidence scores for parsed questions
// Phase 19: FIPI parser MVP
//
// Each parsed question gets a confidenceScore: 0..1
// Based on how many expected fields were successfully extracted.
// ============================================================

/**
 * Compute a confidence score for a parsed question.
 *
 * Scoring logic:
 * - Base score starts at 0
 * - +0.25 if prompt was found and is non-empty
 * - +0.25 if options were found when expected (for choice types)
 * - +0.25 if answer was found
 * - +0.10 if examNumber was found
 * - +0.10 if topic was found
 * - +0.05 if explanation was found
 * - Penalties for suspicious empty fields
 *
 * The score is clamped to 0..1.
 */
export function computeConfidenceScore(params: {
  hasPrompt: boolean;
  hasOptions: boolean;
  expectsOptions: boolean;
  hasAnswer: boolean;
  hasExamNumber: boolean;
  hasTopic: boolean;
  hasExplanation: boolean;
  hasPairs: boolean;
  expectsPairs: boolean;
}): number {
  let score = 0;

  // Prompt is the most important field
  if (params.hasPrompt) {
    score += 0.25;
  }

  // Options for choice types
  if (params.expectsOptions) {
    if (params.hasOptions) {
      score += 0.25;
    } else {
      // Expected options but didn't find them — partial penalty
      score += 0.05;
    }
  } else {
    // Doesn't need options — full credit
    score += 0.25;
  }

  // Pairs for matching type
  if (params.expectsPairs) {
    if (params.hasPairs) {
      score += 0.25;
    } else {
      score += 0.05;
    }
  } else if (!params.expectsOptions) {
    // Neither options nor pairs needed (text_input, numeric_input, etc.)
    score += 0.25;
  }

  // Answer
  if (params.hasAnswer) {
    score += 0.25;
  }

  // Exam number (bonus)
  if (params.hasExamNumber) {
    score += 0.10;
  }

  // Topic (bonus)
  if (params.hasTopic) {
    score += 0.10;
  }

  // Explanation (bonus)
  if (params.hasExplanation) {
    score += 0.05;
  }

  // Clamp to 0..1
  return Math.min(1, Math.max(0, score));
}

/**
 * Determine the answer status based on extraction results.
 *
 * - "verified": Answer found with high confidence (≥0.8)
 * - "parsed": Answer found but lower confidence
 * - "needs_manual_review": Answer may be incorrect or incomplete
 * - "missing": No answer found
 */
export function determineAnswerStatus(params: {
  hasAnswer: boolean;
  confidenceScore: number;
  answerLooksComplete: boolean;
}): "verified" | "parsed" | "needs_manual_review" | "missing" {
  if (!params.hasAnswer) {
    return "missing";
  }

  if (params.confidenceScore >= 0.8 && params.answerLooksComplete) {
    return "verified";
  }

  if (params.confidenceScore >= 0.5) {
    return "parsed";
  }

  return "needs_manual_review";
}

/**
 * Check if an answer looks complete based on its type.
 */
export function answerLooksComplete(answer: unknown, questionType: string): boolean {
  if (!answer) return false;

  const a = answer as Record<string, unknown>;

  switch (questionType) {
    case "single_choice":
      return typeof a.value === "string" && a.value.length > 0;
    case "multi_choice":
      return Array.isArray(a.value) && a.value.length > 0;
    case "text_input":
      return typeof a.value === "string" && a.value.length > 0;
    case "matching":
      return typeof a.value === "object" && Object.keys(a.value as Record<string, unknown>).length >= 2;
    case "numeric_input":
      return typeof a.value === "number" || (typeof a.value === "string" && a.value.length > 0);
    case "formula_gap":
      return typeof a.value === "object" && Object.keys(a.value as Record<string, unknown>).length > 0;
    case "flashcard_self_check":
      return true; // Self-check always looks complete
    default:
      return false;
  }
}

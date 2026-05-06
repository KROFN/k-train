// ============================================================
// Practice builder — selects questions for various practice modes
// Phase 16: Accepts questions array as parameter (no hard dependency on local seed)
// Phase 11: Course-aware — every config variant includes courseId
// Used by quiz-store to start a session
// ============================================================

import type { Question, QuestionDifficulty } from "@/types/quiz";
import type { CourseId } from "@/types/course";
import {
  getQuestionsByCourseId,
  getTopicsByCourseId,
  getExamNumbersByCourseId,
} from "@/data/questions";

// -----------------------------------------------------------
// Config types
// -----------------------------------------------------------

export type PracticeMode =
  | "quick"
  | "by_exam_number"
  | "by_topic"
  | "by_difficulty"
  | "mistakes"
  | "by_formula"
  | "by_units"
  | "by_mental"
  | "by_gap"
  | "by_blitz";

export type PracticeConfig =
  | { mode: "quick"; courseId: CourseId; count?: number }
  | { mode: "by_exam_number"; courseId: CourseId; examNumber: number; count?: number }
  | { mode: "by_topic"; courseId: CourseId; topic: string; count?: number }
  | { mode: "by_difficulty"; courseId: CourseId; difficulty: QuestionDifficulty; count?: number }
  | { mode: "mistakes"; courseId: CourseId; mistakeQuestionIds: string[]; count?: number }
  | { mode: "by_formula"; courseId: CourseId; count?: number }
  | { mode: "by_units"; courseId: CourseId; count?: number }
  | { mode: "by_mental"; courseId: CourseId; count?: number }
  | { mode: "by_gap"; courseId: CourseId; count?: number }
  | { mode: "by_blitz"; courseId: CourseId; count?: number };

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Shuffle an array (Fisher-Yates), returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Take up to N items from an array */
function takeN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

// -----------------------------------------------------------
// Build question list from config — NEW API (questions as parameter)
// -----------------------------------------------------------

const DEFAULT_QUICK_COUNT = 10;
const DEFAULT_FILTERED_COUNT = 10;
const DEFAULT_MISTAKES_COUNT = 10;

/**
 * Build a list of questions for a practice session based on the given config.
 *
 * NEW (Phase 16): Accepts a questions array as the first parameter.
 * This decouples the practice builder from the local seed data source.
 *
 * @param questions - Array of Question objects (can come from Supabase or local seed)
 * @param config - Practice configuration
 * @returns A shuffled, limited array of questions, or empty array if no match
 */
export function buildPracticeQuestions(questions: Question[], config: PracticeConfig): Question[] {
  // Filter to the current course first
  const courseQuestions = questions.filter((q) => q.courseId === config.courseId);

  switch (config.mode) {
    case "quick": {
      const count = config.count ?? DEFAULT_QUICK_COUNT;
      return takeN(shuffle(courseQuestions), count);
    }

    case "by_exam_number": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) => q.examNumber === config.examNumber
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_topic": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) => q.topic === config.topic
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_difficulty": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) => q.difficulty === config.difficulty
      );
      return takeN(shuffle(filtered), count);
    }

    case "mistakes": {
      const count = config.count ?? DEFAULT_MISTAKES_COUNT;
      const mistakeQuestions = courseQuestions.filter((q) =>
        config.mistakeQuestionIds.includes(q.id)
      );
      return takeN(shuffle(mistakeQuestions), count);
    }

    case "by_formula": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) =>
          (q.tags?.includes("formula") ?? false) ||
          q.type === "formula_gap" ||
          q.type === "flashcard_self_check" ||
          q.presentation === "formula"
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_units": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) =>
          (q.tags?.includes("unit") ?? false) ||
          q.numericConfig?.kind === "unit_conversion"
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_mental": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) =>
          (q.tags?.includes("mental") ?? false) ||
          q.numericConfig?.kind === "mental_formula_problem"
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_gap": {
      const count = config.count ?? DEFAULT_FILTERED_COUNT;
      const filtered = courseQuestions.filter(
        (q) =>
          q.type === "formula_gap" ||
          (q.tags?.includes("gap") ?? false)
      );
      return takeN(shuffle(filtered), count);
    }

    case "by_blitz": {
      const count = config.count ?? 15;
      const filtered = courseQuestions.filter(
        (q) =>
          q.type === "formula_gap" ||
          q.type === "numeric_input" ||
          q.type === "flashcard_self_check" ||
          q.type === "single_choice"
      );
      return takeN(shuffle(filtered), count);
    }

    default:
      return [];
  }
}

// -----------------------------------------------------------
// Metadata helpers for UI — operate on a questions array
// -----------------------------------------------------------

/** Get all available exam numbers from a questions array */
export function getAvailableExamNumbers(courseId: CourseId): number[] {
  // Legacy: still reads from local seed for quick UI rendering
  return getExamNumbersByCourseId(courseId);
}

/** Get all available topics from a questions array */
export function getAvailableTopics(courseId: CourseId): string[] {
  // Legacy: still reads from local seed for quick UI rendering
  return getTopicsByCourseId(courseId);
}

/** Get count of questions available for a given config (from a questions array) */
export function getAvailableQuestionCount(questions: Question[], config: PracticeConfig): number {
  const courseQuestions = questions.filter((q) => q.courseId === config.courseId);

  switch (config.mode) {
    case "quick":
      return courseQuestions.length;
    case "by_exam_number":
      return courseQuestions.filter((q) => q.examNumber === config.examNumber).length;
    case "by_topic":
      return courseQuestions.filter((q) => q.topic === config.topic).length;
    case "by_difficulty":
      return courseQuestions.filter((q) => q.difficulty === config.difficulty).length;
    case "mistakes":
      return courseQuestions.filter((q) =>
        config.mistakeQuestionIds.includes(q.id)
      ).length;
    case "by_formula":
      return courseQuestions.filter(
        (q) =>
          (q.tags?.includes("formula") ?? false) ||
          q.type === "formula_gap" ||
          q.type === "flashcard_self_check" ||
          q.presentation === "formula"
      ).length;
    case "by_units":
      return courseQuestions.filter(
        (q) =>
          (q.tags?.includes("unit") ?? false) ||
          q.numericConfig?.kind === "unit_conversion"
      ).length;
    case "by_mental":
      return courseQuestions.filter(
        (q) =>
          (q.tags?.includes("mental") ?? false) ||
          q.numericConfig?.kind === "mental_formula_problem"
      ).length;
    case "by_gap":
      return courseQuestions.filter(
        (q) =>
          q.type === "formula_gap" ||
          (q.tags?.includes("gap") ?? false)
      ).length;
    case "by_blitz":
      return courseQuestions.filter(
        (q) =>
          q.type === "formula_gap" ||
          q.type === "numeric_input" ||
          q.type === "flashcard_self_check" ||
          q.type === "single_choice"
      ).length;
    default:
      return 0;
  }
}

// -----------------------------------------------------------
// Convenience helpers — read from local seed for quick UI rendering
// These are used by practice page for mode selection UI
// -----------------------------------------------------------

/** Get count of formula questions for a specific course (from local seed) */
export function getAvailableFormulaCount(courseId: CourseId): number {
  return getQuestionsByCourseId(courseId).filter(
    (q) =>
      (q.tags?.includes("formula") ?? false) ||
      q.type === "formula_gap" ||
      q.type === "flashcard_self_check" ||
      q.presentation === "formula"
  ).length;
}

/** Get count of unit conversion questions for a specific course (from local seed) */
export function getAvailableUnitsCount(courseId: CourseId): number {
  return getQuestionsByCourseId(courseId).filter(
    (q) =>
      (q.tags?.includes("unit") ?? false) ||
      q.numericConfig?.kind === "unit_conversion"
  ).length;
}

/** Get count of mental math questions for a specific course (from local seed) */
export function getAvailableMentalCount(courseId: CourseId): number {
  return getQuestionsByCourseId(courseId).filter(
    (q) =>
      (q.tags?.includes("mental") ?? false) ||
      q.numericConfig?.kind === "mental_formula_problem"
  ).length;
}

/** Get count of formula gap (fill-in) questions for a specific course (from local seed) */
export function getAvailableGapCount(courseId: CourseId): number {
  return getQuestionsByCourseId(courseId).filter(
    (q) =>
      q.type === "formula_gap" ||
      (q.tags?.includes("gap") ?? false)
  ).length;
}

/** Get count of blitz questions for a specific course (from local seed) */
export function getAvailableBlitzCount(courseId: CourseId): number {
  return getQuestionsByCourseId(courseId).filter(
    (q) =>
      q.type === "formula_gap" ||
      q.type === "numeric_input" ||
      q.type === "flashcard_self_check" ||
      q.type === "single_choice"
  ).length;
}

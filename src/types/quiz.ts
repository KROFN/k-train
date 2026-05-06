// ============================================================
// Domain types for the multi-course study trainer quiz engine
// Phase 12: Extended with formula_gap, numeric_input, flashcard_self_check
// Phase 11: Extended with courseId, subject, exam; examNumber is optional
// ============================================================

import type { CourseId, Subject, ExamKind } from "./course";

/** Supported question interaction types */
export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "text_input"
  | "matching"
  | "formula_gap"
  | "numeric_input"
  | "flashcard_self_check";

/** Difficulty levels */
export type QuestionDifficulty = "easy" | "medium" | "hard";

/** Quiz session status — explicit state machine */
export type QuizStatus =
  | "idle"
  | "loading"
  | "active"
  | "answering"
  | "checking"
  | "result"
  | "completed"
  | "error";

/** How the question prompt is visually presented */
export type QuestionPresentation =
  | "default"
  | "formula"
  | "compact"
  | "card";

// -----------------------------------------------------------
// Formula template model (for formula_gap questions)
// -----------------------------------------------------------

export type FormulaTemplatePart =
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "slot";
      slotId: string;
      placeholder?: string;
    };

export type FormulaTemplate = {
  parts: FormulaTemplatePart[];
};

// -----------------------------------------------------------
// Numeric config model (for numeric_input questions)
// -----------------------------------------------------------

export type NumericQuestionKind =
  | "plain"
  | "unit_conversion"
  | "mental_formula_problem";

export type NumericConfig = {
  kind: NumericQuestionKind;
  expectedUnit?: string;
  acceptedUnits?: string[];
  tolerance?: number;
};

// -----------------------------------------------------------
// Question-related types
// -----------------------------------------------------------

export type QuestionOption = {
  id: string;
  text: string;
};

export type MatchingPair = {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
};

export type CorrectAnswer =
  | { type: "single"; value: string }
  | { type: "multiple"; value: string[]; orderMatters?: boolean }
  | {
      type: "text";
      value: string | string[];
      normalize?: "strict" | "lowercase" | "no_spaces" | "ege_sequence";
    }
  | { type: "matching"; value: Record<string, string> }
  | {
      type: "numeric";
      value: number;
      unit?: string;
      acceptedUnits?: string[];
      tolerance?: number;
    }
  | { type: "slots"; value: Record<string, string> }
  | { type: "self_check"; value: "known" };

export type UserAnswer =
  | { type: "single"; value: string | null }
  | { type: "multiple"; value: string[] }
  | { type: "text"; value: string }
  | { type: "matching"; value: Record<string, string> }
  | { type: "numeric"; value: string }
  | { type: "slots"; value: Record<string, string> }
  | { type: "self_check"; value: "known" | "unknown" };

export type QuestionExplanation = {
  short: string;
  detailed?: string;
  rule?: string;
  examples?: string[];
  /** For flashcard_self_check: the correct answer to reveal */
  answer?: string;
};

export type Question = {
  id: string;
  /** Which course this question belongs to */
  courseId: CourseId;
  /** Subject area */
  subject: Subject;
  /** Exam type (ege, oge, school) */
  exam?: ExamKind;
  /** Exam task number — optional, not all courses use numbered tasks */
  examNumber?: number;
  type: QuestionType;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  prompt: string;
  /** Visual presentation mode for the question */
  presentation?: QuestionPresentation;
  textId?: string;
  options?: QuestionOption[];
  pairs?: MatchingPair[];
  /** Formula template for formula_gap questions */
  formulaTemplate?: FormulaTemplate;
  /** Numeric config for numeric_input questions */
  numericConfig?: NumericConfig;
  correctAnswer: CorrectAnswer;
  explanation: QuestionExplanation;
  /** Tags for filtering (e.g., "formula", "unit", "mental") */
  tags?: string[];
};

// -----------------------------------------------------------
// Attempt & session types
// -----------------------------------------------------------

export type QuestionAttempt = {
  id: string;
  questionId: string;
  selectedAnswer: UserAnswer;
  correctAnswer: CorrectAnswer;
  isCorrect: boolean;
  startedAt: string;
  answeredAt: string;
  timeSpentMs: number;
};

export type QuizSession = {
  id: string;
  /**
   * Course this session belongs to.
   * Sessions are course-scoped: a session for ege_russian must not be
   * displayed when the user has switched to oge_physics.
   * Optional only for legacy/backward compat — new sessions always set it.
   */
  courseId?: CourseId;
  status: QuizStatus;
  questions: Question[];
  currentIndex: number;
  currentAnswer: UserAnswer | null;
  attempts: QuestionAttempt[];
  startedAt: string;
  completedAt?: string;
  error?: string;
};

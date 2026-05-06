// ============================================================
// Progress-related types for the multi-course study trainer
// Phase 11: v2 schema with course-scoped progress
// ============================================================

import type { CourseId } from "./course";

// -----------------------------------------------------------
// Shared types
// -----------------------------------------------------------

export type TopicProgress = {
  answered: number;
  correct: number;
  accuracy: number;
  lastPracticedAt?: string;
};

export type MistakeRecord = {
  questionId: string;
  lastAttemptAt: string;
  timesWrong: number;
  resolved: boolean;
};

// -----------------------------------------------------------
// V1 progress (legacy — for migration only)
// -----------------------------------------------------------

/** @deprecated Use UserProgressV2 instead. Kept for migration from v1. */
export type UserProgressV1 = {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate: string | null;
  hearts: number;
  maxHearts: number;
  totalAnswered: number;
  totalCorrect: number;
  mistakes: MistakeRecord[];
  byExamNumber: Record<number, TopicProgress>;
  byTopic: Record<string, TopicProgress>;
};

// -----------------------------------------------------------
// V2 progress (course-scoped)
// -----------------------------------------------------------

/** Progress for a single course */
export type CourseProgress = {
  courseId: CourseId;
  xp: number;
  level: number;
  hearts: number;
  maxHearts: number;
  totalAnswered: number;
  totalCorrect: number;
  mistakes: MistakeRecord[];
  byTopic: Record<string, TopicProgress>;
  bySubtopic: Record<string, TopicProgress>;
  byExamNumber?: Record<number, TopicProgress>;
};

/** Global progress that spans all courses */
export type GlobalProgress = {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate: string | null;
};

/** Full user progress (v2 schema) */
export type UserProgressV2 = {
  schemaVersion: 2;
  selectedCourseId: CourseId;
  global: GlobalProgress;
  courses: Partial<Record<CourseId, CourseProgress>>;
};

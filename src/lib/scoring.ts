// ============================================================
// Scoring & gamification logic for multi-course study trainer
// Phase 11: Course-scoped and global-scoped scoring
// All calculations are centralized here — no business logic in UI
// ============================================================

import type {
  CourseProgress,
  TopicProgress,
  GlobalProgress,
  UserProgressV2,
} from "@/types/progress";
import { calculateNewStreak, getTodayString } from "@/lib/dates";
import { recordMistake, resolveMistake } from "@/lib/storage";

// -----------------------------------------------------------
// XP calculations
// -----------------------------------------------------------

/** XP for a single correct answer */
export const XP_CORRECT = 10;

/** XP for a wrong answer if user viewed explanation */
export const XP_WRONG_VIEWED = 2;

/**
 * Calculate XP earned from a single answer.
 */
export function calcAnswerXP(isCorrect: boolean, viewedExplanation: boolean): number {
  if (isCorrect) return XP_CORRECT;
  return viewedExplanation ? XP_WRONG_VIEWED : 0;
}

// -----------------------------------------------------------
// Level calculation
// -----------------------------------------------------------

/**
 * Calculate level from total XP.
 * Formula: level = floor(xp / 100) + 1
 */
export function calcLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

// -----------------------------------------------------------
// Hearts
// -----------------------------------------------------------

/**
 * Check if hearts are depleted (0 or less).
 */
export function isHeartsDepleted(hearts: number): boolean {
  return hearts <= 0;
}

// -----------------------------------------------------------
// Topic progress
// -----------------------------------------------------------

/**
 * Create an empty TopicProgress.
 */
export function createTopicProgress(): TopicProgress {
  return {
    answered: 0,
    correct: 0,
    accuracy: 0,
  };
}

/**
 * Update TopicProgress with a new answer.
 */
export function updateTopicProgress(
  tp: TopicProgress,
  isCorrect: boolean
): TopicProgress {
  const answered = tp.answered + 1;
  const correct = tp.correct + (isCorrect ? 1 : 0);
  return {
    answered,
    correct,
    accuracy: answered > 0 ? correct / answered : 0,
    lastPracticedAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------
// Apply answer result to CourseProgress
// -----------------------------------------------------------

/**
 * Apply a single answer result to course-scoped progress.
 * Used during the quiz for live progress updates.
 */
export function applyAnswerResultToCourse(
  course: CourseProgress,
  questionId: string,
  examNumber: number | undefined,
  topic: string,
  subtopic: string | undefined,
  isCorrect: boolean
): CourseProgress {
  // Total stats
  const newTotalAnswered = course.totalAnswered + 1;
  const newTotalCorrect = course.totalCorrect + (isCorrect ? 1 : 0);

  // XP
  const xpGain = calcAnswerXP(isCorrect, true); // Assume explanation is viewed
  const newXp = course.xp + xpGain;
  const newLevel = calcLevel(newXp);

  // Hearts
  const newHearts = isCorrect ? course.hearts : Math.max(0, course.hearts - 1);

  // By topic
  const existingTopic = course.byTopic[topic] ?? createTopicProgress();
  const newByTopic = {
    ...course.byTopic,
    [topic]: updateTopicProgress(existingTopic, isCorrect),
  };

  // By subtopic
  let newBySubtopic = { ...course.bySubtopic };
  if (subtopic) {
    const existingSubtopic = course.bySubtopic[subtopic] ?? createTopicProgress();
    newBySubtopic = {
      ...course.bySubtopic,
      [subtopic]: updateTopicProgress(existingSubtopic, isCorrect),
    };
  }

  // By exam number (optional — only if provided)
  let newByExamNumber = course.byExamNumber ? { ...course.byExamNumber } : undefined;
  if (examNumber !== undefined && newByExamNumber) {
    const existingExam = newByExamNumber[examNumber] ?? createTopicProgress();
    newByExamNumber = {
      ...newByExamNumber,
      [examNumber]: updateTopicProgress(existingExam, isCorrect),
    };
  }

  // Mistakes
  let updated = { ...course };
  if (!isCorrect) {
    updated = recordMistake(updated, questionId);
  } else {
    updated = resolveMistake(updated, questionId);
  }

  return {
    ...updated,
    xp: newXp,
    level: newLevel,
    hearts: newHearts,
    totalAnswered: newTotalAnswered,
    totalCorrect: newTotalCorrect,
    byExamNumber: newByExamNumber,
    byTopic: newByTopic,
    bySubtopic: newBySubtopic,
  };
}

// -----------------------------------------------------------
// Streak on session complete (global)
// -----------------------------------------------------------

/**
 * Apply streak update when completing a session.
 * Operates on global progress.
 */
export function applyStreakOnSessionComplete(global: GlobalProgress): GlobalProgress {
  const newStreak = calculateNewStreak(global.streak, global.lastPracticeDate);
  const todayStr = getTodayString();

  return {
    ...global,
    streak: newStreak,
    lastPracticeDate: todayStr,
  };
}

// -----------------------------------------------------------
// Accuracy
// -----------------------------------------------------------

/**
 * Get accuracy percentage as a number 0-100 for a single course.
 */
export function getCourseAccuracyPercent(course: CourseProgress): number {
  if (course.totalAnswered === 0) return 0;
  return Math.round((course.totalCorrect / course.totalAnswered) * 100);
}

/**
 * Get aggregated accuracy percentage as a number 0-100 across all courses.
 */
export function getGlobalAccuracyPercent(progress: UserProgressV2): number {
  let totalAnswered = 0;
  let totalCorrect = 0;

  for (const course of Object.values(progress.courses)) {
    totalAnswered += course.totalAnswered;
    totalCorrect += course.totalCorrect;
  }

  if (totalAnswered === 0) return 0;
  return Math.round((totalCorrect / totalAnswered) * 100);
}

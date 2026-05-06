// ============================================================
// Question service — loads questions from Supabase with local fallback
// Phase 16: Questions from Supabase with local fallback
//
// Architecture:
// - Try Supabase first (if configured)
// - Fall back to local seed data
// - Cache questions in memory per course
// - Never crash the app — always return some questions or empty array
// - Only load published questions from Supabase
// ============================================================

import type { Question } from "@/types/quiz";
import type { CourseId } from "@/types/course";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapAndValidateRows, type QuestionRow } from "@/lib/mappers/question-mapper";
import { getQuestionsByCourseId as getLocalQuestionsByCourseId } from "@/data/questions";

// -----------------------------------------------------------
// In-memory cache
// -----------------------------------------------------------

const questionCache = new Map<CourseId, Question[]>();

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map<CourseId, number>();

function isCacheValid(courseId: CourseId): boolean {
  const ts = cacheTimestamps.get(courseId);
  if (!ts) return false;
  return Date.now() - ts < CACHE_TTL;
}

function setCache(courseId: CourseId, questions: Question[]): void {
  questionCache.set(courseId, questions);
  cacheTimestamps.set(courseId, Date.now());
}

function clearCache(courseId?: CourseId): void {
  if (courseId) {
    questionCache.delete(courseId);
    cacheTimestamps.delete(courseId);
  } else {
    questionCache.clear();
    cacheTimestamps.clear();
  }
}

// -----------------------------------------------------------
// Supabase loader
// -----------------------------------------------------------

/**
 * Load questions for a course from Supabase.
 * Only loads published questions.
 * Returns null if Supabase is not configured or on error.
 */
async function getQuestionsFromSupabase(
  courseId: CourseId
): Promise<Question[] | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("questions")
      .select("*")
      .eq("course_id", courseId)
      .eq("status", "published");

    if (error) {
      console.warn(
        `[QuestionService] Supabase query failed for course "${courseId}":`,
        error.message
      );
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Map and validate rows
    const { questions, skippedCount } = mapAndValidateRows(
      data as QuestionRow[]
    );

    if (skippedCount > 0 && process.env.NODE_ENV === "development") {
      console.warn(
        `[QuestionService] Skipped ${skippedCount} invalid questions from Supabase for course "${courseId}"`
      );
    }

    return questions;
  } catch (err) {
    console.warn(
      `[QuestionService] Supabase error for course "${courseId}":`,
      err
    );
    return null;
  }
}

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------

/**
 * Get questions for a course from local seed data.
 * This is always available and never requires Supabase.
 */
export function getQuestionsFromLocalSeed(courseId: CourseId): Question[] {
  return getLocalQuestionsByCourseId(courseId);
}

/**
 * Get questions for a course from Supabase.
 * Returns null if Supabase is not configured or on any error.
 * Only returns published questions.
 */
export async function getQuestionsFromSupabaseOnly(
  courseId: CourseId
): Promise<Question[] | null> {
  return getQuestionsFromSupabase(courseId);
}

/**
 * Get questions for a course with Supabase-first + local fallback strategy.
 *
 * 1. Check in-memory cache
 * 2. Try Supabase (if configured)
 * 3. Fall back to local seed
 *
 * This is the main entry point for the app.
 */
export async function getQuestionsWithFallback(
  courseId: CourseId
): Promise<Question[]> {
  // 1. Check cache
  if (isCacheValid(courseId)) {
    const cached = questionCache.get(courseId);
    if (cached) return cached;
  }

  // 2. Try Supabase
  const supabaseQuestions = await getQuestionsFromSupabase(courseId);
  if (supabaseQuestions && supabaseQuestions.length > 0) {
    setCache(courseId, supabaseQuestions);
    return supabaseQuestions;
  }

  // 3. Fall back to local seed
  const localQuestions = getQuestionsFromLocalSeed(courseId);
  setCache(courseId, localQuestions);
  return localQuestions;
}

/**
 * Synchronous version — always returns local seed data.
 * Use this for UI rendering where async is not convenient.
 * For the full Supabase+fallback experience, use getQuestionsWithFallback() instead.
 */
export function getQuestionsSync(courseId: CourseId): Question[] {
  // Check cache first (may have been populated by async call)
  if (isCacheValid(courseId)) {
    const cached = questionCache.get(courseId);
    if (cached) return cached;
  }

  // Fall back to local seed
  return getQuestionsFromLocalSeed(courseId);
}

/**
 * Get all questions for all courses (local seed only).
 * Used for metadata queries that need all questions at once.
 */
export function getAllQuestionsSync(): Question[] {
  const courses: CourseId[] = ["ege_russian", "oge_physics", "belenkova_math"];
  const all: Question[] = [];
  for (const courseId of courses) {
    all.push(...getQuestionsSync(courseId));
  }
  return all;
}

/**
 * Preload questions for a course (e.g., on app startup or course selection).
 * This populates the cache so subsequent calls are fast.
 */
export async function preloadQuestions(courseId: CourseId): Promise<void> {
  await getQuestionsWithFallback(courseId);
}

/**
 * Invalidate the question cache for a specific course or all courses.
 * Call this when the user changes course or after uploading new questions.
 */
export function invalidateQuestionCache(courseId?: CourseId): void {
  clearCache(courseId);
}

// -----------------------------------------------------------
// Metadata helpers (operate on questions array)
// These replace the direct imports from @/data/questions
// -----------------------------------------------------------

/** Get unique exam numbers for a course's questions */
export function getExamNumbersFromQuestions(questions: Question[]): number[] {
  const nums = new Set<number>();
  for (const q of questions) {
    if (q.examNumber !== undefined) {
      nums.add(q.examNumber);
    }
  }
  return Array.from(nums).sort((a, b) => a - b);
}

/** Get unique topics for a course's questions */
export function getTopicsFromQuestions(questions: Question[]): string[] {
  const topics = new Set<string>();
  for (const q of questions) {
    topics.add(q.topic);
  }
  return Array.from(topics).sort();
}

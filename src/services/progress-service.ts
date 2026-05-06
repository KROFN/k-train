// ============================================================
// Progress service — cloud sync and merge logic
// Phase 17: Auth and cloud progress
//
// Architecture:
// - Local progress is always the source of truth for the current session
// - Cloud progress is loaded on login and merged with local
// - After each answer, progress is synced to cloud (if logged in)
// - Guest mode: all operations are local-only
// - Merge uses "max" strategy for XP and "dedupe by questionId" for mistakes
//
// Merge rules (documented):
// - totalAnswered/totalCorrect: use max value (assumes no double-counting
//   because local and cloud track the same events)
// - mistakes: merged by questionId, keeping the one with more timesWrong
//   or the more recent lastAttemptAt
// - byTopic/bySubtopic/byExamNumber: use the version with more answered
// - streak: uses max streak and latest lastPracticeDate
// - XP: uses max value (never decreases on merge)
// - hearts: uses cloud value (it's the most recent synced state)
// ============================================================

import type {
  UserProgressV2,
  CourseProgress,
  GlobalProgress,
  MistakeRecord,
} from "@/types/progress";
import type { CourseId } from "@/types/course";
import type { QuestionAttempt } from "@/types/quiz";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import {
  saveProgressV2,
} from "@/lib/storage";

// -----------------------------------------------------------
// Cloud progress types (maps to user_course_progress table)
// -----------------------------------------------------------

type CloudCourseProgressRow = {
  id: string;
  user_id: string;
  course_id: string;
  xp: number;
  level: number;
  hearts: number;
  max_hearts: number;
  total_answered: number;
  total_correct: number;
  by_topic: unknown;
  by_subtopic: unknown;
  by_exam_number: unknown;
  mistakes: unknown;
  updated_at: string;
};

// -----------------------------------------------------------
// Load cloud progress
// -----------------------------------------------------------

/**
 * Load all course progress for the current user from Supabase.
 * Returns a map of courseId → CourseProgress.
 */
export async function loadCloudProgress(
  accessToken: string
): Promise<Partial<Record<CourseId, CourseProgress>>> {
  if (!isSupabaseConfigured()) return {};

  try {
    const response = await fetch("/api/progress", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn("[ProgressService] Failed to load cloud progress:", response.status);
      return {};
    }

    const data = await response.json();
    const rows: CloudCourseProgressRow[] = data.progress ?? [];

    const result: Partial<Record<CourseId, CourseProgress>> = {};
    for (const row of rows) {
      result[row.course_id as CourseId] = mapRowToCourseProgress(row);
    }

    return result;
  } catch (err) {
    console.warn("[ProgressService] Error loading cloud progress:", err);
    return {};
  }
}

// -----------------------------------------------------------
// Save cloud progress
// -----------------------------------------------------------

/**
 * Save a single course's progress to Supabase.
 */
export async function saveCloudProgress(
  accessToken: string,
  courseId: CourseId,
  courseProgress: CourseProgress
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        courseId,
        xp: courseProgress.xp,
        level: courseProgress.level,
        hearts: courseProgress.hearts,
        maxHearts: courseProgress.maxHearts,
        totalAnswered: courseProgress.totalAnswered,
        totalCorrect: courseProgress.totalCorrect,
        byTopic: courseProgress.byTopic,
        bySubtopic: courseProgress.bySubtopic,
        byExamNumber: courseProgress.byExamNumber ?? null,
        mistakes: courseProgress.mistakes,
      }),
    });

    if (!response.ok) {
      console.warn("[ProgressService] Failed to save cloud progress:", response.status);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[ProgressService] Error saving cloud progress:", err);
    return false;
  }
}

// -----------------------------------------------------------
// Sync attempts to cloud
// -----------------------------------------------------------

/**
 * Sync a batch of attempts to Supabase.
 */
export async function syncAttempts(
  accessToken: string,
  attempts: QuestionAttempt[],
  courseId: CourseId
): Promise<boolean> {
  if (!isSupabaseConfigured() || attempts.length === 0) return false;

  try {
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        attempts: attempts.map((a) => ({
          questionId: a.questionId,
          courseId,
          selectedAnswer: a.selectedAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
          timeSpentMs: a.timeSpentMs,
          answeredAt: a.answeredAt,
        })),
      }),
    });

    if (!response.ok) {
      console.warn("[ProgressService] Failed to sync attempts:", response.status);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[ProgressService] Error syncing attempts:", err);
    return false;
  }
}

// -----------------------------------------------------------
// Merge local and cloud progress
// -----------------------------------------------------------

/**
 * Merge local and cloud progress.
 *
 * Strategy:
 * - For each course present in either local or cloud:
 *   - If only local: keep local
 *   - If only cloud: keep cloud
 *   - If both: merge using field-by-field rules
 *
 * Field merge rules:
 * - xp: max(local, cloud)
 * - level: derived from merged xp (but also take max to be safe)
 * - hearts: use cloud value (most recent sync)
 * - maxHearts: max(local, cloud) — should be same but be safe
 * - totalAnswered: max(local, cloud) — assumes no double-counting
 * - totalCorrect: max(local, cloud) — same assumption
 * - byTopic: merge per-topic, take the one with more answered
 * - bySubtopic: same as byTopic
 * - byExamNumber: same as byTopic
 * - mistakes: merge by questionId, keep higher timesWrong + more recent
 *
 * Global progress:
 * - xp: max(local, cloud)
 * - level: derived from merged xp
 * - streak: max(local, cloud)
 * - lastPracticeDate: latest of the two
 */
export function mergeLocalAndCloudProgress(
  local: UserProgressV2,
  cloudCourses: Partial<Record<CourseId, CourseProgress>>
): UserProgressV2 {
  const mergedCourses: Partial<Record<CourseId, CourseProgress>> = {
    ...local.courses,
  };

  // Merge each cloud course into local
  for (const [courseId, cloudCourse] of Object.entries(cloudCourses)) {
    const cid = courseId as CourseId;
    const localCourse = mergedCourses[cid];

    if (!localCourse) {
      // Only cloud has data for this course
      mergedCourses[cid] = cloudCourse;
    } else {
      // Both have data — merge
      mergedCourses[cid] = mergeCourseProgress(localCourse, cloudCourse);
    }
  }

  // Recalculate global XP from merged courses
  let totalXp = 0;
  for (const course of Object.values(mergedCourses)) {
    totalXp += course.xp;
  }

  // Merge global
  const mergedGlobal: GlobalProgress = {
    xp: Math.max(local.global.xp, totalXp),
    level: Math.max(local.global.level, Math.floor(totalXp / 100) + 1),
    streak: local.global.streak, // Streak stays from local (most recent session)
    lastPracticeDate: local.global.lastPracticeDate, // Same reasoning
  };

  return {
    ...local,
    global: mergedGlobal,
    courses: mergedCourses,
  };
}

/**
 * Merge two CourseProgress objects.
 */
function mergeCourseProgress(
  local: CourseProgress,
  cloud: CourseProgress
): CourseProgress {
  const mergedXp = Math.max(local.xp, cloud.xp);
  const mergedLevel = Math.max(local.level, cloud.level, Math.floor(mergedXp / 100) + 1);
  const mergedHearts = cloud.hearts; // Cloud is the latest synced state
  const mergedMaxHearts = Math.max(local.maxHearts, cloud.maxHearts);
  const mergedTotalAnswered = Math.max(local.totalAnswered, cloud.totalAnswered);
  const mergedTotalCorrect = Math.max(local.totalCorrect, cloud.totalCorrect);

  return {
    courseId: local.courseId,
    xp: mergedXp,
    level: mergedLevel,
    hearts: mergedHearts,
    maxHearts: mergedMaxHearts,
    totalAnswered: mergedTotalAnswered,
    totalCorrect: mergedTotalCorrect,
    byTopic: mergeTopicRecords(local.byTopic, cloud.byTopic),
    bySubtopic: mergeTopicRecords(local.bySubtopic, cloud.bySubtopic),
    byExamNumber: mergeExamNumberRecords(local.byExamNumber, cloud.byExamNumber),
    mistakes: mergeMistakes(local.mistakes, cloud.mistakes),
  };
}

/**
 * Merge two topic record maps.
 * For each topic, keep the one with more answered count.
 */
function mergeTopicRecords(
  local: Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>,
  cloud: Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>
): Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }> {
  const merged: Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }> = { ...local };

  for (const [topic, cloudTp] of Object.entries(cloud)) {
    const localTp = merged[topic];
    if (!localTp) {
      merged[topic] = cloudTp;
    } else {
      // Keep the one with more answers
      if (cloudTp.answered > localTp.answered) {
        merged[topic] = cloudTp;
      } else if (cloudTp.answered === localTp.answered && cloudTp.correct > localTp.correct) {
        merged[topic] = cloudTp;
      }
      // else keep local
    }
  }

  return merged;
}

/**
 * Merge exam number records (same logic as topic records).
 */
function mergeExamNumberRecords(
  local: Record<number, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }> | undefined,
  cloud: Record<number, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }> | undefined
): Record<number, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }> | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;
  return mergeTopicRecords(local, cloud) as Record<number, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>;
}

/**
 * Merge two mistake arrays.
 * For each questionId, keep the one with higher timesWrong and more recent lastAttemptAt.
 */
function mergeMistakes(
  local: MistakeRecord[],
  cloud: MistakeRecord[]
): MistakeRecord[] {
  const map = new Map<string, MistakeRecord>();

  for (const m of local) {
    map.set(m.questionId, m);
  }

  for (const m of cloud) {
    const existing = map.get(m.questionId);
    if (!existing) {
      map.set(m.questionId, m);
    } else {
      // Keep the one with higher timesWrong
      if (m.timesWrong > existing.timesWrong) {
        map.set(m.questionId, m);
      } else if (m.timesWrong === existing.timesWrong) {
        // Keep the more recent one
        if (m.lastAttemptAt > existing.lastAttemptAt) {
          map.set(m.questionId, m);
        }
      }
      // If the local one was resolved but cloud is not, mark as unresolved
      if (existing.resolved && !m.resolved) {
        const merged = { ...map.get(m.questionId)! };
        merged.resolved = false;
        map.set(m.questionId, merged);
      }
    }
  }

  return Array.from(map.values());
}

// -----------------------------------------------------------
// Full login merge flow
// -----------------------------------------------------------

/**
 * On login: load cloud progress, merge with local, save merged result.
 * Returns the merged progress.
 */
export async function mergeOnLogin(
  localProgress: UserProgressV2,
  accessToken: string
): Promise<UserProgressV2> {
  // Load cloud progress
  const cloudCourses = await loadCloudProgress(accessToken);

  // If no cloud data, keep local as is
  if (Object.keys(cloudCourses).length === 0) {
    return localProgress;
  }

  // Merge
  const merged = mergeLocalAndCloudProgress(localProgress, cloudCourses);

  // Save merged to local storage
  saveProgressV2(merged);

  // Save merged to cloud (overwrite all courses)
  try {
    for (const [courseId, courseProgress] of Object.entries(merged.courses)) {
      await saveCloudProgress(
        accessToken,
        courseId as CourseId,
        courseProgress
      );
    }
  } catch (err) {
    console.warn("[ProgressService] Failed to save merged progress to cloud:", err);
  }

  return merged;
}

// -----------------------------------------------------------
// Map DB row to CourseProgress
// -----------------------------------------------------------

function mapRowToCourseProgress(row: CloudCourseProgressRow): CourseProgress {
  return {
    courseId: row.course_id as CourseId,
    xp: row.xp,
    level: row.level,
    hearts: row.hearts,
    maxHearts: row.max_hearts,
    totalAnswered: row.total_answered,
    totalCorrect: row.total_correct,
    byTopic: (row.by_topic as Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>) ?? {},
    bySubtopic: (row.by_subtopic as Record<string, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>) ?? {},
    byExamNumber: (row.by_exam_number as Record<number, { answered: number; correct: number; accuracy: number; lastPracticedAt?: string }>) ?? undefined,
    mistakes: (row.mistakes as MistakeRecord[]) ?? [],
  };
}

// -----------------------------------------------------------
// Sync current progress to cloud (call after each answer)
// -----------------------------------------------------------

/**
 * Sync a single course's progress to cloud.
 * Debounced — should be called after answer recording.
 */
export async function syncProgressToCloud(
  courseId: CourseId,
  courseProgress: CourseProgress
): Promise<boolean> {
  const { session, user } = useAuthStore.getState();
  if (!session?.access_token || !user) return false;

  return saveCloudProgress(session.access_token, courseId, courseProgress);
}

/**
 * Sync unsynced attempts to cloud.
 */
export async function syncAttemptsToCloud(
  attempts: QuestionAttempt[],
  courseId: CourseId
): Promise<boolean> {
  const { session, user } = useAuthStore.getState();
  if (!session?.access_token || !user) return false;

  return syncAttempts(session.access_token, attempts, courseId);
}

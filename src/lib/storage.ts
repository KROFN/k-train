// ============================================================
// Safe localStorage wrapper for multi-course study trainer
// Phase 11: v2 progress schema with course-scoped progress
// Never throws — broken/empty localStorage is handled gracefully
// ============================================================

import type {
  UserProgressV2,
  UserProgressV1,
  CourseProgress,
  MistakeRecord,
  GlobalProgress,
} from "@/types/progress";
import type { CourseId } from "@/types/course";
import type { QuestionAttempt } from "@/types/quiz";

// -----------------------------------------------------------
// Namespaced storage keys
// -----------------------------------------------------------

const STORAGE_KEYS = {
  progress: "study-trainer:progress:v2",
  attempts: "study-trainer:attempts:v2",
  settings: "study-trainer:settings:v2",
  courseAccess: "study-trainer:course-access:v1",
  selectedCourse: "study-trainer:selected-course:v1",
  // Old keys for migration
  legacyProgress: "ege-russian-trainer:progress",
  legacyAttempts: "ege-russian-trainer:attempts",
  legacySettings: "ege-russian-trainer:settings",
} as const;

// -----------------------------------------------------------
// Default values
// -----------------------------------------------------------

export const DEFAULT_HEARTS = 5;

/** Create default progress for a single course */
export function createDefaultCourseProgress(courseId: CourseId): CourseProgress {
  return {
    courseId,
    xp: 0,
    level: 1,
    hearts: DEFAULT_HEARTS,
    maxHearts: DEFAULT_HEARTS,
    totalAnswered: 0,
    totalCorrect: 0,
    mistakes: [],
    byTopic: {},
    bySubtopic: {},
    byExamNumber: {},
  };
}

/** Create default global progress (streak, overall XP/level) */
export function createDefaultGlobalProgress(): GlobalProgress {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastPracticeDate: null,
  };
}

/** Create default v2 user progress with ege_russian as the initial course */
export function createDefaultProgressV2(): UserProgressV2 {
  return {
    schemaVersion: 2,
    selectedCourseId: "ege_russian",
    global: createDefaultGlobalProgress(),
    courses: {
      ege_russian: createDefaultCourseProgress("ege_russian"),
    },
  };
}

// -----------------------------------------------------------
// Low-level safe helpers
// -----------------------------------------------------------

/** Safely read and parse JSON from localStorage. Returns null on any error. */
function safeGetItem<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted JSON, storage unavailable, etc.
    console.warn(`[Storage] Failed to read key "${key}": corrupted or unavailable`);
    return null;
  }
}

/** Safely serialize and write JSON to localStorage. Returns false on error. */
function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded, storage unavailable, etc.
    console.warn(`[Storage] Failed to write key "${key}": quota or access error`);
    return false;
  }
}

/** Remove a key from localStorage. */
function safeRemoveItem(key: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// -----------------------------------------------------------
// Course progress merge helper
// -----------------------------------------------------------

/**
 * Merge a stored CourseProgress with defaults.
 * Ensures all fields introduced in later phases (bySubtopic, etc.)
 * are present even if the stored object pre-dates them.
 */
function mergeCourseProgressWithDefaults(
  stored: Partial<CourseProgress>,
  courseId: CourseId
): CourseProgress {
  const defaults = createDefaultCourseProgress(courseId);
  return {
    ...defaults,
    ...stored,
    // Always ensure these objects are defined, never undefined
    byTopic: stored.byTopic ?? defaults.byTopic,
    bySubtopic: stored.bySubtopic ?? defaults.bySubtopic,
    byExamNumber: stored.byExamNumber ?? defaults.byExamNumber,
    mistakes: Array.isArray(stored.mistakes) ? stored.mistakes : defaults.mistakes,
  };
}

// -----------------------------------------------------------
// Legacy v1 progress (for migration only)
// -----------------------------------------------------------

/**
 * Load legacy v1 progress from localStorage.
 * Returns null if no legacy data exists.
 */
export function loadLegacyProgress(): UserProgressV1 | null {
  return safeGetItem<UserProgressV1>(STORAGE_KEYS.legacyProgress);
}

// -----------------------------------------------------------
// Migration
// -----------------------------------------------------------

/**
 * Migrate v1 (flat) progress to v2 (course-scoped) structure.
 * All v1 data is placed into the ege_russian course entry.
 */
export function migrateV1ToV2(old: UserProgressV1): UserProgressV2 {
  return {
    schemaVersion: 2,
    selectedCourseId: "ege_russian",
    global: {
      xp: old.xp,
      level: old.level,
      streak: old.streak,
      lastPracticeDate: old.lastPracticeDate,
    },
    courses: {
      ege_russian: mergeCourseProgressWithDefaults(
        {
          courseId: "ege_russian",
          xp: old.xp,
          level: old.level,
          hearts: old.hearts,
          maxHearts: old.maxHearts,
          totalAnswered: old.totalAnswered,
          totalCorrect: old.totalCorrect,
          mistakes: old.mistakes,
          byTopic: old.byTopic,
          bySubtopic: {},
          // Bug 1 fix: byExamNumber is optional in v1 — fall back to empty object
          byExamNumber: old.byExamNumber ?? {},
        },
        "ege_russian"
      ),
    },
  };
}

// -----------------------------------------------------------
// V2 Progress
// -----------------------------------------------------------

/**
 * Load v2 user progress from localStorage.
 * On first load, tries to migrate from old v1 key if no v2 data exists.
 * Returns default progress if storage is empty, corrupted, or has wrong structure.
 */
export function loadProgressV2(): UserProgressV2 {
  const stored = safeGetItem<UserProgressV2>(STORAGE_KEYS.progress);

  if (stored && stored.schemaVersion === 2) {
    // Validate the shape — must have core fields
    if (
      typeof stored.global?.xp === "number" &&
      typeof stored.global?.level === "number" &&
      typeof stored.global?.streak === "number" &&
      typeof stored.selectedCourseId === "string" &&
      typeof stored.courses === "object"
    ) {
      // Bug 2 fix: deep-merge each stored CourseProgress with defaults
      // so fields added in later phases (bySubtopic, etc.) are always present.
      const defaultProgress = createDefaultProgressV2();
      const mergedCourses: UserProgressV2["courses"] = {};
      for (const [courseId, courseData] of Object.entries(stored.courses)) {
        if (courseData) {
          mergedCourses[courseId as CourseId] = mergeCourseProgressWithDefaults(
            courseData,
            courseId as CourseId
          );
        }
      }

      return {
        ...defaultProgress,
        ...stored,
        global: {
          ...defaultProgress.global,
          ...stored.global,
        },
        courses: {
          ...defaultProgress.courses,
          ...mergedCourses,
        },
      };
    }

    console.warn("[Storage] V2 progress data has wrong structure, resetting to default");
    return createDefaultProgressV2();
  }

  // No v2 data — try migrating from v1
  const legacy = loadLegacyProgress();
  if (legacy) {
    try {
      if (
        typeof legacy.xp === "number" &&
        typeof legacy.level === "number" &&
        typeof legacy.streak === "number" &&
        typeof legacy.hearts === "number" &&
        typeof legacy.totalAnswered === "number" &&
        typeof legacy.totalCorrect === "number" &&
        Array.isArray(legacy.mistakes) &&
        // Bug 1 fix: byExamNumber is optional in v1 — only check it's object OR undefined
        (legacy.byExamNumber === undefined || typeof legacy.byExamNumber === "object") &&
        typeof legacy.byTopic === "object"
      ) {
        const migrated = migrateV1ToV2(legacy);
        saveProgressV2(migrated);
        if (process.env.NODE_ENV === "development") {
          console.warn("[Storage] Migrated v1 progress to v2");
        }
        return migrated;
      }
    } catch {
      // Migration failed — fall through to default
    }
  }

  return createDefaultProgressV2();
}

/** Save v2 user progress to localStorage. */
export function saveProgressV2(progress: UserProgressV2): boolean {
  return safeSetItem(STORAGE_KEYS.progress, progress);
}

// -----------------------------------------------------------
// Mistakes helpers (pure functions — operate on CourseProgress)
// -----------------------------------------------------------

/**
 * Record a mistake for a question in the given course progress.
 * If the mistake already exists, increment timesWrong and mark as unresolved.
 * Otherwise, append a new MistakeRecord.
 */
export function recordMistake(
  course: CourseProgress,
  questionId: string
): CourseProgress {
  const now = new Date().toISOString();
  const existing = course.mistakes.find((m) => m.questionId === questionId);

  const mistakes = existing
    ? course.mistakes.map((m) =>
        m.questionId === questionId
          ? {
              ...m,
              timesWrong: m.timesWrong + 1,
              lastAttemptAt: now,
              resolved: false,
            }
          : m
      )
    : [
        ...course.mistakes,
        {
          questionId,
          lastAttemptAt: now,
          timesWrong: 1,
          resolved: false,
        },
      ];

  return {
    ...course,
    mistakes,
  };
}

/**
 * Mark a previously-recorded mistake as resolved (correct answer given).
 * No-op if no such mistake exists.
 */
export function resolveMistake(
  course: CourseProgress,
  questionId: string
): CourseProgress {
  return {
    ...course,
    mistakes: course.mistakes.map((m) =>
      m.questionId === questionId ? { ...m, resolved: true } : m
    ),
  };
}

/** Return only unresolved mistakes from a course progress. */
export function getUnresolvedMistakes(course: CourseProgress): MistakeRecord[] {
  return course.mistakes.filter((m) => !m.resolved);
}

// -----------------------------------------------------------
// Attempts
// -----------------------------------------------------------

/** Load attempt history from localStorage. */
export function loadAttempts(): QuestionAttempt[] {
  const stored = safeGetItem<QuestionAttempt[]>(STORAGE_KEYS.attempts);

  if (!stored) return [];

  if (!Array.isArray(stored)) {
    console.warn("[Storage] Attempts data has wrong structure, returning empty");
    return [];
  }

  return stored;
}

/** Save attempt history to localStorage. */
export function saveAttempts(attempts: QuestionAttempt[]): boolean {
  return safeSetItem(STORAGE_KEYS.attempts, attempts);
}

// -----------------------------------------------------------
// Settings
// -----------------------------------------------------------

export type UserSettings = {
  /** Whether to show hearts UI */
  showHearts: boolean;
};

export function createDefaultSettings(): UserSettings {
  return {
    showHearts: true,
  };
}

/** Load user settings from localStorage. */
export function loadSettings(): UserSettings {
  const stored = safeGetItem<UserSettings>(STORAGE_KEYS.settings);

  if (!stored) return createDefaultSettings();

  return {
    ...createDefaultSettings(),
    ...stored,
  };
}

/** Save user settings to localStorage. */
export function saveSettings(settings: UserSettings): boolean {
  return safeSetItem(STORAGE_KEYS.settings, settings);
}

// -----------------------------------------------------------
// Course access
// -----------------------------------------------------------

/** Load course access/unlock state from localStorage. */
export function loadCourseAccess(): Record<string, boolean> {
  const stored = safeGetItem<Record<string, boolean>>(STORAGE_KEYS.courseAccess);

  if (!stored || typeof stored !== "object") return {};

  return stored;
}

/** Save course access/unlock state to localStorage. */
export function saveCourseAccess(access: Record<string, boolean>): boolean {
  return safeSetItem(STORAGE_KEYS.courseAccess, access);
}

// -----------------------------------------------------------
// Reset
// -----------------------------------------------------------

/**
 * Reset all stored data — progress, attempts, settings, course access,
 * selected course (both v2 and legacy keys).
 *
 * Also synchronously dispatches in-memory resets to:
 *   - course-access-store (re-locks all locked courses)
 *   - course-store (selectedCourseId → ege_russian, cancels quiz session)
 *   - quiz-store (drops any active session)
 *
 * Dynamic imports are used to avoid circular dependencies between
 * storage.ts and the zustand stores.
 */
export function resetProgress(): boolean {
  // New keys
  safeRemoveItem(STORAGE_KEYS.progress);
  safeRemoveItem(STORAGE_KEYS.attempts);
  safeRemoveItem(STORAGE_KEYS.settings);
  safeRemoveItem(STORAGE_KEYS.courseAccess);
  // QA fix: also drop persisted selected course so reset is fully clean.
  safeRemoveItem(STORAGE_KEYS.selectedCourse);
  // Legacy keys
  safeRemoveItem(STORAGE_KEYS.legacyProgress);
  safeRemoveItem(STORAGE_KEYS.legacyAttempts);
  safeRemoveItem(STORAGE_KEYS.legacySettings);

  // QA fix: synchronize in-memory store state with the now-empty
  // localStorage, so previously-unlocked locked courses (Belenkova) become
  // locked again immediately, and any active quiz session is dropped.
  if (typeof window !== "undefined") {
    Promise.allSettled([
      import("@/store/course-access-store").then(({ useCourseAccessStore }) => {
        useCourseAccessStore.getState().reset();
      }),
      import("@/store/course-store").then(({ useCourseStore }) => {
        useCourseStore.getState().reset();
      }),
      import("@/store/quiz-store").then(({ useQuizStore }) => {
        useQuizStore.getState().resetSession();
      }),
    ]).catch(() => {
      // Ignore — best-effort
    });
  }

  return true;
}

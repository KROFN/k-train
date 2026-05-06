// ============================================================
// Zustand progress store for multi-course study trainer
// Phase 11: v2 schema with course-scoped progress
// Phase 17: Cloud sync integration
// Persists to localStorage via src/lib/storage.ts
// Syncs to Supabase for logged-in users
// ============================================================

import { create } from "zustand";
import type { UserProgressV2, CourseProgress, MistakeRecord } from "@/types/progress";
import type { CourseId } from "@/types/course";
import type { QuestionAttempt } from "@/types/quiz";
import {
  loadProgressV2,
  saveProgressV2,
  resetProgress as resetStorage,
  loadAttempts,
  saveAttempts,
  getUnresolvedMistakes,
  createDefaultProgressV2,
  createDefaultCourseProgress,
} from "@/lib/storage";
import {
  applyAnswerResultToCourse,
  applyStreakOnSessionComplete,
  getCourseAccuracyPercent,
  isHeartsDepleted,
} from "@/lib/scoring";
import { useCourseStore } from "@/store/course-store";
import { syncProgressToCloud, mergeOnLogin } from "@/services/progress-service";
import { useAuthStore } from "@/store/auth-store";

// -----------------------------------------------------------
// 🧊 HEARTS_FROZEN — Feature flag
// Hearts are temporarily frozen (always full, never depleted).
// Set to false when hearts system is fully implemented.
// -----------------------------------------------------------
export const HEARTS_FROZEN = true;

// -----------------------------------------------------------
// Store interface
// -----------------------------------------------------------

export type ProgressStore = {
  /** Current user progress (v2 — course-scoped) */
  progress: UserProgressV2;

  /** Attempt history */
  attempts: QuestionAttempt[];

  /** Whether the store has been hydrated from localStorage */
  hydrated: boolean;

  // ---- Actions ----

  /** Hydrate the store from localStorage (call once on mount) */
  hydrate: () => void;

  /** Record a single answer result for the current selected course */
  recordAnswer: (
    questionId: string,
    examNumber: number | undefined,
    topic: string,
    subtopic: string | undefined,
    isCorrect: boolean,
    attempt: QuestionAttempt
  ) => void;

  /** Apply streak update when a session is completed */
  completeSession: () => void;

  /** Add an attempt to history */
  addAttempt: (attempt: QuestionAttempt) => void;

  /** Reset all progress and attempts */
  reset: () => void;

  /** Get CourseProgress for a specific course */
  getCourseProgress: (courseId: CourseId) => CourseProgress;

  /** Get CourseProgress for the currently selected course */
  getCurrentCourseProgress: () => CourseProgress;

  // ---- Selectors ----

  /** Get global XP */
  getXp: () => number;

  /** Get global level */
  getLevel: () => number;

  /** Get global streak */
  getStreak: () => number;

  /**
   * Get hearts for the current course.
   * 🧊 FROZEN: always returns maxHearts while HEARTS_FROZEN = true.
   */
  getHearts: () => number;

  /**
   * Check if hearts are depleted for the current course.
   * 🧊 FROZEN: always returns false while HEARTS_FROZEN = true.
   */
  isHeartsDepleted: () => boolean;

  /** Get accuracy percentage (0-100) for the current course */
  getAccuracyPercent: () => number;

  /**
   * Get unresolved mistakes for the current course.
   * WARNING: Do NOT use as a Zustand selector like `useProgressStore((s) => s.getUnresolvedMistakes())`
   * — it returns a new array on every call, causing infinite re-renders.
   * Instead, use `useProgressStore((s) => s.progress.courses[courseId].mistakes)` + `useMemo` to filter.
   */
  getUnresolvedMistakes: () => MistakeRecord[];

  /** Get accuracy percentage (0-100) for a specific course */
  getCourseAccuracyPercent: (courseId: CourseId) => number;

  // ---- Cloud sync (Phase 17) ----

  /** Replace progress with merged result (called after login merge) */
  setProgress: (progress: UserProgressV2) => void;

  /** Sync current course progress to cloud (if logged in) */
  syncCurrentCourseToCloud: () => Promise<void>;

  /** Merge local and cloud progress on login */
  mergeOnLogin: (accessToken: string) => Promise<void>;
};

// -----------------------------------------------------------
// Store implementation
// -----------------------------------------------------------

export const useProgressStore = create<ProgressStore>((set, get) => ({
  // Default state — will be hydrated from localStorage
  progress: createDefaultProgressV2(),
  attempts: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const progress = loadProgressV2();
    const attempts = loadAttempts();
    set({ progress, attempts, hydrated: true });
  },

  recordAnswer: (questionId, examNumber, topic, subtopic, isCorrect, attempt) => {
    const current = get().progress;
    const selectedCourseId = useCourseStore.getState().selectedCourseId;

    // Apply answer to the course-scoped progress
    const updatedCourse = applyAnswerResultToCourse(
      current.courses[selectedCourseId] ?? createDefaultCourseProgress(selectedCourseId),
      questionId,
      examNumber,
      topic,
      subtopic,
      isCorrect
    );

    // Build the updated progress with modified course and global stats
    const updated: UserProgressV2 = {
      ...current,
      courses: {
        ...current.courses,
        [selectedCourseId]: updatedCourse,
      },
    };

    saveProgressV2(updated);

    const newAttempts = [...get().attempts, attempt];
    saveAttempts(newAttempts);

    set({ progress: updated, attempts: newAttempts });
  },

  completeSession: () => {
    const current = get().progress;
    const updatedGlobal = applyStreakOnSessionComplete(current.global);
    const updated: UserProgressV2 = {
      ...current,
      global: updatedGlobal,
    };
    saveProgressV2(updated);
    set({ progress: updated });
  },

  addAttempt: (attempt) => {
    const newAttempts = [...get().attempts, attempt];
    saveAttempts(newAttempts);
    set({ attempts: newAttempts });
  },

  reset: () => {
    resetStorage();
    set({
      progress: createDefaultProgressV2(),
      attempts: [],
    });
  },

  getCourseProgress: (courseId: CourseId) => {
    const courses = get().progress.courses;
    return courses[courseId] ?? createDefaultCourseProgress(courseId);
  },

  getCurrentCourseProgress: () => {
    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courses = get().progress.courses;
    return courses[selectedCourseId] ?? createDefaultCourseProgress(selectedCourseId);
  },

  // Selectors

  getXp: () => get().progress.global.xp,

  getLevel: () => get().progress.global.level,

  getStreak: () => get().progress.global.streak,

  getHearts: () => {
    // 🧊 FROZEN: hearts system is not yet fully implemented.
    // Always return maxHearts so the user is never blocked by hearts.
    if (HEARTS_FROZEN) return 5;

    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courseProgress = get().progress.courses[selectedCourseId];
    return courseProgress?.hearts ?? 5;
  },

  isHeartsDepleted: () => {
    // 🧊 FROZEN: hearts can never be depleted while frozen.
    if (HEARTS_FROZEN) return false;

    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courseProgress = get().progress.courses[selectedCourseId];
    return isHeartsDepleted(courseProgress?.hearts ?? 5);
  },

  getAccuracyPercent: () => {
    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courseProgress = get().progress.courses[selectedCourseId];
    if (!courseProgress) return 0;
    return getCourseAccuracyPercent(courseProgress);
  },

  getUnresolvedMistakes: () => {
    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courseProgress = get().progress.courses[selectedCourseId];
    if (!courseProgress) return [];
    return getUnresolvedMistakes(courseProgress);
  },

  getCourseAccuracyPercent: (courseId: CourseId) => {
    const courseProgress = get().progress.courses[courseId];
    if (!courseProgress) return 0;
    return getCourseAccuracyPercent(courseProgress);
  },

  // ---- Cloud sync implementations ----

  setProgress: (progress: UserProgressV2) => {
    saveProgressV2(progress);
    set({ progress });
  },

  syncCurrentCourseToCloud: async () => {
    const { user, session } = useAuthStore.getState();
    if (!user || !session?.access_token) return;

    const selectedCourseId = useCourseStore.getState().selectedCourseId;
    const courseProgress = get().progress.courses[selectedCourseId];
    if (!courseProgress) return;

    useAuthStore.getState().setSyncStatus("syncing");
    const success = await syncProgressToCloud(selectedCourseId, courseProgress);
    useAuthStore.getState().setSyncStatus(success ? "success" : "error");
  },

  mergeOnLogin: async (accessToken: string) => {
    const localProgress = get().progress;

    useAuthStore.getState().setSyncStatus("syncing");
    try {
      const merged = await mergeOnLogin(localProgress, accessToken);
      saveProgressV2(merged);
      set({ progress: merged });
      useAuthStore.getState().setSyncStatus("success");
    } catch (err) {
      console.warn("[ProgressStore] Merge on login failed:", err);
      useAuthStore.getState().setSyncStatus("error");
    }
  },
}));

import { create } from "zustand";
import type { CourseId } from "@/types/course";
import { requiresAccessCode } from "@/lib/access-code";
import { loadCourseAccess } from "@/lib/storage";

// Storage key for selected course
const COURSE_STORAGE_KEY = "study-trainer:selected-course:v1";

function safeLoadSelectedCourse(): CourseId {
  try {
    if (typeof window === "undefined") return "ege_russian";
    const stored = localStorage.getItem(COURSE_STORAGE_KEY);
    if (stored === "ege_russian" || stored === "oge_physics" || stored === "belenkova_math") {
      return stored as CourseId;
    }
    return "ege_russian";
  } catch {
    return "ege_russian";
  }
}

function safeSaveSelectedCourse(courseId: CourseId): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(COURSE_STORAGE_KEY, courseId);
  } catch {
    // Ignore storage errors
  }
}

function safeRemoveSelectedCourse(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(COURSE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Lazily reset any active quiz session.
 * Uses a dynamic import to avoid a circular dependency between
 * course-store and quiz-store at module init time.
 */
function cancelActiveQuizSession(): void {
  if (typeof window === "undefined") return;
  import("./quiz-store")
    .then(({ useQuizStore }) => {
      try {
        useQuizStore.getState().resetSession();
      } catch {
        // Ignore — quiz store may not be initialized yet
      }
    })
    .catch(() => {
      // Ignore import errors — store may not exist in some build contexts
    });
}

export type CourseStore = {
  selectedCourseId: CourseId;
  hydrated: boolean;
  hydrate: () => void;
  setSelectedCourse: (courseId: CourseId) => void;
  getSelectedCourseId: () => CourseId;
  /** Reset selected course back to default (ege_russian) and cancel any active quiz session. */
  reset: () => void;
};

export const useCourseStore = create<CourseStore>((set, get) => ({
  selectedCourseId: "ege_russian",
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    let stored = safeLoadSelectedCourse();
    // If the stored course is locked, fall back to ege_russian
    if (requiresAccessCode(stored)) {
      const access = loadCourseAccess();
      if (!access[stored]) {
        stored = "ege_russian";
        safeSaveSelectedCourse(stored);
      }
    }
    set({ selectedCourseId: stored, hydrated: true });
  },

  setSelectedCourse: (courseId: CourseId) => {
    // Check if course requires access code
    if (requiresAccessCode(courseId)) {
      const access = loadCourseAccess();
      if (!access[courseId]) {
        // Course is locked — don't allow selection
        return;
      }
    }
    const prev = get().selectedCourseId;
    safeSaveSelectedCourse(courseId);
    set({ selectedCourseId: courseId });
    // QA fix: any active quiz session belongs to the previous course.
    // Drop it so the user can't be returned to e.g. "русский 3/10" after
    // switching to физика or Беленькова.
    if (prev !== courseId) {
      cancelActiveQuizSession();
    }
  },

  getSelectedCourseId: () => get().selectedCourseId,

  reset: () => {
    safeRemoveSelectedCourse();
    set({ selectedCourseId: "ege_russian", hydrated: true });
    cancelActiveQuizSession();
  },
}));

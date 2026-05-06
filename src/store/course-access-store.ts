// ============================================================
// Course access store — manages which locked courses are unlocked
// Phase 14: Belenkova Mode local locked MVP
//
// Unlock state is persisted to localStorage so it survives refresh.
// ⚠️ This is NOT real security — just UI-level gating.
// ============================================================

import { create } from "zustand";
import type { CourseId } from "@/types/course";
import { loadCourseAccess, saveCourseAccess } from "@/lib/storage";
import { validateAccessCode, requiresAccessCode } from "@/lib/access-code";

export type CourseAccessStore = {
  /** Map of courseId → unlocked (true) */
  access: Record<string, boolean>;
  /** Whether the store has been hydrated from localStorage */
  hydrated: boolean;

  /** Load persisted access state from localStorage */
  hydrate: () => void;
  /** Force re-read from localStorage (used after external resets). */
  rehydrate: () => void;
  /** Try to unlock a course with an access code. Returns true on success. */
  tryUnlock: (courseId: CourseId, code: string) => boolean;
  /** Check if a course is accessible (public or unlocked) */
  isAccessible: (courseId: CourseId) => boolean;
  /** Re-lock a previously unlocked course (for settings/reset) */
  relock: (courseId: CourseId) => void;
  /** Check if a course requires an access code */
  requiresCode: (courseId: CourseId) => boolean;
  /** Reset all access state (in-memory + localStorage). All locked courses become locked again. */
  reset: () => void;
};

export const useCourseAccessStore = create<CourseAccessStore>((set, get) => ({
  access: {},
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const stored = loadCourseAccess();
    set({ access: stored, hydrated: true });
  },

  rehydrate: () => {
    const stored = loadCourseAccess();
    set({ access: stored, hydrated: true });
  },

  tryUnlock: (courseId: CourseId, code: string): boolean => {
    if (!requiresAccessCode(courseId)) return true; // public courses are always accessible
    const isValid = validateAccessCode(courseId, code);
    if (isValid) {
      const newAccess = { ...get().access, [courseId]: true };
      saveCourseAccess(newAccess);
      set({ access: newAccess });
    }
    return isValid;
  },

  isAccessible: (courseId: CourseId): boolean => {
    // Public courses (no access code required) are always accessible
    if (!requiresAccessCode(courseId)) return true;
    // Locked courses require explicit unlock
    return get().access[courseId] === true;
  },

  relock: (courseId: CourseId) => {
    const newAccess = { ...get().access };
    delete newAccess[courseId];
    saveCourseAccess(newAccess);
    set({ access: newAccess });
  },

  requiresCode: (courseId: CourseId): boolean => {
    return requiresAccessCode(courseId);
  },

  reset: () => {
    // Persist empty access map and clear in-memory state.
    // After this, all locked courses (e.g. Belenkova) are locked again
    // both visually and logically.
    saveCourseAccess({});
    set({ access: {}, hydrated: true });
  },
}));

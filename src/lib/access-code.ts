// ============================================================
// Local access code system for locked courses
// Phase 14: Belenkova Mode local locked MVP
//
// ⚠️ WARNING: This is NOT real security.
// This only hides the course in the local MVP UI.
// It can be bypassed from DevTools or by reading localStorage.
// Real protection requires Supabase Auth + RLS later.
// ============================================================

import type { CourseId } from "@/types/course";

/**
 * Local access codes for locked courses.
 * These are hardcoded constants — not secure, just UI-level gating.
 */
const LOCAL_ACCESS_CODES: Record<string, string> = {
  belenkova_math: "BELENKOVA2026",
};

/**
 * Check if a course requires an access code.
 */
export function requiresAccessCode(courseId: CourseId): boolean {
  return courseId in LOCAL_ACCESS_CODES;
}

/**
 * Get the expected access code for a course.
 * Returns undefined if the course doesn't require a code.
 */
export function getAccessCode(courseId: CourseId): string | undefined {
  return LOCAL_ACCESS_CODES[courseId];
}

/**
 * Validate an access code for a course.
 * Returns true if the code matches (case-insensitive, trimmed).
 * Returns false if the course doesn't require a code or the code is wrong.
 */
export function validateAccessCode(courseId: CourseId, code: string): boolean {
  const expected = LOCAL_ACCESS_CODES[courseId];
  if (!expected) return false;
  return code.trim().toUpperCase() === expected.toUpperCase();
}

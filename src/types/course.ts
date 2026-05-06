// ============================================================
// Course-related types for the multi-course study trainer
// Phase 11: Multi-course architecture
// ============================================================

/** Unique identifier for each course */
export type CourseId =
  | "ege_russian"
  | "oge_physics"
  | "belenkova_math";

/** Subject area */
export type Subject =
  | "russian"
  | "physics"
  | "math";

/** Type of exam */
export type ExamKind =
  | "ege"
  | "oge"
  | "school";

/** Course color theme */
export type CourseColor = "blue" | "amber" | "purple" | "green" | "red";

/** Course visibility */
export type CourseVisibility = "public" | "locked";

/** Course access type */
export type CourseAccessType = "open" | "local_code" | "cloud_access";

/** Course definition */
export type Course = {
  id: CourseId;
  title: string;
  shortTitle: string;
  description: string;
  subject: Subject;
  exam?: ExamKind;
  visibility: CourseVisibility;
  accessType: CourseAccessType;
  icon: string;
  color: CourseColor;
  defaultPracticeMode: string;
};

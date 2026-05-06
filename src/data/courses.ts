import type { Course, CourseId } from "@/types/course";

export const courses: Course[] = [
  {
    id: "ege_russian",
    title: "ЕГЭ Русский язык",
    shortTitle: "Русский",
    description: "Подготовка к ЕГЭ по русскому языку",
    subject: "russian",
    exam: "ege",
    visibility: "public",
    accessType: "open",
    icon: "📝",
    color: "blue",
    defaultPracticeMode: "quick",
  },
  {
    id: "oge_physics",
    title: "ОГЭ Физика",
    shortTitle: "Физика",
    description: "Формулы, единицы и задачи по физике для ОГЭ",
    subject: "physics",
    exam: "oge",
    visibility: "public",
    accessType: "open",
    icon: "⚡",
    color: "amber",
    defaultPracticeMode: "by_formula",
  },
  {
    id: "belenkova_math",
    title: "Режим Беленьковой",
    shortTitle: "Беленькова",
    description: "Формулы и задачи по математике",
    subject: "math",
    exam: "school",
    visibility: "locked",
    accessType: "local_code",
    icon: "🧮",
    color: "purple",
    defaultPracticeMode: "by_formula",
  },
];

export function getAllCourses(): Course[] {
  return courses;
}

export function getPublicCourses(): Course[] {
  return courses.filter((c) => c.visibility === "public");
}

export function getCourseById(id: CourseId): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function isCourseUnlocked(id: CourseId): boolean {
  const course = getCourseById(id);
  if (!course) return false;
  if (course.visibility === "public") return true;
  // Locked courses require runtime access check via useCourseAccessStore
  // This static check only returns true for public courses
  return false;
}

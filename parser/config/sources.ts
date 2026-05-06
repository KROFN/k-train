// ============================================================
// Source configuration — FIPI URL mappings and subject config
// Phase 19: FIPI parser MVP
//
// Maps subjects and exam types to their FIPI project IDs.
// These IDs are used in the FIPI URL structure:
//   https://ege.fipi.ru/bank/index.php?proj={PROJECT_ID}
// ============================================================

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type FipiSubject = "russian" | "physics" | "math";
export type FipiExam = "ege" | "oge";

export type FipiSourceConfig = {
  /** FIPI project GUID */
  projectId: string;
  /** Base URL for the bank */
  baseUrl: string;
  /** Full URL to the project */
  projectUrl: string;
  /** Subject name in Russian */
  subjectNameRu: string;
  /** Maps to our courseId */
  courseId: "ege_russian" | "oge_physics" | "belenkova_math";
  /** Maps to our subject */
  subject: "russian" | "physics" | "math";
  /** Maps to our exam type */
  exam: "ege" | "oge" | "school";
};

// -----------------------------------------------------------
// EGE project IDs (from https://ege.fipi.ru/bank/)
// Extracted from the page's selectProject() onclick handlers
// -----------------------------------------------------------

const EGE_PROJECTS: Record<string, FipiSourceConfig> = {
  russian: {
    projectId: "AF0ED3F2557F8FFC4C06F80B6803FD26",
    baseUrl: "https://ege.fipi.ru/bank/",
    projectUrl:
      "https://ege.fipi.ru/bank/index.php?proj=AF0ED3F2557F8FFC4C06F80B6803FD26",
    subjectNameRu: "Русский язык",
    courseId: "ege_russian",
    subject: "russian",
    exam: "ege",
  },
  physics: {
    projectId: "BA1F39653304A5B041B656915DC36B38",
    baseUrl: "https://ege.fipi.ru/bank/",
    projectUrl:
      "https://ege.fipi.ru/bank/index.php?proj=BA1F39653304A5B041B656915DC36B38",
    subjectNameRu: "Физика",
    courseId: "oge_physics", // Note: EGE physics maps to oge_physics for now
    subject: "physics",
    exam: "ege",
  },
  math_base: {
    projectId: "E040A72A1A3DABA14C90C97E0B6EE7DC",
    baseUrl: "https://ege.fipi.ru/bank/",
    projectUrl:
      "https://ege.fipi.ru/bank/index.php?proj=E040A72A1A3DABA14C90C97E0B6EE7DC",
    subjectNameRu: "Математика. Базовый уровень",
    courseId: "belenkova_math",
    subject: "math",
    exam: "ege",
  },
  math_profile: {
    projectId: "AC437B34557F88EA4115D2F374B0A07B",
    baseUrl: "https://ege.fipi.ru/bank/",
    projectUrl:
      "https://ege.fipi.ru/bank/index.php?proj=AC437B34557F88EA4115D2F374B0A07B",
    subjectNameRu: "Математика. Профильный уровень",
    courseId: "belenkova_math",
    subject: "math",
    exam: "ege",
  },
};

// -----------------------------------------------------------
// OGE project IDs (from https://oge.fipi.ru/bank/)
// -----------------------------------------------------------

const OGE_PROJECTS: Record<string, FipiSourceConfig> = {
  russian: {
    projectId: "0CD62708049A9FB940BFBB6E0A09ECC8",
    baseUrl: "https://oge.fipi.ru/bank/",
    projectUrl:
      "https://oge.fipi.ru/bank/index.php?proj=0CD62708049A9FB940BFBB6E0A09ECC8",
    subjectNameRu: "Русский язык",
    courseId: "ege_russian", // OGE Russian still maps to ege_russian course
    subject: "russian",
    exam: "oge",
  },
  physics: {
    projectId: "B37230251B44AD1E4D5A616C96945D28",
    baseUrl: "https://oge.fipi.ru/bank/",
    projectUrl:
      "https://oge.fipi.ru/bank/index.php?proj=B37230251B44AD1E4D5A616C96945D28",
    subjectNameRu: "Физика",
    courseId: "oge_physics",
    subject: "physics",
    exam: "oge",
  },
  math: {
    projectId: "BD98FF424631BFE24D6010A4B1266CA8",
    baseUrl: "https://oge.fipi.ru/bank/",
    projectUrl:
      "https://oge.fipi.ru/bank/index.php?proj=BD98FF424631BFE24D6010A4B1266CA8",
    subjectNameRu: "Математика",
    courseId: "belenkova_math",
    subject: "math",
    exam: "oge",
  },
};

// -----------------------------------------------------------
// Topic mapping — FIPI section names to our topic names
// This is a loose mapping and may need updates as FIPI changes
// -----------------------------------------------------------

export const TOPIC_MAP: Record<string, Record<string, string>> = {
  ege_russian: {
    "Орфоэпия": "Орфоэпия",
    "Орфография": "Орфография",
    "Пунктуация": "Пунктуация",
    "Грамматика": "Грамматика",
    "Лексика": "Лексика",
    "Речь": "Речь",
    "Текст": "Текст",
    "Языковые нормы": "Языковые нормы",
    "Синтаксис": "Синтаксис",
    "Морфология": "Морфология",
    "Словообразование": "Словообразование",
    "Стилистика": "Стилистика",
    "Информационная обработка текста": "Работа с текстом",
    "Средства связи предложений": "Средства связи",
    "Типы речи": "Типы речи",
    "Смысловой анализ текста": "Анализ текста",
  },
  oge_physics: {
    "Механические явления": "Механические явления",
    "Тепловые явления": "Тепловые явления",
    "Электромагнитные явления": "Электромагнитные явления",
    "Квантовые явления": "Квантовые явления",
    "Единицы и переводы": "Единицы и переводы",
  },
};

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------

/**
 * Get the source configuration for a given subject and exam type.
 */
export function getSourceConfig(
  subject: FipiSubject,
  exam: FipiExam
): FipiSourceConfig | null {
  if (exam === "ege") {
    return EGE_PROJECTS[subject] ?? null;
  }
  if (exam === "oge") {
    return OGE_PROJECTS[subject] ?? null;
  }
  return null;
}

/**
 * Get all available source configurations.
 */
export function getAllSourceConfigs(): FipiSourceConfig[] {
  return [
    ...Object.values(EGE_PROJECTS),
    ...Object.values(OGE_PROJECTS),
  ];
}

/**
 * Map a FIPI section/group name to our topic name.
 */
export function mapTopicName(
  courseId: string,
  fipiSectionName: string
): string {
  const courseMap = TOPIC_MAP[courseId];
  if (courseMap) {
    return courseMap[fipiSectionName] ?? fipiSectionName;
  }
  return fipiSectionName;
}

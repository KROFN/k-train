// ============================================================
// Centralized answer checking for multi-course study trainer
// Business logic ONLY — no UI code here
// Phase 12: Extended with numeric, slots, self_check checkers
// ============================================================

import type {
  Question,
  UserAnswer,
  CorrectAnswer,
  QuestionOption,
  MatchingPair,
} from "@/types/quiz";

// -----------------------------------------------------------
// Result type
// -----------------------------------------------------------

export type AnswerCheckResult = {
  isCorrect: boolean;
  normalizedUserAnswer: unknown;
  normalizedCorrectAnswer: unknown;
  message?: string;
};

// -----------------------------------------------------------
// Text normalization helpers
// -----------------------------------------------------------

/** Normalize a text value according to the specified mode */
function normalizeText(
  raw: string,
  mode: "strict" | "lowercase" | "no_spaces" | "ege_sequence"
): string {
  switch (mode) {
    case "strict":
      return raw;

    case "lowercase":
      return raw.trim().toLowerCase();

    case "no_spaces":
      return raw.replace(/\s+/g, "").toLowerCase();

    case "ege_sequence":
      // Keep only digits, compare as string
      return raw.replace(/\D/g, "");

    default:
      return raw.trim().toLowerCase();
  }
}

// -----------------------------------------------------------
// Numeric parsing helper
// -----------------------------------------------------------

/**
 * Parse a numeric value from user input string.
 * - Trim whitespace
 * - Replace comma with dot
 * - Parse first number from string
 * - Returns null if no valid number found
 */
function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // Replace comma with dot
  const withDot = trimmed.replace(",", ".");

  // Try to parse a number from the string
  // Match optional sign, digits, optional decimal part
  const match = withDot.match(/^[+-]?\d+(\.\d+)?/);
  if (!match) return null;

  const parsed = parseFloat(match[0]);
  return isNaN(parsed) ? null : parsed;
}

// -----------------------------------------------------------
// Core checkAnswer
// -----------------------------------------------------------

/**
 * Check a user's answer against the correct answer for a given question.
 * Returns an AnswerCheckResult with isCorrect, normalized values, and optional message.
 * Never throws — wrong format answers return isCorrect: false with a message.
 */
export function checkAnswer(
  question: Question,
  userAnswer: UserAnswer
): AnswerCheckResult {
  // Guard: answer type must match question type
  const expectedType = questionTypeToAnswerType(question.type);
  if (userAnswer.type !== expectedType) {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer,
      normalizedCorrectAnswer: question.correctAnswer,
      message: `Неверный тип ответа: ожидался «${expectedType}», получен «${userAnswer.type}»`,
    };
  }

  const correct = question.correctAnswer;

  try {
    switch (correct.type) {
      case "single":
        return checkSingleChoice(userAnswer, correct, question.options);
      case "multiple":
        return checkMultiChoice(userAnswer, correct, question.options);
      case "text":
        return checkTextInput(userAnswer, correct);
      case "matching":
        return checkMatching(userAnswer, correct, question.pairs);
      case "numeric":
        return checkNumeric(userAnswer, correct);
      case "slots":
        return checkSlots(userAnswer, correct);
      case "self_check":
        return checkSelfCheck(userAnswer);
      default:
        return {
          isCorrect: false,
          normalizedUserAnswer: userAnswer,
          normalizedCorrectAnswer: correct,
          message: `Неизвестный тип правильного ответа: ${(correct as CorrectAnswer).type}`,
        };
    }
  } catch (err) {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer,
      normalizedCorrectAnswer: correct,
      message: `Ошибка при проверке ответа: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// -----------------------------------------------------------
// Type-specific checkers
// -----------------------------------------------------------

function checkSingleChoice(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "single" }>,
  options?: QuestionOption[]
): AnswerCheckResult {
  if (userAnswer.type !== "single") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const userValue = userAnswer.value;
  const correctValue = correct.value;

  // Null = no answer selected
  if (userValue === null) {
    return {
      isCorrect: false,
      normalizedUserAnswer: null,
      normalizedCorrectAnswer: correctValue,
      message: "Ответ не выбран",
    };
  }

  const isCorrect = userValue === correctValue;

  return {
    isCorrect,
    normalizedUserAnswer: userValue,
    normalizedCorrectAnswer: correctValue,
    message: isCorrect
      ? undefined
      : buildSingleChoiceMessage(userValue, correctValue, options),
  };
}

function checkMultiChoice(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "multiple" }>,
  options?: QuestionOption[]
): AnswerCheckResult {
  if (userAnswer.type !== "multiple") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const userSet = new Set(userAnswer.value);
  const correctSet = new Set(correct.value);

  let isCorrect: boolean;

  if (correct.orderMatters) {
    // Order matters — compare as arrays
    isCorrect =
      userAnswer.value.length === correct.value.length &&
      userAnswer.value.every((v, i) => v === correct.value[i]);
  } else {
    // Order doesn't matter — compare as sets
    isCorrect =
      userSet.size === correctSet.size &&
      [...userSet].every((v) => correctSet.has(v));
  }

  // Normalize: sort for consistent display when order doesn't matter
  const normalizedUser = correct.orderMatters
    ? userAnswer.value
    : [...userSet].sort();
  const normalizedCorrect = correct.orderMatters
    ? correct.value
    : [...correctSet].sort();

  return {
    isCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedCorrectAnswer: normalizedCorrect,
    message: isCorrect
      ? undefined
      : buildMultiChoiceMessage(
          userAnswer.value,
          correct.value,
          options,
          correct.orderMatters ?? false
        ),
  };
}

function checkTextInput(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "text" }>
): AnswerCheckResult {
  if (userAnswer.type !== "text") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const mode = correct.normalize ?? "lowercase";

  const normalizedUser = normalizeText(userAnswer.value, mode);

  // Correct answer can be a single string or an array of acceptable answers
  const acceptableAnswers = Array.isArray(correct.value)
    ? correct.value
    : [correct.value];

  const normalizedAcceptable = acceptableAnswers.map((v) =>
    normalizeText(v, mode)
  );

  const isCorrect = normalizedAcceptable.includes(normalizedUser);

  return {
    isCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedCorrectAnswer:
      normalizedAcceptable.length === 1
        ? normalizedAcceptable[0]
        : normalizedAcceptable,
    message: isCorrect
      ? undefined
      : buildTextMessage(normalizedUser, normalizedAcceptable, mode),
  };
}

function checkMatching(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "matching" }>,
  pairs?: MatchingPair[]
): AnswerCheckResult {
  if (userAnswer.type !== "matching") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const userMapping = userAnswer.value;
  const correctMapping = correct.value;

  // All left IDs from correct answer must be present and match
  const allKeys = Object.keys(correctMapping);
  let isCorrect = true;
  const mismatches: string[] = [];

  for (const key of allKeys) {
    if (userMapping[key] !== correctMapping[key]) {
      isCorrect = false;
      const userRight =
        pairs?.find((p) => p.rightId === userMapping[key])?.rightText ??
        userMapping[key];
      const correctRight =
        pairs?.find((p) => p.rightId === correctMapping[key])?.rightText ??
        correctMapping[key];
      const leftText =
        pairs?.find((p) => p.leftId === key)?.leftText ?? key;
      mismatches.push(`${leftText}: вы — «${userRight}», верно — «${correctRight}»`);
    }
  }

  // Also check: user shouldn't have extra keys that aren't in correct
  const extraKeys = Object.keys(userMapping).filter(
    (k) => !(k in correctMapping)
  );
  if (extraKeys.length > 0) {
    isCorrect = false;
  }

  return {
    isCorrect,
    normalizedUserAnswer: userMapping,
    normalizedCorrectAnswer: correctMapping,
    message: isCorrect
      ? undefined
      : mismatches.length > 0
        ? `Несовпадения: ${mismatches.join("; ")}`
        : "Соответствия не совпадают",
  };
}

function checkNumeric(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "numeric" }>
): AnswerCheckResult {
  if (userAnswer.type !== "numeric") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const parsed = parseNumericInput(userAnswer.value);

  if (parsed === null) {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Не удалось распознать число. Введите числовой ответ.",
    };
  }

  const tolerance = correct.tolerance ?? 0.01;
  const isCorrect = Math.abs(parsed - correct.value) <= tolerance;

  const unitSuffix = correct.unit ? ` ${correct.unit}` : "";

  return {
    isCorrect,
    normalizedUserAnswer: parsed,
    normalizedCorrectAnswer: correct.value,
    message: isCorrect
      ? undefined
      : `Ваш ответ: ${parsed}${unitSuffix}. Правильный ответ: ${correct.value}${unitSuffix}`,
  };
}

function checkSlots(
  userAnswer: UserAnswer,
  correct: Extract<CorrectAnswer, { type: "slots" }>
): AnswerCheckResult {
  if (userAnswer.type !== "slots") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer.value,
      normalizedCorrectAnswer: correct.value,
      message: "Неверный тип ответа",
    };
  }

  const userSlots = userAnswer.value;
  const correctSlots = correct.value;

  // All slotIds in correct answer must be present and match
  const allSlotIds = Object.keys(correctSlots);
  let isCorrect = true;
  const mismatches: string[] = [];

  for (const slotId of allSlotIds) {
    const userVal = (userSlots[slotId] ?? "").trim();
    const correctVal = correctSlots[slotId].trim();

    if (userVal !== correctVal) {
      isCorrect = false;
      mismatches.push(`Ячейка «${slotId}»: вы — «${userVal || "(пусто)"}», верно — «${correctVal}»`);
    }
  }

  // Extra user slots are treated as wrong
  const extraSlots = Object.keys(userSlots).filter(
    (k) => !(k in correctSlots)
  );
  if (extraSlots.length > 0) {
    isCorrect = false;
  }

  return {
    isCorrect,
    normalizedUserAnswer: userSlots,
    normalizedCorrectAnswer: correctSlots,
    message: isCorrect
      ? undefined
      : mismatches.length > 0
        ? `Несовпадения: ${mismatches.join("; ")}`
        : "Не все ячейки заполнены верно",
  };
}

function checkSelfCheck(
  userAnswer: UserAnswer
): AnswerCheckResult {
  if (userAnswer.type !== "self_check") {
    return {
      isCorrect: false,
      normalizedUserAnswer: userAnswer,
      normalizedCorrectAnswer: "known",
      message: "Неверный тип ответа",
    };
  }

  // Self-check: "known" = correct, "unknown" = wrong
  const isCorrect = userAnswer.value === "known";

  return {
    isCorrect,
    normalizedUserAnswer: userAnswer.value,
    normalizedCorrectAnswer: "known",
    message: isCorrect
      ? undefined
      : "Вы отметили, что не знаете ответ. Не страшно — повторите материал!",
  };
}

// -----------------------------------------------------------
// Human-readable error messages
// -----------------------------------------------------------

function buildSingleChoiceMessage(
  userId: string,
  correctId: string,
  options?: QuestionOption[]
): string {
  const userText = options?.find((o) => o.id === userId)?.text ?? userId;
  const correctText =
    options?.find((o) => o.id === correctId)?.text ?? correctId;
  return `Вы выбрали: «${userText}». Правильный ответ: «${correctText}»`;
}

function buildMultiChoiceMessage(
  userIds: string[],
  correctIds: string[],
  options: QuestionOption[] | undefined,
  orderMatters: boolean
): string {
  const lookup = (id: string) =>
    options?.find((o) => o.id === id)?.text ?? id;

  const userTexts = userIds.map(lookup).join(", ");
  const correctTexts = correctIds.map(lookup).join(", ");

  const orderNote = orderMatters ? " (порядок важен)" : "";
  return `Вы выбрали: ${userTexts}. Правильный ответ${orderNote}: ${correctTexts}`;
}

function buildTextMessage(
  normalizedUser: string,
  normalizedAcceptable: string[],
  mode: string
): string {
  const displayAcceptable =
    normalizedAcceptable.length === 1
      ? `«${normalizedAcceptable[0]}»`
      : normalizedAcceptable.map((a) => `«${a}»`).join(" или ");

  const modeLabel: Record<string, string> = {
    strict: "точное совпадение",
    lowercase: "без учёта регистра",
    no_spaces: "без пробелов",
    ege_sequence: "последовательность цифр",
  };

  return `Ваш ответ: «${normalizedUser}». Правильный ответ (${modeLabel[mode] ?? mode}): ${displayAcceptable}`;
}

// -----------------------------------------------------------
// Formatting helpers for UI display
// -----------------------------------------------------------

/** Map question type to expected answer type */
function questionTypeToAnswerType(
  questionType: string
): string {
  const map: Record<string, string> = {
    single_choice: "single",
    multi_choice: "multiple",
    text_input: "text",
    matching: "matching",
    formula_gap: "slots",
    numeric_input: "numeric",
    flashcard_self_check: "self_check",
  };
  return map[questionType] ?? "unknown";
}

/**
 * Format a user answer for display.
 * Returns a human-readable string.
 */
export function formatUserAnswer(
  userAnswer: UserAnswer,
  options?: QuestionOption[],
  pairs?: MatchingPair[]
): string {
  switch (userAnswer.type) {
    case "single": {
      if (userAnswer.value === null) return "— (не выбрано)";
      const opt = options?.find((o) => o.id === userAnswer.value);
      return opt?.text ?? userAnswer.value;
    }
    case "multiple": {
      if (userAnswer.value.length === 0) return "— (ничего не выбрано)";
      return userAnswer.value
        .map((id) => options?.find((o) => o.id === id)?.text ?? id)
        .join(", ");
    }
    case "text": {
      return userAnswer.value || "— (пустой ответ)";
    }
    case "matching": {
      const entries = Object.entries(userAnswer.value);
      if (entries.length === 0) return "— (не заполнено)";
      return entries
        .map(([leftId, rightId]) => {
          const leftText =
            pairs?.find((p) => p.leftId === leftId)?.leftText ?? leftId;
          const rightText =
            pairs?.find((p) => p.rightId === rightId)?.rightText ?? rightId;
          return `${leftText} → ${rightText}`;
        })
        .join("; ");
    }
    case "numeric": {
      return userAnswer.value || "— (пустой ответ)";
    }
    case "slots": {
      const entries = Object.entries(userAnswer.value);
      if (entries.length === 0) return "— (не заполнено)";
      return entries
        .map(([slotId, value]) => `${slotId}: ${value}`)
        .join("; ");
    }
    case "self_check": {
      return userAnswer.value === "known" ? "Знаю" : "Не знаю";
    }
    default:
      return "Неизвестный формат ответа";
  }
}

/**
 * Format the correct answer for display.
 * Returns a human-readable string.
 */
export function formatCorrectAnswer(
  correctAnswer: CorrectAnswer,
  options?: QuestionOption[],
  pairs?: MatchingPair[]
): string {
  switch (correctAnswer.type) {
    case "single": {
      const opt = options?.find((o) => o.id === correctAnswer.value);
      return opt?.text ?? correctAnswer.value;
    }
    case "multiple": {
      const orderNote = correctAnswer.orderMatters ? " (порядок важен)" : "";
      const formatted = correctAnswer.value
        .map((id) => options?.find((o) => o.id === id)?.text ?? id)
        .join(", ");
      return formatted + orderNote;
    }
    case "text": {
      const vals = Array.isArray(correctAnswer.value)
        ? correctAnswer.value
        : [correctAnswer.value];
      const modeLabel =
        correctAnswer.normalize && correctAnswer.normalize !== "lowercase"
          ? ` (${correctAnswer.normalize})`
          : "";
      return vals.join(" или ") + modeLabel;
    }
    case "matching": {
      return Object.entries(correctAnswer.value)
        .map(([leftId, rightId]) => {
          const leftText =
            pairs?.find((p) => p.leftId === leftId)?.leftText ?? leftId;
          const rightText =
            pairs?.find((p) => p.rightId === rightId)?.rightText ?? rightId;
          return `${leftText} → ${rightText}`;
        })
        .join("; ");
    }
    case "numeric": {
      const unitSuffix = correctAnswer.unit ? ` ${correctAnswer.unit}` : "";
      const toleranceSuffix =
        correctAnswer.tolerance && correctAnswer.tolerance > 0.01
          ? ` (±${correctAnswer.tolerance})`
          : "";
      return `${correctAnswer.value}${unitSuffix}${toleranceSuffix}`;
    }
    case "slots": {
      return Object.entries(correctAnswer.value)
        .map(([slotId, value]) => `${slotId}: ${value}`)
        .join("; ");
    }
    case "self_check": {
      return "Самопроверка (известно)";
    }
    default:
      return "Неизвестный формат ответа";
  }
}

"use client";

import type { Question, UserAnswer } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface TextInputQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a text input question.
 * Does NOT check the answer — only collects user input.
 */
export function TextInputQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: TextInputQuestionProps) {
  const currentValue =
    currentAnswer?.type === "text" ? currentAnswer.value : "";

  // Determine placeholder based on normalization mode
  const normalize =
    question.correctAnswer.type === "text"
      ? question.correctAnswer.normalize
      : undefined;

  const placeholder = getPlaceholder(normalize);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onAnswerChange({ type: "text", value: e.target.value });
  }

  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="text-base"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {normalize && (
        <p className="text-xs text-muted-foreground">
          {getNormalizeHint(normalize)}
        </p>
      )}
    </div>
  );
}

function getPlaceholder(
  normalize?: "strict" | "lowercase" | "no_spaces" | "ege_sequence"
): string {
  switch (normalize) {
    case "ege_sequence":
      return "Введите последовательность цифр (например: 134)";
    case "no_spaces":
      return "Введите ответ без пробелов";
    case "strict":
      return "Введите ответ точно (с учётом регистра)";
    case "lowercase":
    default:
      return "Введите ответ";
  }
}

function getNormalizeHint(
  normalize: "strict" | "lowercase" | "no_spaces" | "ege_sequence"
): string {
  switch (normalize) {
    case "ege_sequence":
      return "Введите только цифры без пробелов и запятых";
    case "no_spaces":
      return "Регистр и пробелы не учитываются";
    case "strict":
      return "Точное совпадение — учитывается регистр";
    case "lowercase":
      return "Регистр не учитывается";
  }
}

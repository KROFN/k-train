"use client";

import type { Question, UserAnswer } from "@/types/quiz";
import { Input } from "@/components/ui/input";

interface NumericInputQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a numeric input question.
 * Simple number input with optional unit display.
 * Does NOT check the answer — only collects user input.
 */
export function NumericInputQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: NumericInputQuestionProps) {
  const currentValue =
    currentAnswer?.type === "numeric" ? currentAnswer.value : "";

  const numericConfig = question.numericConfig;
  const expectedUnit =
    question.correctAnswer.type === "numeric"
      ? question.correctAnswer.unit
      : undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onAnswerChange({ type: "numeric", value: e.target.value });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={currentValue}
          onChange={handleChange}
          placeholder="Введите число"
          disabled={disabled}
          className="text-base font-mono max-w-[200px]"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {expectedUnit && (
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {expectedUnit}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {expectedUnit && (
          <p className="text-xs text-muted-foreground">
            Ответ в {expectedUnit}
          </p>
        )}
        {numericConfig?.kind === "unit_conversion" && (
          <p className="text-xs text-muted-foreground">
            Переведите в указанные единицы измерения
          </p>
        )}
        {numericConfig?.kind === "mental_formula_problem" && (
          <p className="text-xs text-muted-foreground">
            Вычислите устно и запишите результат
          </p>
        )}
      </div>
    </div>
  );
}

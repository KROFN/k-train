"use client";

import type { Question, UserAnswer } from "@/types/quiz";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MultiChoiceQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a multi-choice question with checkboxes.
 * Does NOT check the answer — only collects user input.
 */
export function MultiChoiceQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: MultiChoiceQuestionProps) {
  const selectedIds: string[] =
    currentAnswer?.type === "multiple" ? currentAnswer.value : [];

  const options = question.options ?? [];

  function handleToggle(optionId: string, checked: boolean) {
    let newIds: string[];
    if (checked) {
      newIds = [...selectedIds, optionId];
    } else {
      newIds = selectedIds.filter((id) => id !== optionId);
    }
    onAnswerChange({ type: "multiple", value: newIds });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">
        Выберите один или несколько вариантов
      </p>
      {options.map((option) => {
        const isChecked = selectedIds.includes(option.id);
        return (
          <div
            key={option.id}
            className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:bg-primary/5 has-[button[data-state=checked]]:border-primary/30"
          >
            <Checkbox
              id={`option-${option.id}`}
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleToggle(option.id, checked === true)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <Label
              htmlFor={`option-${option.id}`}
              className="text-sm leading-relaxed cursor-pointer font-normal"
            >
              {option.text}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

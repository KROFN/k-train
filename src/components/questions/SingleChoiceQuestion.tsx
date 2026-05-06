"use client";

import type { Question, UserAnswer } from "@/types/quiz";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SingleChoiceQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a single-choice question with radio buttons.
 * Does NOT check the answer — only collects user input.
 */
export function SingleChoiceQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: SingleChoiceQuestionProps) {
  const selectedValue =
    currentAnswer?.type === "single" ? currentAnswer.value : null;

  const options = question.options ?? [];

  return (
    <div className="space-y-3">
      <RadioGroup
        value={selectedValue ?? undefined}
        onValueChange={(value) => {
          onAnswerChange({ type: "single", value });
        }}
        disabled={disabled}
        className="gap-2"
      >
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[button[data-state=checked]]:bg-primary/5 has-[button[data-state=checked]]:border-primary/30"
          >
            <RadioGroupItem value={option.id} id={`option-${option.id}`} className="mt-0.5" />
            <Label
              htmlFor={`option-${option.id}`}
              className="text-sm leading-relaxed cursor-pointer font-normal"
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

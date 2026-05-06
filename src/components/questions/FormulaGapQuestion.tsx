"use client";

import { useMemo, useCallback } from "react";
import type { Question, UserAnswer, FormulaTemplatePart } from "@/types/quiz";
import { Button } from "@/components/ui/button";

interface FormulaGapQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a formula gap question with click-to-fill interaction.
 * Displays a formula template with blanks (slots) that the user
 * fills by clicking options from a bank below.
 * Does NOT check the answer — only collects user input.
 */
export function FormulaGapQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: FormulaGapQuestionProps) {
  const template = question.formulaTemplate;
  const options = question.options ?? [];

  // Current slot values from user answer — wrapped in useMemo for stable reference
  const currentSlots = useMemo(
    () => currentAnswer?.type === "slots" ? currentAnswer.value : {},
    [currentAnswer]
  );

  // Track which slot is currently selected for filling
  // We use the first unfilled slot as active by default
  const slotParts = useMemo(
    () => template?.parts.filter((p): p is Extract<FormulaTemplatePart, { kind: "slot" }> => p.kind === "slot") ?? [],
    [template]
  );

  // Find the first unfilled slot to auto-select
  const activeSlotId = useMemo(() => {
    const filledSlotIds = Object.keys(currentSlots);
    const unfilled = slotParts.find((s) => !filledSlotIds.includes(s.slotId));
    return unfilled?.slotId ?? slotParts[0]?.slotId ?? null;
  }, [currentSlots, slotParts]);

  // Which options are already used in other slots
  const usedOptionIds = useMemo(() => {
    const used = new Set<string>();
    for (const val of Object.values(currentSlots)) {
      used.add(val);
    }
    return used;
  }, [currentSlots]);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      if (!activeSlotId) return;

      // Check if this option is already used in a different slot
      // If so, remove it from that slot first
      const updatedSlots = { ...currentSlots };
      for (const [slotId, val] of Object.entries(updatedSlots)) {
        if (val === optionId && slotId !== activeSlotId) {
          delete updatedSlots[slotId];
        }
      }

      // Place the option in the active slot
      updatedSlots[activeSlotId] = optionId;

      onAnswerChange({ type: "slots", value: updatedSlots });
    },
    [activeSlotId, currentSlots, onAnswerChange]
  );

  const handleSlotClick = useCallback(
    (slotId: string) => {
      // Remove the value from the clicked slot (deselect)
      const updatedSlots = { ...currentSlots };
      delete updatedSlots[slotId];
      onAnswerChange({ type: "slots", value: updatedSlots });
    },
    [currentSlots, onAnswerChange]
  );

  if (!template) {
    return (
      <p className="text-sm text-destructive">
        Ошибка: формула не задана для этого вопроса
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formula display with interactive slots */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center gap-1 text-lg font-mono leading-relaxed">
          {template.parts.map((part, idx) => {
            if (part.kind === "text") {
              return (
                <span key={`text-${idx}`} className="whitespace-pre">
                  {part.value}
                </span>
              );
            }

            // Slot
            const slotValue = currentSlots[part.slotId];
            const optionText = slotValue
              ? options.find((o) => o.id === slotValue)?.text ?? slotValue
              : null;
            const isActive = slotValue === undefined && activeSlotId === part.slotId;
            const isFilled = slotValue !== undefined;

            return (
              <button
                key={`slot-${part.slotId}`}
                type="button"
                onClick={() => isFilled && !disabled ? handleSlotClick(part.slotId) : undefined}
                disabled={disabled}
                className={`
                  inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded border-2 text-base transition-colors
                  ${isFilled
                    ? "border-primary bg-primary/10 text-primary font-semibold hover:border-primary/60"
                    : isActive
                      ? "border-primary/50 bg-primary/5 text-muted-foreground animate-pulse"
                      : "border-dashed border-muted-foreground/40 bg-muted/50 text-muted-foreground"
                  }
                  ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
                title={isFilled ? "Нажмите, чтобы убрать" : part.placeholder ?? "Выберите ответ"}
              >
                {optionText ?? part.placeholder ?? "?"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Option bank */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Варианты ответов
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isUsed = usedOptionIds.has(option.id);
            return (
              <Button
                key={option.id}
                type="button"
                variant={isUsed ? "default" : "outline"}
                size="sm"
                onClick={() => !disabled && !isUsed && handleOptionClick(option.id)}
                disabled={disabled || isUsed}
                className={`
                  text-sm font-mono
                  ${isUsed ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {option.text}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

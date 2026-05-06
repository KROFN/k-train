"use client";

import { useMemo } from "react";
import type { Question, UserAnswer, MatchingPair } from "@/types/quiz";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MatchingQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a matching question with dropdown selects.
 * Left column is fixed, right column has dropdowns for each left item.
 * Does NOT check the answer — only collects user input.
 */
export function MatchingQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: MatchingQuestionProps) {
  const pairs = useMemo(() => question.pairs ?? [], [question.pairs]);
  const currentMapping: Record<string, string> =
    currentAnswer?.type === "matching" ? currentAnswer.value : {};

  // Shuffle right options once (stable via useMemo)
  const rightOptions = useMemo(() => buildRightOptions(pairs), [pairs]);

  function handleSelect(leftId: string, rightId: string) {
    const newMapping = { ...currentMapping, [leftId]: rightId };
    onAnswerChange({ type: "matching", value: newMapping });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">
        Установите соответствие: выберите вариант для каждого пункта
      </p>
      <div className="space-y-2">
        {pairs.map((pair) => (
          <div
            key={pair.leftId}
            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border p-3"
          >
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium leading-relaxed cursor-default">
                {pair.leftText}
              </Label>
            </div>
            <div className="sm:w-48 shrink-0">
              <Select
                value={currentMapping[pair.leftId] ?? undefined}
                onValueChange={(value) => handleSelect(pair.leftId, value)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  {rightOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Build unique right-side options from matching pairs, shuffled */
function buildRightOptions(pairs: MatchingPair[]): { id: string; text: string }[] {
  const seen = new Map<string, string>();
  for (const pair of pairs) {
    if (!seen.has(pair.rightId)) {
      seen.set(pair.rightId, pair.rightText);
    }
  }
  // Fisher-Yates shuffle
  const entries = [...seen.entries()];
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries.map(([id, text]) => ({ id, text }));
}

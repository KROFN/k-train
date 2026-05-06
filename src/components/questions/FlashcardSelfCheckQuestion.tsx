"use client";

import { useState } from "react";
import type { Question, UserAnswer } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { EyeIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

interface FlashcardSelfCheckQuestionProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
}

/**
 * Renders a flashcard self-check question.
 * User reveals the answer, then self-reports whether they knew it.
 * "Known" = correct, "Unknown" = wrong.
 * Does NOT check the answer — only collects self-reported input.
 */
export function FlashcardSelfCheckQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}: FlashcardSelfCheckQuestionProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const selfCheckAnswer =
    currentAnswer?.type === "self_check" ? currentAnswer.value : null;

  // The correct answer to reveal
  const revealText =
    question.explanation.answer ??
    question.explanation.detailed ??
    question.explanation.rule ??
    null;

  function handleReveal() {
    setIsRevealed(true);
  }

  function handleSelfAssess(value: "known" | "unknown") {
    onAnswerChange({ type: "self_check", value });
  }

  return (
    <div className="space-y-4">
      {/* Reveal button */}
      {!isRevealed && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Подумайте над ответом, затем нажмите кнопку, чтобы увидеть правильный ответ
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReveal}
            disabled={disabled}
            className="gap-2"
          >
            <EyeIcon className="h-4 w-4" />
            Показать ответ
          </Button>
        </div>
      )}

      {/* Revealed answer */}
      {isRevealed && revealText && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">
            Правильный ответ
          </p>
          <p className="text-sm leading-relaxed">{revealText}</p>
        </div>
      )}

      {/* Self-assessment buttons */}
      {isRevealed && !selfCheckAnswer && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Вы знали ответ?
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelfAssess("known")}
              disabled={disabled}
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Да, знал(а)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelfAssess("unknown")}
              disabled={disabled}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <XCircleIcon className="h-4 w-4" />
              Нет, не знал(а)
            </Button>
          </div>
        </div>
      )}

      {/* Show self-assessment result */}
      {selfCheckAnswer && (
        <div
          className={`rounded-lg border p-3 flex items-center gap-2 ${
            selfCheckAnswer === "known"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {selfCheckAnswer === "known" ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Знал(а) ответ</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Не знал(а) ответ</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

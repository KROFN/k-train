"use client";

import type { Question } from "@/types/quiz";
import { AlertTriangleIcon } from "lucide-react";

interface UnsupportedQuestionProps {
  question: Question;
}

/**
 * Fallback component for unsupported/unknown question types.
 * Shows a warning instead of crashing.
 */
export function UnsupportedQuestion({ question }: UnsupportedQuestionProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex flex-col items-center gap-2 text-center">
      <AlertTriangleIcon className="h-6 w-6 text-destructive" />
      <p className="text-sm font-medium text-destructive">
        Неподдерживаемый тип вопроса
      </p>
      <p className="text-xs text-muted-foreground">
        Тип «{question.type}» пока не поддерживается. Вопрос: {question.id}
      </p>
    </div>
  );
}

"use client";

import type { Question, UserAnswer } from "@/types/quiz";
import { SingleChoiceQuestion } from "./SingleChoiceQuestion";
import { MultiChoiceQuestion } from "./MultiChoiceQuestion";
import { TextInputQuestion } from "./TextInputQuestion";
import { MatchingQuestion } from "./MatchingQuestion";
import { FormulaGapQuestion } from "./FormulaGapQuestion";
import { NumericInputQuestion } from "./NumericInputQuestion";
import { FlashcardSelfCheckQuestion } from "./FlashcardSelfCheckQuestion";
import { UnsupportedQuestion } from "./UnsupportedQuestion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionRendererProps {
  question: Question;
  currentAnswer: UserAnswer | null;
  onAnswerChange: (answer: UserAnswer) => void;
  disabled?: boolean;
  /** Whether to show the question header with exam number, topic, difficulty */
  showHeader?: boolean;
}

const difficultyLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  easy: { label: "Легко", variant: "secondary" },
  medium: { label: "Средне", variant: "outline" },
  hard: { label: "Сложно", variant: "destructive" },
};

/**
 * Renders the appropriate question component based on question type.
 * Includes a question header with metadata.
 * Falls back to UnsupportedQuestion for unknown types.
 * Does NOT check the answer.
 */
export function QuestionRenderer({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  showHeader = true,
}: QuestionRendererProps) {
  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {question.examNumber != null ? (
              <Badge variant="default" className="text-xs">
                Задание {question.examNumber}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="text-xs">
              {question.topic}
            </Badge>
            <Badge
              variant={difficultyLabels[question.difficulty]?.variant ?? "outline"}
              className="text-xs"
            >
              {difficultyLabels[question.difficulty]?.label ?? question.difficulty}
            </Badge>
            {question.presentation === "formula" && (
              <Badge variant="outline" className="text-xs">
                Формула
              </Badge>
            )}
          </div>
          <CardTitle className="text-base leading-relaxed whitespace-pre-line mt-2">
            {question.prompt}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {!showHeader && (
          <p className="text-base leading-relaxed whitespace-pre-line mb-4">
            {question.prompt}
          </p>
        )}
        {renderQuestionInput(question, currentAnswer, onAnswerChange, disabled)}
      </CardContent>
    </Card>
  );
}

function renderQuestionInput(
  question: Question,
  currentAnswer: UserAnswer | null,
  onAnswerChange: (answer: UserAnswer) => void,
  disabled: boolean
) {
  switch (question.type) {
    case "single_choice":
      return (
        <SingleChoiceQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "text_input":
      return (
        <TextInputQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "matching":
      return (
        <MatchingQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "formula_gap":
      return (
        <FormulaGapQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "numeric_input":
      return (
        <NumericInputQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    case "flashcard_self_check":
      return (
        <FlashcardSelfCheckQuestion
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
        />
      );
    default:
      return <UnsupportedQuestion question={question} />;
  }
}

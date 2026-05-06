"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Flame,
  Trash2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProgressStore } from "@/store/progress-store";
import { useQuizStore } from "@/store/quiz-store";
import { useCourseStore } from "@/store/course-store";
import { useCourseAccessStore } from "@/store/course-access-store";
import { getCourseById } from "@/data/courses";
import { requiresAccessCode } from "@/lib/access-code";
import { getQuestionsByCourseId } from "@/data/questions";
import { formatCorrectAnswer, formatUserAnswer } from "@/lib/answer-checking";
import type { MistakeRecord } from "@/types/progress";
import type { Question, QuestionAttempt } from "@/types/quiz";

export default function ReviewPage() {
  const router = useRouter();

  // Course store
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);
  const setSelectedCourse = useCourseStore((s) => s.setSelectedCourse);

  // Progress store
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const courseProgress = useProgressStore((s) => s.progress.courses[selectedCourseId]);
  const attempts = useProgressStore((s) => s.attempts);
  const resetProgress = useProgressStore((s) => s.reset);
  const startSession = useQuizStore((s) => s.startSession);

  // Course access store
  const hydrateAccess = useCourseAccessStore((s) => s.hydrate);
  const accessStoreAccess = useCourseAccessStore((s) => s.access);
  const relock = useCourseAccessStore((s) => s.relock);

  // Whether the current course is a locked course that has been unlocked
  const isUnlockedLockedCourse = requiresAccessCode(selectedCourseId) && accessStoreAccess[selectedCourseId] === true;

  const rawMistakes = useMemo(
    () => courseProgress?.mistakes ?? [],
    [courseProgress]
  );

  const mistakes = useMemo(
    () => rawMistakes.filter((m) => !m.resolved),
    [rawMistakes]
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    hydrateCourse();
    hydrateProgress();
    hydrateAccess();
  }, [hydrateCourse, hydrateProgress, hydrateAccess]);

  // Only get questions for the selected course
  const courseQuestions = getQuestionsByCourseId(selectedCourseId);

  // Build enriched mistake list: question + last attempt
  const enrichedMistakes = useMemo(() => {
    return mistakes
      .map((m) => {
        const question = courseQuestions.find((q) => q.id === m.questionId);
        if (!question) return null;
        // Find last wrong attempt for this question
        const lastAttempt = [...attempts]
          .reverse()
          .find((a) => a.questionId === m.questionId && !a.isCorrect);
        return { question, mistake: m, lastAttempt: lastAttempt ?? null };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [mistakes, courseQuestions, attempts]);

  const courseInfo = getCourseById(selectedCourseId);

  async function handlePracticeMistakes() {
    if (mistakes.length === 0) return;
    await startSession({
      mode: "mistakes",
      courseId: selectedCourseId,
      mistakeQuestionIds: mistakes.map((m) => m.questionId),
    });
    router.push("/session");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Разбор ошибок
        </h1>
        <p className="text-sm text-muted-foreground">
          {courseInfo?.title ?? "Курс"} · Повторяй задания, в которых ошибался
        </p>
      </div>

      {/* No mistakes */}
      {mistakes.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Нет неразобранных ошибок</p>
              <p className="text-xs text-muted-foreground">
                Ошибки появятся здесь после тренировки
              </p>
            </div>
            <Button onClick={() => router.push("/practice")}>
              Начать тренировку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-sm">
                    {mistakes.length} {getMistakeWord(mistakes.length)}
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  нужно разобрать
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Повтори эти задания, чтобы закрепить материал и убрать ошибки из списка.
              </p>
              <Button className="w-full" size="lg" onClick={handlePracticeMistakes}>
                <Flame className="h-5 w-5" />
                Тренировка по ошибкам
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Mistake list with full breakdown */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Разбор ошибок</h2>
            <div className="space-y-3">
              {enrichedMistakes.map(({ question, mistake, lastAttempt }) => (
                <MistakeDetailCard
                  key={question.id}
                  question={question}
                  mistake={mistake}
                  lastAttempt={lastAttempt}
                />
              ))}
            </div>
          </div>

          {/* Missing questions info */}
          {enrichedMistakes.length < mistakes.length && (
            <p className="text-xs text-muted-foreground text-center">
              {mistakes.length - enrichedMistakes.length} ошибок относятся к вопросам,
              которых нет в текущей базе данных.
            </p>
          )}
        </>
      )}

      {/* Reset progress (danger zone) */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-destructive uppercase tracking-wider">
            Опасная зона
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showResetConfirm ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowResetConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Сбросить весь прогресс
              </Button>
              {isUnlockedLockedCourse && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-muted-foreground hover:bg-muted/50"
                  onClick={() => {
                    relock(selectedCourseId);
                    setSelectedCourse("ege_russian");
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Заблокировать курс
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-destructive">
                Ты уверен? Это удалит весь твой прогресс, XP, streak и историю ошибок.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetProgress();
                    setShowResetConfirm(false);
                  }}
                >
                  Да, сбросить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Detailed mistake card with expand/collapse ──────────────────

function MistakeDetailCard({
  question,
  mistake,
  lastAttempt,
}: {
  question: Question;
  mistake: MistakeRecord;
  lastAttempt: QuestionAttempt | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 space-y-2 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {question.examNumber != null ? (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Задание {question.examNumber}
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                {question.topic}
              </Badge>
            )}
            {question.examNumber != null && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {question.topic}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {mistake.timesWrong} {getErrorWord(mistake.timesWrong)}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed">{question.prompt}</p>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Your answer vs correct answer */}
          {lastAttempt && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-destructive">Твой ответ:</span>
                  <p className="text-sm text-foreground">
                    {formatUserAnswer(
                      lastAttempt.selectedAnswer,
                      question.options,
                      question.pairs
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-success">Правильный ответ:</span>
                  <p className="text-sm text-foreground">
                    {formatCorrectAnswer(
                      question.correctAnswer,
                      question.options,
                      question.pairs
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="rounded-md bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Объяснение</span>
              </div>
              <p className="text-sm leading-relaxed">{question.explanation.short}</p>
              {question.explanation.rule && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Правило:</span> {question.explanation.rule}
                </p>
              )}
              {question.explanation.examples && question.explanation.examples.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Примеры:</span>{" "}
                  {question.explanation.examples.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** Russian pluralization for "ошибка" */
function getMistakeWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "ошибок";
  if (mod10 === 1) return "ошибка";
  if (mod10 >= 2 && mod10 <= 4) return "ошибки";
  return "ошибок";
}

/** Russian pluralization for "ошибка" (times wrong) */
function getErrorWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "ошибок";
  if (mod10 === 1) return "ошибка";
  if (mod10 >= 2 && mod10 <= 4) return "ошибки";
  return "ошибок";
}

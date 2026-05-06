"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Heart,
  Loader2,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Snowflake,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuizStore } from "@/store/quiz-store";
import { useProgressStore, HEARTS_FROZEN } from "@/store/progress-store";
import { useCourseStore } from "@/store/course-store";
import { useCourseAccessStore } from "@/store/course-access-store";
import { requiresAccessCode } from "@/lib/access-code";
import { QuestionRenderer } from "@/components/questions/QuestionRenderer";
import { formatCorrectAnswer, formatUserAnswer, type AnswerCheckResult } from "@/lib/answer-checking";
import type { Question } from "@/types/quiz";

export default function SessionPage() {
  const router = useRouter();

  // Course store
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);

  // Quiz store
  const session = useQuizStore((s) => s.session);
  const status = useQuizStore((s) => s.getStatus());
  const currentQuestion = useQuizStore((s) => s.getCurrentQuestion());
  const currentIndex = useQuizStore((s) => s.getCurrentIndex());
  const totalQuestions = useQuizStore((s) => s.getTotalQuestions());
  const isLast = useQuizStore((s) => s.isLastQuestion());
  const lastCheckResult = useQuizStore((s) => s.getLastCheckResult());
  const currentAnswer = useQuizStore((s) => s.session?.currentAnswer ?? null);

  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const submitAnswer = useQuizStore((s) => s.submitAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const finishSession = useQuizStore((s) => s.finishSession);
  const resetSession = useQuizStore((s) => s.resetSession);

  // Progress store
  const hearts = useProgressStore((s) => s.getHearts());
  const hydrateProgress = useProgressStore((s) => s.hydrate);

  // Course access store
  const hydrateAccess = useCourseAccessStore((s) => s.hydrate);
  const accessStoreAccess = useCourseAccessStore((s) => s.access);

  const isCourseLocked = requiresAccessCode(selectedCourseId) && accessStoreAccess[selectedCourseId] !== true;
  const isWrongCourseSession =
    !!session && !!session.courseId && session.courseId !== selectedCourseId;

  useEffect(() => {
    hydrateCourse();
    hydrateProgress();
    hydrateAccess();
  }, [hydrateCourse, hydrateProgress, hydrateAccess]);

  useEffect(() => {
    if (isWrongCourseSession) {
      resetSession();
    }
  }, [isWrongCourseSession, resetSession]);

  // ─── Locked course ────
  if (isCourseLocked && (status === "idle" || !session || isWrongCourseSession)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-primary" />
            Тренировка
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Этот курс заблокирован. Введите код доступа на главной странице.
            </p>
            <Button onClick={() => router.push("/")}>
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Idle ────
  if (status === "idle" || !session || isWrongCourseSession) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-primary" />
            Тренировка
          </h1>
          <p className="text-sm text-muted-foreground">
            {isWrongCourseSession
              ? "Начните тренировку для текущего курса"
              : "Здесь будет проходить твоя тренировка"}
          </p>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              {isWrongCourseSession
                ? "Ваша предыдущая сессия была для другого курса. Начните новую тренировку для выбранного курса."
                : (<>Тренировочная сессия появится здесь.<br />Начни практику с главной страницы!</>)}
            </p>
            <Button onClick={() => router.push("/practice")}>
              Выбрать тренировку
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Loading ────
  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Загружаем вопросы...</p>
        </div>
      </div>
    );
  }

  // ─── Error ────
  if (status === "error") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card className="border-destructive/30">
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-medium">
              {session.error ?? "Произошла ошибка"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/practice")}>
                Назад к практике
              </Button>
              <Button onClick={() => { resetSession(); router.push("/practice"); }}>
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Completed ────
  if (status === "completed") {
    const attempts = session.attempts;
    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;
    const xpGained = attempts.filter((a) => a.isCorrect).length * 10 + 20;
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-3">
          {/* Star rating */}
          <div className="flex justify-center gap-1 mb-1">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`h-8 w-8 transition-all ${
                  s <= stars
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Trophy className="h-7 w-7 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Тренировка завершена!</h1>
          <p className="text-muted-foreground text-sm">
            {stars === 3
              ? "Отличный результат! Так держать 🔥"
              : stars === 2
              ? "Хороший результат! Есть куда расти 💪"
              : "Не сдавайся — повтори ошибки и попробуй снова 📚"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<CheckCircle className="h-4 w-4 text-success" />}
            value={`${accuracy}%`}
            label="Точность"
          />
          <StatCard
            icon={<Trophy className="h-4 w-4 text-yellow-500" />}
            value={`+${xpGained}`}
            label="XP"
          />
          {/* 🧊 Hearts frozen */}
          <StatCard
            icon={
              HEARTS_FROZEN
                ? <Snowflake className="h-4 w-4 text-sky-400" />
                : <Heart className="h-4 w-4 text-red-500" />
            }
            value={HEARTS_FROZEN ? "🧊" : `${hearts}`}
            label="Сердца"
            frozen={HEARTS_FROZEN}
          />
        </div>

        {/* Accuracy bar */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Правильные ответы</span>
              <span className="font-medium">{correctCount} из {attempts.length}</span>
            </div>
            <Progress
              value={accuracy}
              className={`h-3 ${
                accuracy >= 80
                  ? "[&>div]:bg-success"
                  : accuracy >= 50
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-destructive"
              }`}
            />
          </CardContent>
        </Card>

        {/* Attempt review list */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Разбор ответов</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attempts.map((attempt, idx) => (
                <AttemptRow key={attempt.id} attempt={attempt} index={idx} questions={session.questions} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" onClick={() => { resetSession(); router.push("/practice"); }}>
            <RotateCcw className="h-4 w-4" />
            Новая тренировка
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { resetSession(); router.push("/"); }}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  // ─── Active / Answering / Checking / Result ────
  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 min-h-[400px] justify-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Вопрос не найден</p>
          <Button variant="outline" onClick={() => router.push("/practice")}>
            Назад к практике
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const canSubmit = status === "answering" && session.currentAnswer !== null;
  const isChecking = status === "checking";
  const isResult = status === "result";
  const isCorrect = lastCheckResult?.isCorrect ?? false;

  // Тема / номер задания для хедера
  const questionLabel = currentQuestion.examNumber != null
    ? `Задание ${currentQuestion.examNumber}`
    : currentQuestion.topic ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Top bar: progress + hearts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              finishSession();
              router.push("/practice");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть тренировку"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Тема вопроса по центру */}
          {questionLabel ? (
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[50%] text-center">
              {questionLabel}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {/* 🧊 Hearts frozen indicator */}
            {HEARTS_FROZEN ? (
              <div className="flex items-center gap-1 text-sm text-sky-400">
                <Snowflake className="h-4 w-4" />
                <span className="font-medium text-xs">🧊</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm">
                <Heart className={`h-4 w-4 ${hearts <= 1 ? "text-red-500 animate-pulse" : "text-red-500"}`} />
                <span className="font-medium">{hearts}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar + counter */}
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap tabular-nums">
            {currentIndex} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* Question */}
      <QuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        currentAnswer={currentAnswer}
        onAnswerChange={(answer) => selectAnswer(answer)}
        disabled={isChecking || isResult}
        showHeader={true}
      />

      {/* Checking spinner */}
      {isChecking && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Проверяем...</span>
        </div>
      )}

      {/* Result feedback */}
      {isResult && lastCheckResult && (
        <ResultFeedback
          isCorrect={isCorrect}
          question={currentQuestion}
          userAnswer={session.currentAnswer}
          checkResult={lastCheckResult}
        />
      )}

      {/* Action buttons */}
      <div className="pt-2 pb-4 space-y-2">
        {isResult ? (
          <Button size="lg" className="w-full" onClick={() => nextQuestion()}>
            {isLast ? (
              <>
                <Trophy className="h-5 w-5" />
                Завершить тренировку
              </>
            ) : (
              <>
                Следующий вопрос
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              onClick={() => submitAnswer()}
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Проверяем...
                </>
              ) : (
                "Проверить ответ"
              )}
            </Button>
            {/* Подсказка когда кнопка недоступна */}
            {!canSubmit && !isChecking && (
              <p className="text-center text-xs text-muted-foreground">
                Выберите ответ, чтобы продолжить
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────

function StatCard({
  icon,
  value,
  label,
  frozen = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  frozen?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-card p-3 flex flex-col items-center gap-1 ${
      frozen ? "border-sky-400/30 bg-sky-50/30 dark:bg-sky-950/20" : "border-border"
    }`}>
      {icon}
      <span className={`text-xl font-bold ${frozen ? "text-sky-400" : ""}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ResultFeedback({
  isCorrect,
  question,
  userAnswer,
  checkResult,
}: {
  isCorrect: boolean;
  question: Question;
  userAnswer: import("@/types/quiz").UserAnswer | null;
  checkResult: AnswerCheckResult;
}) {
  return (
    <Card className={`border-l-4 ${isCorrect ? "border-l-success border-success/20" : "border-l-destructive border-destructive/20"}`}>
      <CardContent className="space-y-3 pt-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <>
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <span className="font-semibold text-success text-sm">Правильно!</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <span className="font-semibold text-destructive text-sm">Неправильно</span>
            </>
          )}
        </div>

        {/* If wrong, show user's answer and correct answer */}
        {!isCorrect && (
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-destructive">Твой ответ:</span>
                <p className="text-foreground">
                  {userAnswer
                    ? formatUserAnswer(userAnswer, question.options, question.pairs)
                    : "— (нет ответа)"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-success">Правильный ответ:</span>
                <p className="text-foreground">
                  {formatCorrectAnswer(question.correctAnswer, question.options, question.pairs)}
                </p>
              </div>
            </div>
            {checkResult.message && (
              <p className="text-muted-foreground text-xs pl-6">{checkResult.message}</p>
            )}
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
      </CardContent>
    </Card>
  );
}

function AttemptRow({
  attempt,
  index: _index,
  questions,
}: {
  attempt: import("@/types/quiz").QuestionAttempt;
  index: number;
  questions: Question[];
}) {
  const question = questions.find((q) => q.id === attempt.questionId);
  const topic = question?.topic ?? "—";
  const examNumber = question?.examNumber;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
        attempt.isCorrect
          ? "border-success/20 bg-success/5"
          : "border-destructive/20 bg-destructive/5"
      }`}
    >
      {attempt.isCorrect ? (
        <CheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {examNumber != null ? (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              Задание {examNumber}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {topic}
            </Badge>
          )}
          {examNumber != null && (
            <span className="truncate text-xs text-muted-foreground">{topic}</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Filter,
  AlertCircle,
  Zap,
  Target,
  ChevronRight,
  ArrowLeft,
  Flame,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizStore } from "@/store/quiz-store";
import { useProgressStore } from "@/store/progress-store";
import { useCourseStore } from "@/store/course-store";
import { useCourseAccessStore } from "@/store/course-access-store";
import { getCourseById } from "@/data/courses";
import { requiresAccessCode } from "@/lib/access-code";
import {
  getAvailableExamNumbers,
  getAvailableTopics,
  getAvailableQuestionCount,
  getAvailableFormulaCount,
  getAvailableUnitsCount,
  getAvailableMentalCount,
  getAvailableGapCount,
  getAvailableBlitzCount,
} from "@/lib/practice-builder";
import { getQuestionsByCourseId, getQuestionsByExamNumber, getQuestionsByTopic } from "@/data/questions";
import type { PracticeConfig } from "@/lib/practice-builder";
import type { QuestionDifficulty } from "@/types/quiz";

type SelectedMode =
  | null
  | "quick"
  | "by_exam_number"
  | "by_topic"
  | "by_difficulty"
  | "mistakes"
  | "by_formula"
  | "by_units"
  | "by_mental"
  | "by_gap"
  | "by_blitz";

const difficulties: { value: QuestionDifficulty; label: string; emoji: string }[] = [
  { value: "easy", label: "Лёгкий", emoji: "🟢" },
  { value: "medium", label: "Средний", emoji: "🟡" },
  { value: "hard", label: "Сложный", emoji: "🔴" },
];

// Цветовые схемы для ModeCard
type ModeCardColor = "blue" | "gold" | "green" | "red" | "purple" | "orange" | "cyan";

const modeCardColors: Record<ModeCardColor, { border: string; bg: string; iconBg: string }> = {
  blue: {
    border: "border-blue-200/60 hover:border-blue-300/80 dark:border-blue-800/50",
    bg: "hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
  },
  gold: {
    border: "border-yellow-200/60 hover:border-yellow-300/80 dark:border-yellow-800/50",
    bg: "hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20",
    iconBg: "bg-yellow-100/80 dark:bg-yellow-900/30",
  },
  green: {
    border: "border-green-200/60 hover:border-green-300/80 dark:border-green-800/50",
    bg: "hover:bg-green-50/50 dark:hover:bg-green-950/20",
    iconBg: "bg-green-100/80 dark:bg-green-900/30",
  },
  red: {
    border: "border-red-200/60 hover:border-red-300/80 dark:border-red-800/50",
    bg: "hover:bg-red-50/50 dark:hover:bg-red-950/20",
    iconBg: "bg-red-100/80 dark:bg-red-900/30",
  },
  purple: {
    border: "border-purple-200/60 hover:border-purple-300/80 dark:border-purple-800/50",
    bg: "hover:bg-purple-50/50 dark:hover:bg-purple-950/20",
    iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
  },
  orange: {
    border: "border-orange-200/60 hover:border-orange-300/80 dark:border-orange-800/50",
    bg: "hover:bg-orange-50/50 dark:hover:bg-orange-950/20",
    iconBg: "bg-orange-100/80 dark:bg-orange-900/30",
  },
  cyan: {
    border: "border-cyan-200/60 hover:border-cyan-300/80 dark:border-cyan-800/50",
    bg: "hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20",
    iconBg: "bg-cyan-100/80 dark:bg-cyan-900/30",
  },
};

export default function PracticePage() {
  const router = useRouter();
  const startSession = useQuizStore((s) => s.startSession);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);

  const hydrateAccess = useCourseAccessStore((s) => s.hydrate);
  const accessStoreAccess = useCourseAccessStore((s) => s.access);

  const courseProgress = useProgressStore((s) => s.progress.courses[selectedCourseId]);
  const rawMistakes = useMemo(
    () => courseProgress?.mistakes ?? [],
    [courseProgress]
  );
  const unresolvedMistakes = useMemo(
    () => rawMistakes.filter((m) => !m.resolved),
    [rawMistakes]
  );

  const [selectedMode, setSelectedMode] = useState<SelectedMode>(null);

  const isCourseAccessible = useMemo(() => {
    if (!requiresAccessCode(selectedCourseId)) return true;
    return accessStoreAccess[selectedCourseId] === true;
  }, [selectedCourseId, accessStoreAccess]);

  useEffect(() => {
    hydrateCourse();
    hydrateProgress();
    hydrateAccess();
  }, [hydrateCourse, hydrateProgress, hydrateAccess]);

  const courseInfo = getCourseById(selectedCourseId);
  const courseQuestions = getQuestionsByCourseId(selectedCourseId);
  const hasQuestions = courseQuestions.length > 0;

  const examNumbers = getAvailableExamNumbers(selectedCourseId);
  const topics = getAvailableTopics(selectedCourseId);

  const formulaCount = getAvailableFormulaCount(selectedCourseId);
  const unitsCount = getAvailableUnitsCount(selectedCourseId);
  const mentalCount = getAvailableMentalCount(selectedCourseId);
  const gapCount = getAvailableGapCount(selectedCourseId);
  const blitzCount = getAvailableBlitzCount(selectedCourseId);

  async function handleStart(config: PracticeConfig) {
    await startSession(config);
    router.push("/session");
  }

  // ─── Locked ──────────
  if (!isCourseAccessible) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Практика
          </h1>
          <p className="text-sm text-muted-foreground">{courseInfo?.title ?? "Курс"}</p>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Курс заблокирован</p>
              <p className="text-xs text-muted-foreground">
                Введите код доступа на главной странице, чтобы разблокировать этот курс
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── No questions ──────────
  if (!hasQuestions) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Практика
          </h1>
          <p className="text-sm text-muted-foreground">{courseInfo?.title ?? "Курс"}</p>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Скоро будет доступно</p>
              <p className="text-xs text-muted-foreground">
                Вопросы для этого курса ещё добавляются
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPhysics = selectedCourseId === "oge_physics";
  const isBelenkova = selectedCourseId === "belenkova_math";

  // ─── Mode selection ──────────────────────────────────
  if (!selectedMode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Практика
          </h1>
          <p className="text-sm text-muted-foreground">
            {courseInfo?.title ?? "Курс"} · Выбери режим тренировки
          </p>
        </div>

        {isBelenkova ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModeCard
              icon={<span className="text-lg">🧮</span>}
              title="Формулы"
              description={`${formulaCount} вопросов по формулам`}
              onClick={() => setSelectedMode("by_formula")}
              disabled={formulaCount === 0}
              color="purple"
            />
            <ModeCard
              icon={<span className="text-lg">✏️</span>}
              title="Вставить кусочек"
              description={`${gapCount} вопросов с пропусками`}
              onClick={() => setSelectedMode("by_gap")}
              disabled={gapCount === 0}
              color="cyan"
            />
            <ModeCard
              icon={<span className="text-lg">🧠</span>}
              title="Мини-задачи"
              description={`${mentalCount} задач для устного счёта`}
              onClick={() => setSelectedMode("by_mental")}
              disabled={mentalCount === 0}
              color="orange"
            />
            <ModeCard
              icon={<span className="text-lg">⚡</span>}
              title="Блиц"
              description={`${blitzCount} вопросов — быстрый микс`}
              onClick={() => setSelectedMode("by_blitz")}
              disabled={blitzCount === 0}
              color="blue"
            />
            <ModeCard
              icon={<Filter className="h-5 w-5 text-green-600" />}
              title="По теме"
              description={`${topics.length} тем для практики`}
              onClick={() => setSelectedMode("by_topic")}
              color="green"
            />
            <ModeCard
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              title="Повторить ошибки"
              description={
                unresolvedMistakes.length > 0
                  ? `${unresolvedMistakes.length} неразобранных ошибок`
                  : "Нет ошибок — тренируйся!"
              }
              onClick={() => {
                if (unresolvedMistakes.length > 0) setSelectedMode("mistakes");
              }}
              disabled={unresolvedMistakes.length === 0}
              color="red"
            />
          </div>
        ) : isPhysics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModeCard
              icon={<span className="text-lg">⚡</span>}
              title="Формулы"
              description={`${formulaCount} вопросов по формулам`}
              onClick={() => handleStart({ mode: "by_formula", courseId: selectedCourseId })}
              disabled={formulaCount === 0}
              color="purple"
            />
            <ModeCard
              icon={<span className="text-lg">🔢</span>}
              title="Единицы"
              description={`${unitsCount} вопросов на перевод единиц`}
              onClick={() => handleStart({ mode: "by_units", courseId: selectedCourseId })}
              disabled={unitsCount === 0}
              color="cyan"
            />
            <ModeCard
              icon={<span className="text-lg">🧮</span>}
              title="Задачи в уме"
              description={`${mentalCount} задач для устного счёта`}
              onClick={() => handleStart({ mode: "by_mental", courseId: selectedCourseId })}
              disabled={mentalCount === 0}
              color="orange"
            />
            <ModeCard
              icon={<Zap className="h-5 w-5 text-blue-500" />}
              title="Смешанная тренировка"
              description="10 случайных заданий разной сложности"
              onClick={() => handleStart({ mode: "quick", courseId: selectedCourseId })}
              color="blue"
            />
            <ModeCard
              icon={<Filter className="h-5 w-5 text-green-600" />}
              title="По теме"
              description={`${topics.length} тем для практики`}
              onClick={() => setSelectedMode("by_topic")}
              color="green"
            />
            <ModeCard
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              title="Повторить ошибки"
              description={
                unresolvedMistakes.length > 0
                  ? `${unresolvedMistakes.length} неразобранных ошибок`
                  : "Нет ошибок — тренируйся!"
              }
              onClick={() => {
                if (unresolvedMistakes.length > 0) setSelectedMode("mistakes");
              }}
              disabled={unresolvedMistakes.length === 0}
              color="red"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModeCard
              icon={<Zap className="h-5 w-5 text-blue-500" />}
              title="Быстрая тренировка"
              description="10 случайных заданий разной сложности"
              onClick={() => handleStart({ mode: "quick", courseId: selectedCourseId })}
              color="blue"
            />
            <ModeCard
              icon={<Target className="h-5 w-5 text-yellow-500" />}
              title="По номеру задания"
              description={`${examNumbers.length} номеров заданий`}
              onClick={() => setSelectedMode("by_exam_number")}
              color="gold"
            />
            <ModeCard
              icon={<Filter className="h-5 w-5 text-green-600" />}
              title="По теме"
              description={`${topics.length} тем для практики`}
              onClick={() => setSelectedMode("by_topic")}
              color="green"
            />
            <ModeCard
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              title="По ошибкам"
              description={
                unresolvedMistakes.length > 0
                  ? `${unresolvedMistakes.length} неразобранных ошибок`
                  : "Нет ошибок — тренируйся!"
              }
              onClick={() => {
                if (unresolvedMistakes.length > 0) setSelectedMode("mistakes");
              }}
              disabled={unresolvedMistakes.length === 0}
              color="red"
            />
          </div>
        )}

        {/* Difficulty quick-select */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Быстрый старт по сложности
          </p>
          <div className="flex gap-2">
            {difficulties.map((d) => {
              const count = getAvailableQuestionCount(courseQuestions, { mode: "by_difficulty", courseId: selectedCourseId, difficulty: d.value });
              return (
                <Button
                  key={d.value}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={count === 0}
                  onClick={() => handleStart({ mode: "by_difficulty", courseId: selectedCourseId, difficulty: d.value })}
                >
                  <span>{d.emoji}</span>
                  <span>{d.label}</span>
                  <span className="text-muted-foreground text-xs">({count})</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Sub-selection screens ──────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setSelectedMode(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">
          {selectedMode === "by_exam_number" && "Выбери номер задания"}
          {selectedMode === "by_topic" && "Выбери тему"}
          {selectedMode === "by_difficulty" && "Выбери сложность"}
          {selectedMode === "mistakes" && "Тренировка по ошибкам"}
          {selectedMode === "by_formula" && "Тренировка по формулам"}
          {selectedMode === "by_units" && "Тренировка: единицы"}
          {selectedMode === "by_mental" && "Тренировка: задачи в уме"}
          {selectedMode === "by_gap" && "Вставить кусочек"}
          {selectedMode === "by_blitz" && "Блиц"}
        </h1>
      </div>

      {/* By exam number */}
      {selectedMode === "by_exam_number" && (
        examNumbers.length === 0 ? (
          <Card>
            <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Нет доступных номеров заданий</p>
              <Button variant="outline" onClick={() => setSelectedMode(null)}>
                Выбрать другой режим
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {examNumbers.map((num) => {
              const count = getQuestionsByExamNumber(num).filter(
                (q) => q.courseId === selectedCourseId
              ).length;
              return (
                <button
                  key={num}
                  onClick={() => handleStart({ mode: "by_exam_number", courseId: selectedCourseId, examNumber: num })}
                  className="rounded-lg border border-border bg-card p-3 text-center hover:bg-primary/5 hover:border-primary/30 transition-colors space-y-1 group"
                >
                  <div className="text-base font-bold text-primary group-hover:scale-105 transition-transform">
                    Задание {num}
                  </div>
                  <div className="text-xs text-muted-foreground">{count} вопр.</div>
                </button>
              );
            })}
          </div>
        )
      )}

      {/* By topic */}
      {selectedMode === "by_topic" && (
        <div className="space-y-2">
          {topics.map((topic) => {
            const count = getQuestionsByTopic(topic).filter(
              (q) => q.courseId === selectedCourseId
            ).length;
            return (
              <button
                key={topic}
                onClick={() => handleStart({ mode: "by_topic", courseId: selectedCourseId, topic })}
                className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/50 hover:border-primary/30 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{topic}</div>
                  <div className="text-xs text-muted-foreground">{count} вопросов</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      )}

      {/* By difficulty */}
      {selectedMode === "by_difficulty" && (
        <div className="space-y-2">
          {difficulties.map((d) => {
            const count = getAvailableQuestionCount(courseQuestions, { mode: "by_difficulty", courseId: selectedCourseId, difficulty: d.value });
            return (
              <button
                key={d.value}
                onClick={() => handleStart({ mode: "by_difficulty", courseId: selectedCourseId, difficulty: d.value })}
                className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{d.emoji}</span>
                  <div>
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs text-muted-foreground">{count} вопросов</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      )}

      {/* By mistakes */}
      {selectedMode === "mistakes" && (
        <div className="space-y-4">
          {unresolvedMistakes.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Нет неразобранных ошибок. Отличная работа!</p>
                <Button variant="outline" onClick={() => setSelectedMode(null)}>
                  Выбрать другой режим
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                У тебя <span className="font-semibold text-foreground">{unresolvedMistakes.length}</span> неразобранных ошибок.
                Повтори эти задания, чтобы закрепить материал.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() =>
                  handleStart({
                    mode: "mistakes",
                    courseId: selectedCourseId,
                    mistakeQuestionIds: unresolvedMistakes.map((m) => m.questionId),
                  })
                }
              >
                <Flame className="h-5 w-5" />
                Начать тренировку по ошибкам
              </Button>
            </>
          )}
        </div>
      )}

      {/* By formula */}
      {selectedMode === "by_formula" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formulaCount}</span> вопросов по формулам.
            Заполни пропуски в формулах и вспомни основные формулы.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart({ mode: "by_formula", courseId: selectedCourseId })}
          >
            <span className="text-lg mr-1">⚡</span>
            Начать тренировку по формулам
          </Button>
        </div>
      )}

      {/* By units */}
      {selectedMode === "by_units" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unitsCount}</span> вопросов на перевод единиц измерения.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart({ mode: "by_units", courseId: selectedCourseId })}
            disabled={unitsCount === 0}
          >
            <span className="text-lg mr-1">🔢</span>
            Начать тренировку: единицы
          </Button>
        </div>
      )}

      {/* By mental */}
      {selectedMode === "by_mental" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{mentalCount}</span> задач для устного счёта.
            Применяй формулы и считай в уме!
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart({ mode: "by_mental", courseId: selectedCourseId })}
            disabled={mentalCount === 0}
          >
            <span className="text-lg mr-1">🧮</span>
            Начать тренировку: задачи в уме
          </Button>
        </div>
      )}

      {/* By gap */}
      {selectedMode === "by_gap" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{gapCount}</span> вопросов с пропусками в формулах.
            Вставь недостающие части!
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart({ mode: "by_gap", courseId: selectedCourseId })}
            disabled={gapCount === 0}
          >
            <span className="text-lg mr-1">✏️</span>
            Начать тренировку: вставить кусочек
          </Button>
        </div>
      )}

      {/* By blitz */}
      {selectedMode === "by_blitz" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{blitzCount}</span> вопросов — быстрый микс всех типов.
            Формулы, пропуски, вычисления — всё в одном!
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart({ mode: "by_blitz", courseId: selectedCourseId })}
            disabled={blitzCount === 0}
          >
            <span className="text-lg mr-1">⚡</span>
            Начать блиц
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ──────────────────────────────

function ModeCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  color = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  color?: ModeCardColor;
}) {
  const scheme = modeCardColors[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border bg-card p-4 text-left transition-all space-y-2 disabled:opacity-50 disabled:cursor-not-allowed ${scheme.border} ${scheme.bg}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
          {icon}
        </div>
        <h2 className="font-semibold text-sm leading-tight">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground pl-0.5">{description}</p>
    </button>
  );
}

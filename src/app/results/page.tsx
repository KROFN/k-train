"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Trophy,
  Flame,
  Heart,
  BookOpen,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Snowflake,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProgressStore, HEARTS_FROZEN } from "@/store/progress-store";
import { useQuizStore } from "@/store/quiz-store";
import { useCourseStore } from "@/store/course-store";
import { getCourseById } from "@/data/courses";

export default function ResultsPage() {
  const router = useRouter();

  // Course store
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);

  // Progress store
  const hydrateProgress = useProgressStore((s) => s.hydrate);

  // Global stats
  const xp = useProgressStore((s) => s.getXp());
  const level = useProgressStore((s) => s.getLevel());
  const streak = useProgressStore((s) => s.getStreak());

  // Course-specific progress (use direct path + useMemo)
  const courseProgress = useProgressStore((s) => s.progress.courses[selectedCourseId]);
  const courseStats = useMemo(() => {
    const cp = courseProgress;
    return {
      hearts: cp?.hearts ?? 5,
      maxHearts: cp?.maxHearts ?? 5,
      totalAnswered: cp?.totalAnswered ?? 0,
      totalCorrect: cp?.totalCorrect ?? 0,
      byTopic: cp?.byTopic ?? {},
      mistakes: cp?.mistakes ?? [],
      accuracy: cp && cp.totalAnswered > 0 ? Math.round((cp.totalCorrect / cp.totalAnswered) * 100) : 0,
    };
  }, [courseProgress]);

  const hearts = HEARTS_FROZEN ? courseStats.maxHearts : courseStats.hearts;
  const maxHearts = courseStats.maxHearts;
  const accuracy = courseStats.accuracy;
  const totalAnswered = courseStats.totalAnswered;
  const totalCorrect = courseStats.totalCorrect;
  const byTopic = courseStats.byTopic;

  const unresolvedMistakes = useMemo(
    () => courseStats.mistakes.filter((m) => !m.resolved),
    [courseStats.mistakes]
  );

  // Last session attempts
  const session = useQuizStore((s) => s.session);
  const _lastAttempts = session?.attempts ?? [];
  const resetSession = useQuizStore((s) => s.resetSession);

  useEffect(() => {
    hydrateCourse();
    hydrateProgress();
  }, [hydrateCourse, hydrateProgress]);

  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = xp - (level - 1) * 100;
  const levelProgress = Math.min(100, Math.round((xpInCurrentLevel / 100) * 100));

  // Weak topics (accuracy < 60%, at least 2 answered)
  const weakTopics = useMemo(() => {
    return Object.entries(byTopic)
      .filter(([, tp]) => tp.answered >= 2 && tp.accuracy < 0.6)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .slice(0, 5);
  }, [byTopic]);

  // Strong topics (accuracy >= 80%, at least 2 answered)
  const strongTopics = useMemo(() => {
    return Object.entries(byTopic)
      .filter(([, tp]) => tp.answered >= 2 && tp.accuracy >= 0.8)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .slice(0, 3);
  }, [byTopic]);

  const hasNoProgress = totalAnswered === 0;

  const courseInfo = getCourseById(selectedCourseId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Результаты
        </h1>
        <p className="text-sm text-muted-foreground">
          {courseInfo?.title ?? "Курс"} · Твой прогресс и статистика
        </p>
      </div>

      {/* No progress yet */}
      {hasNoProgress && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Пока нет данных</p>
              <p className="text-xs text-muted-foreground">
                Пройди хотя бы одну тренировку, чтобы увидеть прогресс
              </p>
            </div>
            <Button onClick={() => router.push("/practice")}>
              Начать тренировку
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Has progress */}
      {!hasNoProgress && (
        <>
          {/* Visual score circle */}
          <Card>
            <CardContent className="flex items-center gap-6 py-4">
              <div className="relative shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted" />
                  <circle
                    cx="40" cy="40" r="34"
                    stroke="currentColor" strokeWidth="6" fill="none"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - accuracy / 100)}`}
                    strokeLinecap="round"
                    className={accuracy >= 80 ? "text-success" : accuracy >= 50 ? "text-gold" : "text-destructive"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{accuracy}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Общая точность</p>
                <p className="text-xs text-muted-foreground">
                  {totalCorrect} из {totalAnswered} правильных ответов
                </p>
                {accuracy >= 80 && <Badge variant="secondary" className="text-[10px]">Отлично!</Badge>}
                {accuracy >= 50 && accuracy < 80 && <Badge variant="outline" className="text-[10px]">Неплохо</Badge>}
                {accuracy < 50 && <Badge variant="destructive" className="text-[10px]">Нужно подтянуть</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Main stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} value={String(streak)} label="Streak" />
            <StatCard icon={<Trophy className="h-4 w-4 text-gold" />} value={String(xp)} label="XP" />
            {/* 🧊 Hearts frozen */}
            <StatCard
              icon={
                HEARTS_FROZEN
                  ? <Snowflake className="h-4 w-4 text-sky-400" />
                  : <Heart className="h-4 w-4 text-red-500" />
              }
              value={HEARTS_FROZEN ? "🧊" : `${hearts}/${maxHearts}`}
              label="Сердца"
              frozen={HEARTS_FROZEN}
            />
            <StatCard icon={<BookOpen className="h-4 w-4 text-primary" />} value={String(level)} label="Уровень" />
          </div>

          {/* Level progress */}
          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Уровень {level}</span>
                <span className="font-medium text-xs">{xp} / {xpForNextLevel} XP</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Weak topics */}
          {weakTopics.length > 0 && (
            <Card className="border-gold/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gold" />
                  Слабые места
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {weakTopics.map(([topic, tp]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs">{topic}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {tp.correct}/{tp.answered}
                      </span>
                      <span className="text-xs font-bold text-destructive w-10 text-right">
                        {Math.round(tp.accuracy * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href="/practice">Потренировать слабые темы</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Strong topics */}
          {strongTopics.length > 0 && (
            <Card className="border-success/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Сильные стороны
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {strongTopics.map(([topic, tp]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="truncate text-xs">{topic}</span>
                    <span className="text-xs font-bold text-success ml-auto">
                      {Math.round(tp.accuracy * 100)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Unresolved mistakes CTA */}
      {unresolvedMistakes.length > 0 && (
        <Card className="border-destructive/20">
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {unresolvedMistakes.length} ошибок ждёт разбора
              </p>
              <p className="text-xs text-muted-foreground">Повтори, чтобы закрепить</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/review">Разобрать</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1" onClick={() => { resetSession(); router.push("/practice"); }}>
          Новая тренировка
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/review">Разобрать ошибки</Link>
        </Button>
      </div>
    </div>
  );
}

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
    <div className={`rounded-lg border bg-card p-2.5 flex flex-col items-center gap-0.5 ${
      frozen ? "border-sky-400/30 bg-sky-50/30 dark:bg-sky-950/20" : "border-border"
    }`}>
      {icon}
      <span className={`text-lg font-bold ${frozen ? "text-sky-400" : ""}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

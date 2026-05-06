"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  BookOpen,
  Flame,
  Heart,
  Trophy,
  Target,
  ArrowRight,
  Zap,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  AlertCircle,
  ChevronDown,
  CheckCircle,
  Lock,
  Cloud,
  Snowflake,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useProgressStore, HEARTS_FROZEN } from "@/store/progress-store";
import { useCourseStore } from "@/store/course-store";
import { useCourseAccessStore } from "@/store/course-access-store";
import { useAuthStore } from "@/store/auth-store";
import { getAllCourses, getCourseById } from "@/data/courses";
import { requiresAccessCode } from "@/lib/access-code";
import { getQuestionsByCourseId } from "@/data/questions";
import type { CourseId } from "@/types/course";
import { AuthDialog } from "@/components/auth/AuthDialog";

export default function Home() {
  // Course store
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);
  const setSelectedCourse = useCourseStore((s) => s.setSelectedCourse);
  const _courseHydrated = useCourseStore((s) => s.hydrated);

  // Progress store
  const hydrateProgress = useProgressStore((s) => s.hydrate);

  // Course access store
  const hydrateAccess = useCourseAccessStore((s) => s.hydrate);
  const accessStoreAccess = useCourseAccessStore((s) => s.access);
  const tryUnlock = useCourseAccessStore((s) => s.tryUnlock);

  // Access code modal state
  const [accessModalCourseId, setAccessModalCourseId] = useState<CourseId | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState(false);

  // Auth state
  const authUser = useAuthStore((s) => s.user);
  const authAvailable = useAuthStore((s) => s.authAvailable);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Global stats
  const xp = useProgressStore((s) => s.getXp());
  const level = useProgressStore((s) => s.getLevel());
  const streak = useProgressStore((s) => s.getStreak());

  // Course-specific progress (use direct path + useMemo to avoid new refs)
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
      lastPracticeDate: null as string | null,
    };
  }, [courseProgress]);

  const globalLastPracticeDate = useProgressStore((s) => s.progress.global.lastPracticeDate);

  // Derive isAccessible from raw access data + requiresAccessCode
  const isAccessible = useMemo(() => {
    return (courseId: CourseId) => {
      if (!requiresAccessCode(courseId)) return true;
      return accessStoreAccess[courseId] === true;
    };
  }, [accessStoreAccess]);

  // Hydrate stores
  useEffect(() => {
    hydrateCourse();
    hydrateProgress();
    hydrateAccess();
  }, [hydrateCourse, hydrateProgress, hydrateAccess]);

  // Course info
  const selectedCourse = getCourseById(selectedCourseId);
  const courses = getAllCourses();
  const publicCourses = courses.filter((c) => !requiresAccessCode(c.id));
  const questionCount = getQuestionsByCourseId(selectedCourseId).length;
  const hasQuestions = questionCount > 0;

  // Derived stats
  const hearts = HEARTS_FROZEN ? courseStats.maxHearts : courseStats.hearts;
  const maxHearts = courseStats.maxHearts;
  const accuracy = courseStats.accuracy;
  const totalAnswered = courseStats.totalAnswered;
  const _totalCorrect = courseStats.totalCorrect;

  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = xp - (level - 1) * 100;
  const levelProgress = Math.min(100, Math.round((xpInCurrentLevel / 100) * 100));

  // Daily goal
  const today = new Date().toISOString().slice(0, 10);
  const practicedToday = globalLastPracticeDate === today;
  const dailyGoalProgress = practicedToday ? 100 : 0;

  // Hearts percentage — always 100% when frozen
  const heartsPercent = HEARTS_FROZEN ? 100 : (maxHearts > 0 ? Math.round((hearts / maxHearts) * 100) : 0);

  // Unresolved mistakes
  const unresolvedMistakes = useMemo(
    () => courseStats.mistakes.filter((m) => !m.resolved),
    [courseStats.mistakes]
  );

  // Hydration-safe mounted check — server returns false, client returns true
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Greeting based on time of day — deferred to client to avoid SSR/client mismatch
  const greeting = useMemo(() => {
    if (!mounted) return { text: "Привет", icon: <Sparkles className="h-5 w-5 text-primary" /> };
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Доброе утро", icon: <Sun className="h-5 w-5 text-gold" /> };
    if (hour >= 12 && hour < 17) return { text: "Добрый день", icon: <Coffee className="h-5 w-5 text-primary" /> };
    if (hour >= 17 && hour < 22) return { text: "Добрый вечер", icon: <Moon className="h-5 w-5 text-secondary" /> };
    return { text: "Доброй ночи", icon: <Moon className="h-5 w-5 text-muted-foreground" /> };
  }, [mounted]);

  // Top weak topics (accuracy < 60%, at least 2 answered)
  const weakTopics = useMemo(() => {
    return Object.entries(courseStats.byTopic)
      .filter(([, tp]) => tp.answered >= 2 && tp.accuracy < 0.6)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .slice(0, 3);
  }, [courseStats.byTopic]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Course selector */}
      <Card className="border-primary/20">
        <CardContent className="py-3">
          <details className="group" suppressHydrationWarning>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCourse?.icon ?? "📚"}</span>
                <div>
                  <p className="font-semibold text-sm leading-tight">{selectedCourse?.title ?? "Курс"}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasQuestions ? `${questionCount} вопросов` : "Скоро будет доступно"}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-1.5">
              {publicCourses.map((course) => {
                const courseQCount = getQuestionsByCourseId(course.id).length;
                const isActive = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className="text-lg">{course.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {courseQCount > 0 ? `${courseQCount} вопросов` : "Скоро"}
                      </p>
                    </div>
                    {isActive && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
              {/* Locked courses */}
              {courses.filter((c) => requiresAccessCode(c.id)).map((course) => {
                const accessible = isAccessible(course.id);
                if (accessible) {
                  const courseQCount = getQuestionsByCourseId(course.id).length;
                  const isActive = course.id === selectedCourseId;
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <span className="text-lg">{course.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {courseQCount > 0 ? `${courseQCount} вопросов` : "Скоро"}
                        </p>
                      </div>
                      {isActive && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                }
                return (
                  <button
                    key={course.id}
                    onClick={() => setAccessModalCourseId(course.id)}
                    className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/50 border border-transparent"
                  >
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">Требуется код доступа</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Greeting + CTA */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {greeting.icon}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting.text}
            {authUser?.email ? `, ${authUser.email.split("@")[0]}` : ""}!
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {practicedToday
            ? "Ты уже тренировался сегодня — так держать! 🎯"
            : streak > 0
              ? `Твой streak ${streak} ${streakDayWord(streak)} — не потеряй его!`
              : "Начни тренировку, чтобы запустить streak!"}
        </p>
        {hasQuestions ? (
          <Button
            size="lg"
            className={`w-full sm:w-auto transition-all ${
              !practicedToday
                ? "ring-2 ring-primary/40 ring-offset-2 shadow-md shadow-primary/20"
                : ""
            }`}
            asChild
          >
            <Link href="/practice">
              <Target className="h-5 w-5" />
              {practicedToday ? "Продолжить тренировку" : "Начать тренировку"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button size="lg" className="w-full sm:w-auto" disabled>
            <Sparkles className="h-5 w-5" />
            Скоро будет доступно
          </Button>
        )}
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-4 gap-2">
        {/* Streak — оранжевый акцент если streak > 0 */}
        <StatCard
          icon={
            <Flame
              className={`h-4 w-4 ${streak > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"}`}
            />
          }
          value={String(streak)}
          label="Streak"
          tint={streak > 0 ? "orange" : undefined}
        />
        {/* XP — золотистый акцент */}
        <StatCard
          icon={<Trophy className="h-4 w-4 text-yellow-500" />}
          value={String(xp)}
          label="XP"
          tint="gold"
        />
        {/* 🧊 Hearts frozen */}
        <StatCard
          icon={
            HEARTS_FROZEN
              ? <Snowflake className="h-4 w-4 text-sky-400" />
              : <Heart className="h-4 w-4 text-red-500" />
          }
          value={HEARTS_FROZEN ? "🧊" : String(hearts)}
          label="Сердца"
          tint={HEARTS_FROZEN ? "sky" : (!HEARTS_FROZEN && hearts <= 1 ? "red" : undefined)}
        />
        {/* Уровень */}
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-primary" />}
          value={String(level)}
          label="Уровень"
          tint="blue"
        />
      </section>

      {/* Level progress */}
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Уровень {level}</span>
            </div>
            <span className="text-xs text-muted-foreground">{xp} / {xpForNextLevel} XP</span>
          </div>
          <div className="relative">
            <Progress value={levelProgress} className="h-2.5" />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {xpForNextLevel - xpInCurrentLevel} XP до уровня {level + 1}
          </p>
        </CardContent>
      </Card>

      {/* Today goal + Hearts side by side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Daily goal */}
        <Card className={practicedToday ? "border-success/40 bg-success/5" : ""}>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${practicedToday ? "text-success" : "text-primary"}`} />
              <span className="text-sm font-medium">Цель на сегодня</span>
              {practicedToday && (
                <CheckCircle className="h-3.5 w-3.5 text-success ml-auto" />
              )}
            </div>
            <Progress
              value={dailyGoalProgress}
              className={`h-2 ${practicedToday ? "[&>div]:bg-success" : ""}`}
            />
            <p className="text-xs text-muted-foreground">
              {practicedToday ? "Выполнено сегодня ✓" : "0 / 1 тренировок"}
            </p>
          </CardContent>
        </Card>

        {/* Hearts — frozen state */}
        <Card className={HEARTS_FROZEN ? "border-sky-400/30 bg-sky-50/30 dark:bg-sky-950/20" : (!HEARTS_FROZEN && hearts <= 1) ? "border-destructive/30" : ""}>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {HEARTS_FROZEN
                  ? <Snowflake className="h-4 w-4 text-sky-400" />
                  : <Heart className={`h-4 w-4 ${hearts <= 1 ? "text-destructive" : "text-red-500"}`} />
                }
                <span className="text-sm font-medium">Сердца</span>
              </div>
              {HEARTS_FROZEN && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-500 bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded-full">
                  <Snowflake className="h-2.5 w-2.5" />
                  Скоро
                </span>
              )}
              {!HEARTS_FROZEN && hearts <= 1 && (
                <span className="text-xs font-semibold text-destructive">Мало!</span>
              )}
            </div>
            {HEARTS_FROZEN ? (
              <p className="text-xs text-sky-500/80">
                Система сердец пока заморожена — тренируйся без ограничений ❄️
              </p>
            ) : (
              <>
                <Progress value={heartsPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {hearts} / {maxHearts}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      {totalAnswered > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className={`text-lg font-bold ${accuracy >= 80 ? "text-success" : accuracy >= 50 ? "text-yellow-500" : "text-destructive"}`}>
                {accuracy}%
              </span>
              <span className="text-xs text-muted-foreground">Точность</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold">{totalAnswered}</span>
              <span className="text-xs text-muted-foreground">Ответов</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weak topics alert */}
      {weakTopics.length > 0 && (
        <Card className="border-yellow-400/40">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Слабые места</span>
              <span className="text-xs text-muted-foreground ml-auto">нужно подтянуть</span>
            </div>
            <div className="space-y-2.5">
              {weakTopics.map(([topic, tp]) => (
                <div key={topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[70%]">{topic}</span>
                    <span className="font-semibold text-destructive">
                      {Math.round(tp.accuracy * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.round(tp.accuracy * 100)}
                    className="h-1.5 [&>div]:bg-destructive"
                  />
                </div>
              ))}
            </div>
            {hasQuestions && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/practice">Потренировать слабые темы</Link>
              </Button>
            )}
          </CardContent>
        </Card>
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
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold mr-1">
                  {unresolvedMistakes.length}
                </span>
                {mistakeWord(unresolvedMistakes.length)} ждёт разбора
              </p>
              <p className="text-xs text-muted-foreground">Повтори, чтобы закрепить</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/review">Разобрать</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Access code modal */}
      {accessModalCourseId && (() => {
        const modalCourse = getCourseById(accessModalCourseId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{modalCourse?.icon ?? "🔒"}</span>
                  <div>
                    <h2 className="font-semibold text-sm">Введите код доступа</h2>
                    <p className="text-xs text-muted-foreground">{modalCourse?.title ?? "Курс"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Код доступа"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      setAccessError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const success = tryUnlock(accessModalCourseId, accessCode);
                        if (success) {
                          setSelectedCourse(accessModalCourseId);
                          setAccessModalCourseId(null);
                          setAccessCode("");
                          setAccessError(false);
                        } else {
                          setAccessError(true);
                        }
                      }
                    }}
                  />
                  {accessError && (
                    <p className="text-xs text-destructive font-medium">Неверный код</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const success = tryUnlock(accessModalCourseId, accessCode);
                      if (success) {
                        setSelectedCourse(accessModalCourseId);
                        setAccessModalCourseId(null);
                        setAccessCode("");
                        setAccessError(false);
                      } else {
                        setAccessError(true);
                      }
                    }}
                  >
                    Разблокировать
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAccessModalCourseId(null);
                      setAccessCode("");
                      setAccessError(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink
          href="/practice"
          icon={<Target className="h-4 w-4 text-primary" />}
          title="Выбрать практику"
          description={hasQuestions ? "Быстрая, по номеру, по теме или по ошибкам" : "Скоро будет доступно"}
          disabled={!hasQuestions}
        />
        <QuickLink
          href="/results"
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          title="Мой прогресс"
          description="Статистика, точность, слабые темы"
        />
      </section>

      {/* Cloud sync prompt for guests */}
      {authAvailable && !authUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Сохрани прогресс в облаке</p>
              <p className="text-xs text-muted-foreground">Войди в аккаунт, чтобы не потерять данные</p>
            </div>
            <Button size="sm" onClick={() => setAuthDialogOpen(true)}>
              Войти
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Auth dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}

// ─── Helpers ──────────────────────────────

type StatCardTint = "orange" | "gold" | "sky" | "red" | "blue";

function StatCard({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tint?: StatCardTint;
}) {
  const tintClasses: Record<StatCardTint, string> = {
    orange: "border-orange-300/50 bg-orange-50/60 dark:bg-orange-950/20",
    gold: "border-yellow-300/50 bg-yellow-50/60 dark:bg-yellow-950/20",
    sky: "border-sky-400/30 bg-sky-50/30 dark:bg-sky-950/20",
    red: "border-red-300/50 bg-red-50/60 dark:bg-red-950/20",
    blue: "border-primary/20 bg-primary/5",
  };
  const tintText: Record<StatCardTint, string> = {
    orange: "text-orange-600 dark:text-orange-400",
    gold: "text-yellow-600 dark:text-yellow-400",
    sky: "text-sky-500",
    red: "text-red-600 dark:text-red-400",
    blue: "text-primary",
  };

  return (
    <div className={`rounded-lg border bg-card p-2.5 flex flex-col items-center gap-0.5 transition-colors ${
      tint ? tintClasses[tint] : "border-border"
    }`}>
      {icon}
      <span className={`text-lg font-bold ${tint ? tintText[tint] : ""}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
  disabled = false,
}: {
  href: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-1 opacity-50 cursor-not-allowed">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          {icon}
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-4 space-y-1 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
    >
      <h3 className="font-semibold text-sm flex items-center gap-1.5">
        {icon}
        {title}
        <ArrowRight className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

function streakDayWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

function mistakeWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return "ошибок";
  if (mod10 === 1) return "ошибка";
  if (mod10 >= 2 && mod10 <= 4) return "ошибки";
  return "ошибок";
}

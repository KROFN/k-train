"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Dumbbell,
  PlayCircle,
  BarChart3,
  BookOpen,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseStore } from "@/store/course-store";
import { getCourseById } from "@/data/courses";
import { useAuthStore } from "@/store/auth-store";
import { ProfileButton } from "@/components/auth/ProfileButton";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/practice", label: "Практика", icon: Dumbbell },
  { href: "/session", label: "Тренировка", icon: PlayCircle },
  { href: "/results", label: "Результаты", icon: BarChart3 },
  { href: "/review", label: "Разбор", icon: BookOpen },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // Hydration-safe mounted check
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Course store
  const hydrateCourse = useCourseStore((s) => s.hydrate);
  const selectedCourseId = useCourseStore((s) => s.selectedCourseId);

  // Auth store
  const initializeAuth = useAuthStore((s) => s.initialize);

  useEffect(() => {
    hydrateCourse();
    // Initialize auth listener — returns unsubscribe function
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe();
    };
  }, [hydrateCourse, initializeAuth]);

  const isDark = theme === "dark";
  const courseInfo = getCourseById(selectedCourseId);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center gap-1 px-4 h-14 border-b border-border bg-card">
        <Link
          href="/"
          className="font-bold text-primary text-lg mr-6 tracking-tight flex items-center gap-1.5"
        >
          Тренажёр
          {courseInfo && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{courseInfo.shortTitle}</span>
            </>
          )}
        </Link>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <ProfileButton />
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Переключить тему"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-border bg-card pb-safe h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium transition-colors flex-1 min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="truncate text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        {/* Theme toggle on mobile */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium transition-colors min-w-[44px] text-muted-foreground"
            aria-label="Переключить тему"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="text-[10px]">Тема</span>
          </button>
        )}
      </nav>
    </>
  );
}

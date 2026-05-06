"use client";

// ============================================================
// ProfileButton — shows user avatar/login status in Navigation
// Phase 17: Auth and cloud progress
//
// Displays:
// - If logged in: avatar with initials + dropdown with profile info, logout
// - If guest: login button (only when Supabase is configured)
// - Sync status indicator when syncing
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogIn,
  LogOut,
  Loader2,
  Cloud,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { AuthDialog } from "@/components/auth/AuthDialog";

export function ProfileButton() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authAvailable = useAuthStore((s) => s.authAvailable);
  const loading = useAuthStore((s) => s.loading);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const signOut = useAuthStore((s) => s.signOut);

  // Don't show anything if Supabase is not configured
  if (!authAvailable) return null;

  // Loading state
  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Guest mode — show login button
  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAuthDialogOpen(true)}
          className="gap-1.5 text-sm"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Войти</span>
        </Button>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  // Logged in — show avatar + dropdown
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : "?";

  const syncIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case "success":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Cloud className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Sync indicator dot */}
            {syncStatus === "syncing" && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium truncate">
                {user.displayName ?? "Пользователь"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="gap-2 text-xs text-muted-foreground">
            {syncIcon()}
            {syncStatus === "syncing" && "Синхронизация..."}
            {syncStatus === "success" && "Синхронизировано"}
            {syncStatus === "error" && "Ошибка синхронизации"}
            {syncStatus === "idle" && "Облако подключено"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

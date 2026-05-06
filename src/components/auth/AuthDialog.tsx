"use client";

// ============================================================
// AuthDialog — login/register modal component
// Phase 17: Auth and cloud progress
//
// Supports:
// - Login with email/password
// - Register with email/password/display name
// - "Continue as guest" option
// - Error display with Russian translations
// ============================================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Введите email");
      return;
    }
    if (!password) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.success) {
      setEmail("");
      setPassword("");
      setError(null);
      onOpenChange(false);
    } else {
      setError(result.error ?? "Ошибка входа");
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Введите email");
      return;
    }
    if (!password || password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);
    const result = await signUp(email.trim(), password, displayName.trim() || undefined);
    setLoading(false);

    if (result.success) {
      setEmail("");
      setPassword("");
      setDisplayName("");
      setError(null);
      onOpenChange(false);
    } else {
      setError(result.error ?? "Ошибка регистрации");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      if (tab === "login") handleLogin();
      else handleRegister();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" />
            Войти в аккаунт
          </DialogTitle>
          <DialogDescription>
            Сохрани прогресс на всех устройствах
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "register"); setError(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Войти
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-sm font-medium">
                Имя (необязательно)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Как тебя зовут?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-sm font-medium">
                Пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Создать аккаунт
            </Button>
          </TabsContent>
        </Tabs>

        {/* Guest option */}
        <Card className="border-dashed">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Без аккаунта</p>
              <p className="text-xs text-muted-foreground">
                Прогресс сохраняется только на этом устройстве
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Продолжить
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

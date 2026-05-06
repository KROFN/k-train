"use client";

// ============================================================
// AuthSyncProvider — watches auth state and triggers cloud sync
// Phase 17: Auth and cloud progress
//
// This component:
// 1. Listens for auth state changes (login/logout)
// 2. On login: merges local + cloud progress
// 3. On logout: resets sync status
// 4. Wraps the app in layout.tsx
//
// Must be a client component.
// ============================================================

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useProgressStore } from "@/store/progress-store";

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const mergeOnLogin = useProgressStore((s) => s.mergeOnLogin);

  // Track the previous user ID to detect login/logout transitions
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Detect login: prevUserId was null, currentUserId is not null
    if (currentUserId && !prevUserId && session?.access_token) {
      // User just logged in — merge local and cloud progress
      mergeOnLogin(session.access_token);
    }

    // Detect logout: prevUserId was not null, currentUserId is null
    if (!currentUserId && prevUserId) {
      // User logged out — reset sync status
      useAuthStore.getState().setSyncStatus("idle");
    }

    prevUserIdRef.current = currentUserId;
  }, [user, session, initialized, mergeOnLogin]);

  return <>{children}</>;
}

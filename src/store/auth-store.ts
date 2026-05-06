// ============================================================
// Auth store — manages Supabase Auth state
// Phase 17: Auth and cloud progress
//
// IMPORTANT:
// - Guest mode always works — app does not require login
// - If Supabase is not configured, auth is disabled
// - Auth state is tracked here so other stores can react
// - Profile creation is handled via API route (server-side)
// ============================================================

import { create } from "zustand";
import {
  getSupabaseClient,
  isSupabaseConfigured,
  resetSupabaseClient,
} from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type AuthUser = {
  id: string;
  email: string | undefined;
  displayName: string | null;
  role: string;
};

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export type AuthStore = {
  /** Current auth user (null if guest / not logged in) */
  user: AuthUser | null;

  /** Current Supabase session (null if not logged in) */
  session: Session | null;

  /** Whether auth is loading (initial check) */
  loading: boolean;

  /** Whether the store has been initialized */
  initialized: boolean;

  /** Whether Supabase Auth is available (env vars configured) */
  authAvailable: boolean;

  /** Cloud sync status */
  syncStatus: SyncStatus;

  /** Last sync error message */
  syncError: string | null;

  // ---- Actions ----

  /** Initialize auth listener — call once on app mount */
  initialize: () => () => void;

  /** Sign up with email and password */
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;

  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;

  /** Sign out */
  signOut: () => Promise<void>;

  /** Set sync status */
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;

  /** Refresh the current session */
  refreshSession: () => Promise<void>;
};

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function mapUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: meta.display_name ?? session.user.email?.split("@")[0] ?? null,
    role: meta.role ?? "student",
  };
}

// -----------------------------------------------------------
// Store implementation
// -----------------------------------------------------------

export const useAuthStore = create<AuthStore>((set, _get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  authAvailable: false,
  syncStatus: "idle",
  syncError: null,

  initialize: () => {
    const configured = isSupabaseConfigured();
    set({ authAvailable: configured });

    if (!configured) {
      set({ loading: false, initialized: true });
      return () => {};
    }

    const client = getSupabaseClient();
    if (!client) {
      set({ loading: false, initialized: true });
      return () => {};
    }

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => {
        set({
          user: mapUser(session),
          session,
          loading: false,
          initialized: true,
        });
      }
    );

    // Also check initial session
    client.auth.getSession().then(({ data: { session } }) => {
      set({
        user: mapUser(session),
        session,
        loading: false,
        initialized: true,
      });
    }).catch(() => {
      set({ loading: false, initialized: true });
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  signUp: async (email, password, displayName) => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: "Supabase не настроен" };
    }

    try {
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName ?? null,
            role: "student",
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      // Create profile via API route
      const session = (await client.auth.getSession()).data.session;
      if (session) {
        try {
          await fetch("/api/auth/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              displayName: displayName ?? email.split("@")[0],
            }),
          });
        } catch (profileErr) {
          // Profile creation failed — user still exists in auth
          console.warn("[AuthStore] Profile creation failed:", profileErr);
        }
      }

      return { success: true };
    } catch {
      return { success: false, error: "Произошла ошибка при регистрации" };
    }
  },

  signIn: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: "Supabase не настроен" };
    }

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Произошла ошибка при входе" };
    }
  },

  signOut: async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn("[AuthStore] Sign out error:", err);
    }

    resetSupabaseClient();
    set({ user: null, session: null, syncStatus: "idle", syncError: null });
  },

  setSyncStatus: (status, error = null) => {
    set({ syncStatus: status, syncError: error });
  },

  refreshSession: async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data: { session } } = await client.auth.refreshSession();
      set({
        user: mapUser(session),
        session,
      });
    } catch (err) {
      console.warn("[AuthStore] Session refresh failed:", err);
    }
  },
}));

// -----------------------------------------------------------
// Error translation
// -----------------------------------------------------------

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Неверный email или пароль";
  }
  if (message.includes("User already registered")) {
    return "Пользователь с таким email уже существует";
  }
  if (message.includes("Password should be")) {
    return "Пароль слишком короткий (минимум 6 символов)";
  }
  if (message.includes("rate limit")) {
    return "Слишком много попыток. Попробуйте позже";
  }
  if (message.includes("Email not confirmed")) {
    return "Подтвердите email перед входом";
  }
  return message || "Ошибка аутентификации";
}

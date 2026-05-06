// ============================================================
// Supabase client for the multi-course study trainer
// Phase 15: Foundation — browser-safe, lazy initialization
//
// IMPORTANT:
// - If env vars are missing, returns null — app works without Supabase
// - Service role key is NEVER used here (only for server-side scripts)
// - Local MVP fallback is always available
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

/** Database schema types — will be extended as tables are added */
export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          title: string;
          short_title: string;
          description: string;
          subject: string;
          exam: string | null;
          visibility: string;
          access_type: string;
          icon: string;
          color: string;
          default_practice_mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          short_title: string;
          description: string;
          subject: string;
          exam?: string | null;
          visibility: string;
          access_type: string;
          icon: string;
          color: string;
          default_practice_mode: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          short_title?: string;
          description?: string;
          subject?: string;
          exam?: string | null;
          visibility?: string;
          access_type?: string;
          icon?: string;
          color?: string;
          default_practice_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_texts: {
        Row: {
          id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          body?: string;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          course_id: string;
          subject: string;
          exam: string | null;
          exam_number: number | null;
          topic: string;
          subtopic: string | null;
          difficulty: string;
          type: string;
          presentation: string | null;
          prompt: string;
          text_id: string | null;
          options: unknown | null;
          pairs: unknown | null;
          formula_template: unknown | null;
          numeric_config: unknown | null;
          correct_answer: unknown;
          explanation: unknown;
          tags: string[] | null;
          status: string;
          source: string | null;
          source_url: string | null;
          source_year: number | null;
          source_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          subject: string;
          exam?: string | null;
          exam_number?: number | null;
          topic: string;
          subtopic?: string | null;
          difficulty: string;
          type: string;
          presentation?: string | null;
          prompt: string;
          text_id?: string | null;
          options?: unknown | null;
          pairs?: unknown | null;
          formula_template?: unknown | null;
          numeric_config?: unknown | null;
          correct_answer: unknown;
          explanation: unknown;
          tags?: string[] | null;
          status?: string;
          source?: string | null;
          source_url?: string | null;
          source_year?: number | null;
          source_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          subject?: string;
          exam?: string | null;
          exam_number?: number | null;
          topic?: string;
          subtopic?: string | null;
          difficulty?: string;
          type?: string;
          presentation?: string | null;
          prompt?: string;
          text_id?: string | null;
          options?: unknown | null;
          pairs?: unknown | null;
          formula_template?: unknown | null;
          numeric_config?: unknown | null;
          correct_answer?: unknown;
          explanation?: unknown;
          tags?: string[] | null;
          status?: string;
          source?: string | null;
          source_url?: string | null;
          source_year?: number | null;
          source_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          course_id: string;
          selected_answer: unknown;
          correct_answer: unknown;
          is_correct: boolean;
          time_spent_ms: number | null;
          answered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          course_id: string;
          selected_answer: unknown;
          correct_answer: unknown;
          is_correct: boolean;
          time_spent_ms?: number | null;
          answered_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          course_id?: string;
          selected_answer?: unknown;
          correct_answer?: unknown;
          is_correct?: boolean;
          time_spent_ms?: number | null;
          answered_at?: string;
          created_at?: string;
        };
      };
      user_course_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          xp: number;
          level: number;
          hearts: number;
          max_hearts: number;
          total_answered: number;
          total_correct: number;
          by_topic: unknown | null;
          by_subtopic: unknown | null;
          by_exam_number: unknown | null;
          mistakes: unknown | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          xp?: number;
          level?: number;
          hearts?: number;
          max_hearts?: number;
          total_answered?: number;
          total_correct?: number;
          by_topic?: unknown | null;
          by_subtopic?: unknown | null;
          by_exam_number?: unknown | null;
          mistakes?: unknown | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          xp?: number;
          level?: number;
          hearts?: number;
          max_hearts?: number;
          total_answered?: number;
          total_correct?: number;
          by_topic?: unknown | null;
          by_subtopic?: unknown | null;
          by_exam_number?: unknown | null;
          mistakes?: unknown | null;
          updated_at?: string;
        };
      };
      access_codes: {
        Row: {
          id: string;
          course_id: string;
          code: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          code: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          code?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      user_course_access: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          granted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          granted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          granted_at?: string;
        };
      };
      import_batches: {
        Row: {
          id: string;
          source: string;
          course_id: string;
          total_questions: number;
          published_count: number;
          draft_count: number;
          error_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          course_id: string;
          total_questions: number;
          published_count?: number;
          draft_count?: number;
          error_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          course_id?: string;
          total_questions?: number;
          published_count?: number;
          draft_count?: number;
          error_count?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// -----------------------------------------------------------
// Lazy singleton client
// -----------------------------------------------------------

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Check if Supabase environment variables are configured.
 * Returns true only if both URL and anon key are present.
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Get the Supabase client instance.
 *
 * - Lazy initialization — only creates the client on first call
 * - Returns null if env vars are not configured
 * - Safe to call from browser code
 * - App must not crash if Supabase is not configured
 *
 * NOTE: This is browser-safe only. Do NOT use service role key here.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseInstance;
}

/**
 * Reset the Supabase client instance.
 * Useful for testing or when the user signs out.
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}

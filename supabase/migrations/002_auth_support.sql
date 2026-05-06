-- ============================================================
-- Migration: 002_auth_support.sql
-- Phase 17: Auth and cloud progress
--
-- This migration adds auth integration:
-- - Foreign key from profiles to auth.users
-- - Trigger to auto-create profile on user signup
-- - Updated RLS policies that work with real auth
-- ============================================================

-- -----------------------------------------------------------
-- 1. Add foreign key from profiles.id to auth.users(id)
-- -----------------------------------------------------------

-- First, delete any orphaned profiles that don't have matching auth.users
DELETE FROM public.profiles WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Add the foreign key constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------------------
-- 2. Auto-create profile on user signup
-- -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------
-- 3. Add profile insert policy (so trigger can work)
-- -----------------------------------------------------------

-- The handle_new_user function runs as SECURITY DEFINER (superuser),
-- so it bypasses RLS. But let's add a policy for direct inserts too.

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------
-- 4. Update attempts foreign key to reference auth.users
-- -----------------------------------------------------------

-- attempts.user_id already references profiles.id
-- which now references auth.users.id, so the chain is intact.
-- No changes needed.

-- -----------------------------------------------------------
-- 5. Add global progress table for cloud sync
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_global_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  streak INT NOT NULL DEFAULT 0,
  last_practice_date TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_global_progress_user ON public.user_global_progress(user_id);

CREATE TRIGGER set_user_global_progress_updated_at
  BEFORE UPDATE ON public.user_global_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for global progress
ALTER TABLE public.user_global_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own global progress"
  ON public.user_global_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own global progress"
  ON public.user_global_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own global progress"
  ON public.user_global_progress FOR UPDATE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- 6. Grant usage on public schema to anon and authenticated roles
-- -----------------------------------------------------------

-- These are needed for Supabase Auth to work with the public schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on courses and questions to anon and authenticated
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.question_texts TO anon;
GRANT SELECT ON public.question_texts TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.questions TO authenticated;

-- ============================================================
-- Migration: 001_multi_course_schema.sql
-- Phase 15: Supabase multi-course foundation
--
-- This migration creates the core tables for the multi-course
-- study trainer. It supports:
-- - Multiple courses (EGE Russian, OGE Physics, Belenkova Math)
-- - All question types (single_choice, multi_choice, text_input,
--   matching, formula_gap, numeric_input, flashcard_self_check)
-- - User progress per course
-- - Access codes for locked courses
-- - Import batches for admin question uploads
--
-- IMPORTANT:
-- - RLS is enabled on all user-facing tables
-- - Service role key bypasses RLS (for admin scripts only)
-- - Auth is not integrated yet — policies prepare for it
-- ============================================================

-- -----------------------------------------------------------
-- 1. courses
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,  -- russian, physics, math
  exam TEXT,              -- ege, oge, school
  visibility TEXT NOT NULL DEFAULT 'public',  -- public, locked
  access_type TEXT NOT NULL DEFAULT 'open',    -- open, local_code, cloud_access
  icon TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT 'blue',  -- blue, amber, purple, green, red
  default_practice_mode TEXT NOT NULL DEFAULT 'quick',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial courses
INSERT INTO public.courses (id, title, short_title, description, subject, exam, visibility, access_type, icon, color, default_practice_mode) VALUES
  ('ege_russian', 'ЕГЭ Русский язык', 'Русский', 'Подготовка к ЕГЭ по русскому языку', 'russian', 'ege', 'public', 'open', '📝', 'blue', 'quick'),
  ('oge_physics', 'ОГЭ Физика', 'Физика', 'Подготовка к ОГЭ по физике', 'physics', 'oge', 'public', 'open', '⚡', 'amber', 'quick'),
  ('belenkova_math', 'Режим Беленьковой', 'Беленькова', 'Формулы и задачи по математике', 'math', 'school', 'locked', 'local_code', '🧮', 'purple', 'quick')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- 2. question_texts
-- Reference texts that multiple questions can share
-- (e.g., a reading passage for EGE Russian tasks 1-3)
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.question_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 3. questions
-- Supports all local question types:
--   single_choice, multi_choice, text_input, matching,
--   formula_gap, numeric_input, flashcard_self_check
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,           -- russian, physics, math
  exam TEXT,                       -- ege, oge, school
  exam_number INT,                 -- optional task number
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty TEXT NOT NULL,        -- easy, medium, hard
  type TEXT NOT NULL,              -- single_choice, multi_choice, text_input, matching, formula_gap, numeric_input, flashcard_self_check
  presentation TEXT,               -- default, formula, compact, card
  prompt TEXT NOT NULL,
  text_id UUID REFERENCES public.question_texts(id) ON DELETE SET NULL,
  options JSONB,                   -- [{id, text}] — for choice types
  pairs JSONB,                     -- [{leftId, leftText, rightId, rightText}] — for matching
  formula_template JSONB,          -- {parts: [{kind, value/slotId, placeholder?}]} — for formula_gap
  numeric_config JSONB,            -- {kind, expectedUnit?, acceptedUnits?, tolerance?} — for numeric_input
  correct_answer JSONB NOT NULL,   -- discriminated union on "type"
  explanation JSONB NOT NULL,      -- {short, detailed?, rule?, examples?, answer?}
  tags TEXT[],                     -- e.g., ['formula', 'unit', 'mental']
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, published, archived
  source TEXT,                     -- manual, fipi, demo_pdf, other
  source_url TEXT,
  source_year INT,
  source_hash TEXT UNIQUE,         -- for deduplication
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON public.questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_course_status ON public.questions(course_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(course_id, topic);
CREATE INDEX IF NOT EXISTS idx_questions_exam_number ON public.questions(course_id, exam_number);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(course_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------
-- 4. profiles
-- Created on first login (Phase 17 will add auth integration)
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,             -- references auth.users(id) later
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',  -- student, admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------
-- 5. attempts
-- Records each answer attempt for logged-in users
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  selected_answer JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_course ON public.attempts(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON public.attempts(question_id);

-- -----------------------------------------------------------
-- 6. user_course_progress
-- Per-course progress for logged-in users
-- Mirrors the local CourseProgress structure
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  hearts INT NOT NULL DEFAULT 5,
  max_hearts INT NOT NULL DEFAULT 5,
  total_answered INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  by_topic JSONB,          -- Record<string, TopicProgress>
  by_subtopic JSONB,       -- Record<string, TopicProgress>
  by_exam_number JSONB,    -- Record<number, TopicProgress>
  mistakes JSONB,           -- MistakeRecord[]
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course ON public.user_course_progress(user_id, course_id);

CREATE TRIGGER set_user_course_progress_updated_at
  BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------
-- 7. access_codes
-- Codes that unlock locked courses
-- For cloud access (replaces local access code in Phase 14)
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_course ON public.access_codes(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_codes_course_code ON public.access_codes(course_id, code) WHERE active = true;

-- -----------------------------------------------------------
-- 8. user_course_access
-- Records which users have access to which locked courses
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_access_user ON public.user_course_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_access_course ON public.user_course_access(course_id);

-- -----------------------------------------------------------
-- 9. import_batches
-- Tracks bulk question imports from admin pipeline
-- (Phase 18 will use this)
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,             -- manual, fipi, demo_pdf, other
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  total_questions INT NOT NULL DEFAULT 0,
  published_count INT NOT NULL DEFAULT 0,
  draft_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_course ON public.import_batches(course_id);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================
-- Auth is not integrated yet (Phase 17), but we prepare RLS
-- so that when auth is added, data is already protected.
--
-- Current approach:
-- - Published questions are readable by everyone
-- - Locked course questions require access (future)
-- - Users can read/write their own progress
-- - Users can read/write their own attempts
-- - Admin tables require service key or admin role
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- Courses: anyone can read public courses
-- -----------------------------------------------------------

CREATE POLICY "Courses are readable by everyone"
  ON public.courses FOR SELECT
  USING (true);

-- -----------------------------------------------------------
-- Question texts: anyone can read (they are reference material)
-- -----------------------------------------------------------

CREATE POLICY "Question texts are readable by everyone"
  ON public.question_texts FOR SELECT
  USING (true);

-- -----------------------------------------------------------
-- Questions: published questions readable by everyone
-- Locked course questions only readable by users with access
-- -----------------------------------------------------------

CREATE POLICY "Published questions are readable by everyone"
  ON public.questions FOR SELECT
  USING (
    -- Published questions in public courses
    (status = 'published' AND course_id IN (
      SELECT id FROM public.courses WHERE visibility = 'public'
    ))
    OR
    -- Questions in locked courses where user has access
    -- (auth.uid() will be null until Phase 17, so this is preparatory)
    (course_id IN (
      SELECT course_id FROM public.user_course_access
      WHERE user_id = auth.uid()
    ))
  );

-- -----------------------------------------------------------
-- Profiles: users can read their own profile
-- -----------------------------------------------------------

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- -----------------------------------------------------------
-- Attempts: users can read/write their own attempts
-- -----------------------------------------------------------

CREATE POLICY "Users can read own attempts"
  ON public.attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attempts"
  ON public.attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------
-- User course progress: users can read/write their own progress
-- -----------------------------------------------------------

CREATE POLICY "Users can read own course progress"
  ON public.user_course_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own course progress"
  ON public.user_course_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own course progress"
  ON public.user_course_progress FOR UPDATE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- Access codes: not readable by regular users
-- Validation happens server-side
-- -----------------------------------------------------------

-- No SELECT policy for access_codes — only service key can read
-- (Prevents users from seeing actual access codes)

-- -----------------------------------------------------------
-- User course access: users can read their own access grants
-- -----------------------------------------------------------

CREATE POLICY "Users can read own course access"
  ON public.user_course_access FOR SELECT
  USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- Import batches: admin only (service key)
-- No policies for regular users
-- -----------------------------------------------------------

-- No policies for import_batches — only service key can access

-- ============================================================
-- Grant statements for service role (admin scripts)
-- ============================================================

-- Service role already has full access via superuser bypass
-- These grants are for documentation / future use

-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

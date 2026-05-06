# roadmap_v2.md — Multi-Course Expansion

> Continuation roadmap after Phase 10.  
> Target agent: GLM-5.1 / coding agent.  
> Status: Phase 1–10 are assumed completed as local deploy-ready MVP for EGE Russian.  
> This roadmap covers Phase 11–19.

---

## 0. Context for AI Agent

Before every phase:

1. Read `architecture.md`.
2. Read this file: `roadmap_v2.md`.
3. Execute only the current phase.
4. Do not jump ahead.
5. Do not add Supabase/auth/parser before the phase explicitly asks for it.
6. Preserve the existing working EGE Russian MVP.
7. Run checks after every phase.
8. Fix errors before reporting completion.

---

## 1. Current State

The project currently is a local MVP:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Zustand.
- Zod.
- localStorage progress.
- EGE Russian course implemented as the only implicit course.
- Quiz flow works: Home → Practice → Session → Results → Review.
- No Supabase.
- No auth.
- No parser.
- No cloud progress.

The next goal is to evolve the app from:

```txt
EGE Russian Trainer
```

into:

```txt
Multi-course study trainer
```

Initial courses:

```txt
ege_russian      — public
oge_physics      — public
belenkova_math   — locked by local access code first, real access later via Supabase
```

---

## 2. Critical Product Direction

The app is no longer only an EGE Russian trainer.

It must become a course-agnostic learning trainer with:

- one quiz engine;
- one progress system;
- one mistakes/review system;
- multiple courses;
- course-specific content;
- course-specific practice modes;
- later Supabase sync;
- later admin import pipeline;
- later FIPI parser.

Do not implement course-specific hacks inside the quiz engine.

Bad:

```ts
if (courseId === "oge_physics") {
  // special quiz logic here
}
```

Good:

```txt
Question → QuestionRenderer → answer-checking → progress
```

The core engine works with generic `Question` objects.

---

## 3. Global Rules for Phase 11–19

### 3.1. Do not break EGE Russian

Every phase must preserve the existing Russian course behavior.

After each phase, verify:

- EGE Russian quick practice works.
- Answer checking works.
- Results page works.
- Review mistakes works.
- localStorage progress does not crash.

### 3.2. Course isolation is mandatory

Progress, mistakes, topics, stats and practice filters must not mix between courses.

Wrong:

```txt
Russian mistakes appear in Physics review.
Belenkova topics appear in Russian practice.
Physics accuracy changes Russian dashboard.
```

Correct:

```txt
Each course has separate course progress.
```

### 3.3. `examNumber` must become optional

EGE Russian uses exam numbers.

Physics and Belenkova may not always use exam numbers.

Therefore:

```ts
examNumber?: number;
```

UI must not assume every question has `examNumber`.

If missing, show topic/subtopic instead.

### 3.4. Access code in local MVP is not real security

For Belenkova Mode before Supabase:

- local access code only hides the course in UI;
- it is not real security;
- it can be bypassed from DevTools;
- real protection comes later with Supabase Auth + RLS.

This must be documented in code comments or architecture notes.

### 3.5. Do not implement drag-and-drop first

For formula gaps:

- first implement click-to-fill;
- drag-and-drop is future optional polish.

Click-to-fill is simpler, mobile-friendly, and reliable.

### 3.6. Do not implement “write formula from scratch” in MVP

Formula free input is not required now.

Reasons:

- multiple equivalent forms;
- symbol normalization;
- math expression equivalence;
- Cyrillic/Latin variables;
- powers, roots, fractions;
- spaces and formatting.

Use controlled interactions instead:

- choose formula from list;
- insert missing part;
- solve simple numeric problem.

---

## 4. Required Checks After Every Phase

Run:

```bash
bun run lint
bun run build
```

If the project uses npm instead:

```bash
npm run lint
npm run build
```

Recommended additional check:

```bash
npx tsc --noEmit
```

Phase is not complete if:

- build fails;
- lint fails;
- app crashes on empty localStorage;
- EGE Russian flow is broken;
- new course progress leaks into another course;
- hidden Belenkova course is visible without unlock.

---

# Phase 11 — Multi-course architecture

## Goal

Refactor the app from single-course EGE Russian into a multi-course trainer without adding new question types or new physics/Belenkova content yet.

This phase must prepare the architecture.

## Tasks

### 11.1. Add course model

Create:

```txt
src/types/course.ts
src/data/courses.ts
```

Define:

```ts
export type CourseId =
  | "ege_russian"
  | "oge_physics"
  | "belenkova_math";

export type Subject =
  | "russian"
  | "physics"
  | "math";

export type ExamKind =
  | "ege"
  | "oge"
  | "school";

export type Course = {
  id: CourseId;
  title: string;
  shortTitle: string;
  description: string;
  subject: Subject;
  exam?: ExamKind;
  visibility: "public" | "locked";
  accessType: "open" | "local_code" | "cloud_access";
  icon: string;
  color: "blue" | "amber" | "purple" | "green" | "red";
  defaultPracticeMode: string;
};
```

Initial courses:

```txt
ege_russian
oge_physics
belenkova_math
```

Only `ege_russian` has actual content in this phase.

### 11.2. Add courseId to Question

Update `Question` type:

```ts
courseId: CourseId;
subject: Subject;
exam?: ExamKind;
examNumber?: number;
subtopic?: string;
presentation?: "default" | "formula" | "compact" | "card";
tags?: string[];
```

Make `examNumber` optional.

### 11.3. Update all existing Russian seed questions

All current Russian questions must get:

```ts
courseId: "ege_russian",
subject: "russian",
exam: "ege",
```

Do not change their educational content unless necessary.

### 11.4. Update validators

Update Zod schemas:

- validate `courseId`;
- validate optional `examNumber`;
- validate `subject`;
- validate `exam`;
- preserve old checks for options/pairs/correctAnswer.

### 11.5. Add selected course state

Create or update:

```txt
src/store/course-store.ts
```

Responsibilities:

- selectedCourseId;
- setSelectedCourse(courseId);
- getSelectedCourse();
- persist selected course to localStorage.

Default:

```txt
ege_russian
```

### 11.6. Update practice-builder

Practice builder must accept courseId:

```ts
buildPracticeQuestions({
  courseId,
  mode,
  count,
  examNumber,
  topic,
  difficulty,
  mistakeQuestionIds,
})
```

All helper functions must become course-aware:

```ts
getAllTopics(courseId)
getAllExamNumbers(courseId)
getQuestionsByTopic(courseId, topic)
getQuestionsByDifficulty(courseId, difficulty)
getAvailableQuestionCount(courseId, config)
```

### 11.7. Progress schema v2

Update progress model so course-specific data does not mix.

Recommended:

```ts
export type UserProgressV2 = {
  schemaVersion: 2;
  selectedCourseId: CourseId;
  global: {
    xp: number;
    level: number;
    streak: number;
    lastPracticeDate: string | null;
  };
  courses: Record<CourseId, CourseProgress>;
};
```

```ts
export type CourseProgress = {
  courseId: CourseId;
  xp: number;
  level: number;
  hearts: number;
  maxHearts: number;
  totalAnswered: number;
  totalCorrect: number;
  mistakes: MistakeRecord[];
  byTopic: Record<string, TopicProgress>;
  bySubtopic: Record<string, TopicProgress>;
  byExamNumber?: Record<number, TopicProgress>;
};
```

### 11.8. Migrate old localStorage progress

If old progress exists without `schemaVersion`, treat it as `ege_russian` progress.

Do not lose existing user progress.

Use new storage keys:

```ts
study-trainer:progress:v2
study-trainer:attempts:v2
study-trainer:settings:v2
study-trainer:course-access:v1
```

Optionally keep read-only migration from old keys:

```ts
ege-russian-trainer:progress
ege-russian-trainer:attempts
ege-russian-trainer:settings
```

### 11.9. Update UI to show course selector

Home page must show courses:

- EGE Russian — available;
- OGE Physics — available but can show “coming soon” if no content yet;
- Belenkova Mode — locked.

For Phase 11, only EGE Russian must be fully usable.

### 11.10. Update Results/Review/Practice

All pages must use selected course.

- Practice shows topics for selected course only.
- Review shows mistakes for selected course only.
- Results shows progress for selected course only.
- Dashboard shows selected course stats.

## Acceptance Criteria

- Existing EGE Russian practice still works.
- All Russian questions have courseId.
- Progress and mistakes are course-scoped.
- Old localStorage progress migrates safely.
- `examNumber` can be absent without UI crash.
- Belenkova course is not accessible yet.
- `bun run lint` passes.
- `bun run build` passes.

## Notes for GLM-5.1

This is a refactor phase. Do not add physics content yet.  
Do not add Supabase.  
Do not add new formula question types.  
Make the architecture ready first.

---

# Phase 12 — Formula and numeric question types

## Goal

Add the new question types required for OGE Physics and Belenkova Mode, but do not add full course content yet.

## New Question Types

Add:

```ts
type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "text_input"
  | "matching"
  | "formula_gap"
  | "numeric_input"
  | "flashcard_self_check";
```

Do not add `formula_choice` as a separate type yet.  
Use `single_choice` with:

```ts
presentation: "formula"
```

Do not add `unit_conversion` as a separate type yet.  
Use `numeric_input` with:

```ts
numericConfig.kind = "unit_conversion"
```

## Tasks

### 12.1. Add formula template model

Create:

```ts
export type FormulaTemplatePart =
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "slot";
      slotId: string;
      placeholder?: string;
    };

export type FormulaTemplate = {
  parts: FormulaTemplatePart[];
};
```

### 12.2. Add numeric config

Create:

```ts
export type NumericQuestionKind =
  | "plain"
  | "unit_conversion"
  | "mental_formula_problem";

export type NumericConfig = {
  kind: NumericQuestionKind;
  expectedUnit?: string;
  acceptedUnits?: string[];
  tolerance?: number;
};
```

### 12.3. Extend CorrectAnswer

Add:

```ts
{
  type: "numeric";
  value: number;
  unit?: string;
  acceptedUnits?: string[];
  tolerance?: number;
}
```

Add:

```ts
{
  type: "slots";
  value: Record<string, string>;
}
```

Add self-check support:

```ts
{
  type: "self_check";
  value: "known";
}
```

### 12.4. Extend UserAnswer

Add:

```ts
{
  type: "numeric";
  value: string;
}
```

Add:

```ts
{
  type: "slots";
  value: Record<string, string>;
}
```

Add:

```ts
{
  type: "self_check";
  value: "known" | "unknown";
}
```

### 12.5. Update validators

Zod must validate:

- `formula_gap` requires `formulaTemplate`;
- `formula_gap` requires options;
- `formula_gap` requires `correctAnswer.type === "slots"`;
- `numeric_input` requires `correctAnswer.type === "numeric"`;
- `flashcard_self_check` requires explanation/rule/answer reveal;
- `single_choice` with `presentation: "formula"` still uses normal single answer.

### 12.6. Update answer-checking

Implement:

#### numeric

Rules:

- user input is string;
- trim;
- replace comma with dot;
- parse first number from string;
- compare with tolerance;
- unit is optional in MVP unless explicitly required later;
- accept `3`, `3.0`, `3,0`, `3 А`, `3А`.

#### slots

Rules:

- compare every slotId in correct answer;
- all slots must match;
- extra user slots are ignored or treated as wrong consistently.

#### self_check

Rules:

- `known` = correct;
- `unknown` = wrong;
- this is self-reported and should be marked in attempt data if possible.

### 12.7. Add UI components

Create:

```txt
src/components/questions/FormulaGapQuestion.tsx
src/components/questions/NumericInputQuestion.tsx
src/components/questions/FlashcardSelfCheckQuestion.tsx
```

Update `QuestionRenderer`.

### 12.8. Formula gap UI

Use click-to-fill.

Example UI:

```txt
(a + b)² = a² + [ ? ] + b²

[ 2ab ] [ ab ] [ 2a ] [ 2b ]
```

Do not implement drag-and-drop in this phase.

### 12.9. Numeric input UI

Simple input:

```txt
Answer: [_____]
```

If expected unit exists, display:

```txt
Ответ в А
```

Do not require the unit in MVP unless future task asks for strict unit checking.

### 12.10. Add test seed questions

Add 2–3 test questions for each new type, preferably assigned to future courses:

- `oge_physics`;
- `belenkova_math`.

But do not yet build full course content.

## Acceptance Criteria

- New types compile.
- QuestionRenderer supports all new types.
- answer-checking supports numeric/slots/self-check.
- Existing Russian questions still work.
- No drag-and-drop dependency.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

This is an engine phase.  
Keep content minimal.  
Do not implement full OGE Physics course yet.  
Do not implement Belenkova access yet.  
Do not add Supabase.

---

# Phase 13 — OGE Physics local MVP

## Goal

Add the public OGE Physics course with local seed content.

This course focuses on:

- formulas;
- units;
- unit conversions;
- simple mental problems from the first part of OGE;
- no long calculations;
- no lab work;
- no full variants yet.

## Tasks

### 13.1. Activate OGE Physics course

The course card must be accessible:

```txt
oge_physics
```

User can select it and start practice.

### 13.2. Add physics question content

Add 40–60 physics questions.

Use these sections:

```txt
Механические явления
Тепловые явления
Электромагнитные явления
Квантовые явления
Единицы и переводы
```

Recommended topics:

```txt
Механика:
- скорость, путь, время
- плотность
- сила тяжести
- вес
- давление
- архимедова сила
- работа
- мощность
- энергия

Теплота:
- количество теплоты
- нагревание
- плавление
- сгорание топлива
- КПД

Электричество:
- сила тока
- напряжение
- сопротивление
- закон Ома
- последовательное соединение
- параллельное соединение
- работа тока
- мощность тока

Оптика:
- отражение
- преломление
- линзы
- оптическая сила

Единицы:
- мА ↔ А
- кОм ↔ Ом
- кДж ↔ Дж
- км/ч ↔ м/с
- см² ↔ м²
- г/см³ ↔ кг/м³
```

### 13.3. Practice modes for physics

Add course-specific practice mode labels:

```txt
Формулы
Единицы
Задачи в уме
Смешанная тренировка
Повторить ошибки
```

Implementation can reuse generic filters:

- formulas = formula-like question tags/types;
- units = numericConfig.kind === "unit_conversion";
- mental problems = numericConfig.kind === "mental_formula_problem";
- mixed = all physics questions.

### 13.4. Add physics dashboard data

For selected `oge_physics`, dashboard must show:

- course title;
- streak/global activity;
- physics XP or course XP;
- physics accuracy;
- weak physics topics;
- physics mistakes.

### 13.5. Ensure no Russian/Physics mixing

Verify:

- Russian practice does not show physics questions.
- Physics practice does not show Russian questions.
- Review page filters by selected course.
- Results page filters by selected course.

## Acceptance Criteria

- OGE Physics course is selectable.
- User can complete a full physics session.
- At least 40 physics questions exist.
- Physics supports formulas, units, and mental numeric tasks.
- Physics progress is separate from Russian progress.
- Russian MVP still works.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

Do not overbuild OGE Physics.  
No full variants.  
No long-form tasks.  
No lab tasks.  
No parser yet.

---

# Phase 14 — Belenkova Mode local locked MVP

## Goal

Add a locked Belenkova Mode course with local access code and formula-focused drills.

This is not real security yet. It only hides the course in the local MVP.

## Product Requirements

Belenkova Mode must focus on:

- formula repetition;
- choose formula from list;
- insert missing formula part;
- simple mental formula tasks;
- no free formula typing;
- no complex symbolic parser.

## Tasks

### 14.1. Add local access code system

Create:

```txt
src/lib/access-code.ts
src/store/course-access-store.ts
```

Local unlock example:

```ts
const LOCAL_ACCESS_CODES = {
  belenkova_math: "BELENKOVA2026",
};
```

Use a constant, but add a comment:

```txt
This is not real security. Real protection requires Supabase RLS later.
```

Store unlock in localStorage:

```txt
study-trainer:course-access:v1
```

### 14.2. Locked course UI

Belenkova course card must show locked state.

When clicked:

- show access code modal/page;
- ask for code;
- unlock on success;
- show error on wrong code;
- persist unlock.

### 14.3. Add Belenkova content

Add 20–40 local questions.

Recommended blocks:

```txt
Формулы сокращённого умножения
Степени
Корни
Логарифмы
Тригонометрия
Геометрия
Производная / первообразная, если нужно
```

Question types:

- `single_choice` with `presentation: "formula"`;
- `formula_gap`;
- `numeric_input`;
- optional `flashcard_self_check`.

### 14.4. Practice modes for Belenkova

Modes:

```txt
Формулы
Вставить кусочек
Мини-задачи
Блиц
Повторить ошибки
```

### 14.5. Access constraints

If Belenkova is locked:

- it must not be selectable as current course;
- its practice modes must not be accessible through UI;
- its questions must not appear in public course practice;
- direct route to session with belenkova course should redirect or show locked state.

### 14.6. Unlock persistence

After refresh, unlocked course remains available.

Add reset/relock option in settings if convenient.

## Acceptance Criteria

- Locked course card is visible.
- Wrong code does not unlock.
- Correct code unlocks.
- Unlock persists in localStorage.
- Belenkova practice works after unlock.
- Belenkova progress is separate.
- Belenkova content does not leak into Russian/Physics.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

Do not pretend local access code is secure.  
Do not add Supabase yet.  
Do not implement formula free input.  
Do not implement drag-and-drop yet.

---

# Phase 15 — Supabase multi-course foundation

## Goal

Add Supabase foundation for multi-course data, but preserve local MVP fallback.

Supabase is needed for:

- accounts;
- cloud progress;
- central question database;
- future admin imports;
- real private course access.

## Tasks

### 15.1. Install Supabase client

Install:

```bash
bun add @supabase/supabase-js
```

or npm equivalent.

### 15.2. Environment variables

Create/update:

```txt
.env.example
```

with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Important:

- service role key must never be used in frontend;
- service role key is only for local admin scripts.

### 15.3. Client

Create:

```txt
src/lib/supabase/client.ts
```

Requirements:

- browser-safe;
- lazy initialization;
- if env is missing, return null or disabled client;
- app must not crash without env;
- local MVP must still work.

### 15.4. Supabase migrations

Create:

```txt
supabase/migrations/001_multi_course_schema.sql
```

Tables:

```txt
courses
question_texts
questions
profiles
attempts
user_course_progress
access_codes
user_course_access
import_batches
```

### 15.5. questions table

Must support all local question types.

Suggested columns:

```sql
id uuid primary key
course_id text not null
subject text not null
exam text
exam_number int
topic text not null
subtopic text
difficulty text not null
type text not null
presentation text
prompt text not null
text_id uuid references question_texts(id)
options jsonb
pairs jsonb
formula_template jsonb
numeric_config jsonb
correct_answer jsonb not null
explanation jsonb not null
tags text[]
status text not null default 'draft'
source text
source_url text
source_year int
source_hash text unique
created_at timestamptz default now()
updated_at timestamptz default now()
```

### 15.6. RLS policies

Enable RLS where appropriate.

Basic rules:

- published public questions readable by everyone;
- private/locked course questions require access later;
- users can read/write their own progress;
- users can read/write their own attempts;
- admin-only import tables require admin role or service key.

Do not overcomplicate if auth is not integrated yet, but prepare schema.

### 15.7. Preserve local fallback

Do not switch app fully to Supabase yet.

At the end of this phase:

- local questions still work;
- localStorage progress still works;
- app builds without env;
- Supabase schema exists.

## Acceptance Criteria

- Supabase client exists.
- Migrations exist.
- App builds without Supabase env.
- No service role key in frontend.
- Local MVP still works.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

This is a foundation phase, not a full migration.  
Do not replace local question source yet.  
Do not add auth UI yet unless explicitly requested.

---

# Phase 16 — Questions from Supabase with local fallback

## Goal

Allow frontend to load questions from Supabase while keeping local seed fallback.

## Tasks

### 16.1. Create question service

Create:

```txt
src/services/question-service.ts
```

Functions:

```ts
getQuestionsFromSupabase(courseId)
getQuestionsFromLocalSeed(courseId)
getQuestionsWithFallback(courseId)
```

### 16.2. Map Supabase rows to Question

Create mapper:

```txt
src/lib/mappers/question-mapper.ts
```

Requirements:

- convert DB row to `Question`;
- validate with Zod;
- skip invalid questions safely;
- log dev warning, not crash UI.

### 16.3. Update practice builder

Practice builder should be able to work with questions passed in from service.

Avoid hard dependency on local seed inside the builder.

Better:

```ts
buildPracticeQuestions(questions, config)
```

instead of:

```ts
buildPracticeQuestions(config) // internally imports all questions
```

### 16.4. Loading states

Practice/session must handle:

- loading questions;
- Supabase failure;
- fallback to local seed;
- zero questions available.

### 16.5. Published-only

Frontend should load only:

```txt
status = published
```

Unless admin mode is implemented later.

### 16.6. Seed upload script

Create script:

```txt
scripts/upload-local-questions-to-supabase.ts
```

Responsibilities:

- read local questions;
- validate;
- upsert into Supabase;
- set status = published for existing MVP content;
- never expose service role key to frontend.

## Acceptance Criteria

- App can load questions from Supabase when configured.
- App falls back to local seed if Supabase unavailable.
- Practice works from Supabase questions.
- Invalid DB questions do not crash app.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

Do not remove local seed.  
Do not require login.  
Do not build admin parser yet.

---

# Phase 17 — Auth and cloud progress

## Goal

Add accounts and cloud progress sync.

Guest mode must remain.

## Tasks

### 17.1. Supabase Auth

Add simple auth:

- email/password or magic link;
- login page;
- register page;
- logout.

Do not add Google/Apple unless explicitly requested.

### 17.2. Profiles

Create profile on first login.

Fields:

```txt
id
display_name
role
created_at
updated_at
```

Default role:

```txt
student
```

### 17.3. Progress service

Create:

```txt
src/services/progress-service.ts
```

Functions:

```ts
loadCloudProgress(userId)
saveCloudProgress(userId, progress)
mergeLocalAndCloudProgress(local, cloud)
syncAttempt(userId, attempt)
```

### 17.4. Merge local progress on login

When user logs in:

- load local progress;
- load cloud progress;
- merge safely;
- save merged progress to cloud;
- keep local cache.

Merge rules:

- totalAnswered/totalCorrect should not double count if attempts have ids;
- mistakes merged by questionId;
- streak uses latest lastPracticeDate and safest non-destructive logic;
- XP uses max or recomputed strategy, document choice.

### 17.5. Cloud attempts

Attempts should be saved to Supabase for logged-in users.

Guest attempts remain local.

### 17.6. UI

Add:

- profile/login area;
- user status;
- sync status if simple;
- “continue as guest” option.

## Acceptance Criteria

- Guest mode still works.
- User can register/login.
- Logged-in user has cloud progress.
- Local progress is not lost on login.
- Progress survives reload and another browser/device.
- RLS prevents users reading others’ progress.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

Do not remove guest mode.  
Do not force login.  
Do not overbuild social auth.  
Cloud progress must be per course.

---

# Phase 18 — Admin import pipeline

## Goal

Prepare a controlled pipeline for importing questions into Supabase before building the FIPI parser.

This phase is about import contracts, validation, deduplication and safe upload.

## Tasks

### 18.1. Define parsed question format

Create:

```txt
docs/import_contract.md
src/lib/import/parsed-question-schema.ts
```

Parsed question format must include:

```ts
{
  externalId?: string;
  source: "manual" | "fipi" | "demo_pdf" | "other";
  sourceUrl?: string;
  sourceYear?: number;
  courseId: CourseId;
  subject: Subject;
  exam?: ExamKind;
  examNumber?: number;
  topic: string;
  subtopic?: string;
  difficulty?: QuestionDifficulty;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  pairs?: MatchingPair[];
  formulaTemplate?: FormulaTemplate;
  numericConfig?: NumericConfig;
  correctAnswer?: CorrectAnswer;
  explanation?: QuestionExplanation;
  tags?: string[];
  confidenceScore?: number;
}
```

### 18.2. Answer status

Add import-level answer status:

```txt
parsed
missing
needs_manual_review
verified
```

Questions without verified answers must not automatically become published.

### 18.3. Deduplication

Compute `source_hash`.

Use stable fields:

- courseId;
- source;
- sourceUrl or externalId;
- prompt normalized;
- options normalized.

Avoid duplicate imports.

### 18.4. Validate script

Create:

```txt
scripts/validate-import.ts
```

Responsibilities:

- read JSON file;
- validate each question;
- print stats;
- print errors;
- do not upload.

### 18.5. Import script

Create:

```txt
scripts/import-questions.ts
```

Responsibilities:

- validate;
- dedupe;
- upsert question_texts;
- upsert questions;
- create import_batch row;
- set status:
  - published if answer verified and confidence high;
  - draft otherwise.

### 18.6. Example import file

Create:

```txt
examples/parsed-questions.example.json
```

Include:

- one Russian question;
- one physics question;
- one Belenkova question.

## Acceptance Criteria

- Import contract documented.
- Validation script works.
- Import script works with Supabase service key.
- Broken questions do not get published.
- Re-running import does not create duplicates.
- Import report is clear.
- Build passes.
- Lint passes.

## Notes for GLM-5.1

Do not build FIPI parser in this phase.  
Do not create public admin UI yet.  
This is script-based admin workflow.

---

# Phase 19 — FIPI parser MVP

## Goal

Create a local admin-side parser MVP for the official FIPI bank.

The parser runs on the administrator’s computer and outputs JSON compatible with Phase 18 import contract.

## Product Idea

Administrator weekly flow:

```txt
1. Admin opens PC.
2. Admin runs parser.
3. Parser collects questions from official FIPI bank.
4. Parser saves parsed-questions.json.
5. Admin runs validate-import.
6. Admin runs import-questions.
7. Supabase receives draft/published questions.
8. Frontend displays published questions.
```

## Parser Approach

Prefer local script first.

Recommended:

```txt
Playwright script
```

Browser extension is optional future work if Playwright cannot reliably access needed content.

## Tasks

### 19.1. Parser package

Create:

```txt
parser/
```

or:

```txt
tools/parser/
```

Include:

```txt
README.md
package.json or pyproject.toml
src/
output/
```

Choose either TypeScript/Playwright or Python/Playwright.  
Keep it separate from frontend runtime.

### 19.2. Source config

Create config:

```txt
parser/config/sources.ts
```

or equivalent.

Support:

```txt
subject = russian
exam = ege
year = 2026
source = fipi
```

Do not hardcode everything inside parser logic.

### 19.3. FIPI navigation

Parser should:

- open official FIPI bank;
- navigate to Russian EGE section;
- collect available task groups;
- collect question pages;
- extract raw HTML/text.

### 19.4. Extraction

Extract when possible:

- externalId;
- sourceUrl;
- examNumber;
- prompt;
- text block;
- options;
- answer if available;
- topic if inferable;
- raw HTML snapshot for debugging.

### 19.5. Normalization

Normalize:

- whitespace;
- non-breaking spaces;
- soft hyphens;
- weird punctuation;
- option labels;
- text numbering.

### 19.6. Output JSON

Output must match Phase 18 contract:

```txt
output/parsed-questions.json
```

Do not write directly to Supabase from parser MVP.

Parser output first, import script second.

### 19.7. Confidence score

Each parsed question gets:

```txt
confidenceScore: 0..1
```

Suggested logic:

- prompt found;
- options found when expected;
- answer found;
- examNumber found;
- no suspicious empty fields.

### 19.8. Dry run report

Parser must print:

```txt
total pages visited
total questions found
questions with answers
questions missing answers
errors
output file path
```

### 19.9. Safety

Do not spam FIPI.

Add:

- rate limit;
- delays;
- retry;
- graceful failure;
- resume if possible.

## Acceptance Criteria

- Parser can run locally.
- Parser outputs JSON file.
- JSON validates through Phase 18 validate script.
- Parser does not directly mutate Supabase.
- Missing answers are marked as missing/needs_manual_review.
- Import pipeline can import verified questions.
- Frontend remains independent of parser.
- Build/lint for frontend still pass.

## Notes for GLM-5.1

Do not make parser part of frontend bundle.  
Do not store service role key in parser repo if it can be avoided.  
Do not publish questions with missing/unverified answers automatically.  
Do not assume FIPI HTML will stay stable.  
Keep raw snapshots/logs for debugging.

---

# Future Phases — Do Not Implement Yet

These are not part of Phase 11–19 unless explicitly requested.

## Future 20 — Admin review UI

- private admin page;
- list draft questions;
- preview question;
- edit answer/explanation;
- publish/archive;
- role-based access.

## Future 21 — Browser extension parser

Only if Playwright parser is insufficient.

Possible use case:

- admin manually opens FIPI;
- extension extracts current page;
- sends JSON to local file or admin endpoint.

## Future 22 — Drag-and-drop formula gaps

Upgrade click-to-fill formula gaps to drag-and-drop.

Only after mobile behavior is tested.

## Future 23 — Formula expression parser

Support free formula input with symbolic equivalence.

This is difficult and should not be MVP.

## Future 24 — Full OGE Physics variants

- longer tasks;
- graph/table/image tasks;
- lab-like tasks;
- timed variants;
- score mapping.

---

# Final Agent Reminder

The most important technical risks:

1. Do not mix course progress.
2. Do not assume `examNumber` exists.
3. Do not leak locked Belenkova questions into public practice.
4. Do not implement formula free input.
5. Do not implement DnD before click-to-fill.
6. Do not attach Supabase before multi-course model is stable.
7. Do not make parser write directly to production questions without validation.
8. Do not publish parsed questions with missing answers.
9. Do not break EGE Russian while adding new courses.

Work phase-by-phase.  
Small safe changes.  
Always run build.

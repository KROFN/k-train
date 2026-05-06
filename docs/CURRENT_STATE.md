# CURRENT_STATE.md — Состояние проекта после Phase 19 и post-phase audit

> Дата: 2026-03-05 (обновлено после sanity-check)
> Фазы: 1–19 завершены, аудит и sanity-check проведены

---

## 1. Курсы

| Поле | ЕГЭ Русский | ОГЭ Физика | Беленькова |
|---|---|---|---|
| **id** | `ege_russian` | `oge_physics` | `belenkova_math` |
| **title** | ЕГЭ Русский язык | ОГЭ Физика | Режим Беленьковой |
| **shortTitle** | Русский | Физика | Беленькова |
| **subject** | `russian` | `physics` | `math` |
| **exam** | `ege` | `oge` | `school` |
| **visibility** | `public` | `public` | `locked` |
| **accessType** | `open` | `open` | `local_code` |
| **icon** | 📝 | ⚡ | 🧮 |
| **color** | blue | amber | purple |
| **defaultPracticeMode** | `quick` | `by_formula` | `by_formula` |

### Количество вопросов

| Курс | Всего | single | multi | text | matching | formula_gap | numeric | flashcard |
|---|---|---|---|---|---|---|---|---|
| ЕГЭ Русский | 59 | 20 | 14 | 12 | 13 | — | — | — |
| ОГЭ Физика | 48 | 7 | 2 | — | — | 12 | 21 | 6 |
| Беленькова | 30 | 4 | — | — | — | 13 | 6 | 7 |

### Доступ к курсам

- **ЕГЭ Русский** — открыт сразу.
- **ОГЭ Физика** — открыт сразу.
- **Беленькова** — заблокирован. Требуется локальный код доступа `BELENKOVA2026`. Это **не настоящая безопасность** — код хранится в клиентском JS и обходится через DevTools. Реальная защита будет реализована через Supabase Auth + RLS в будущей фазе.

---

## 2. Типы вопросов

### 7 поддерживаемых типов

| Тип | CorrectAnswer | UserAnswer | UI-компонент |
|---|---|---|---|
| `single_choice` | `{ type: "single", value: string }` | `{ type: "single", value: string \| null }` | `SingleChoiceQuestion` |
| `multi_choice` | `{ type: "multiple", value: string[] }` | `{ type: "multiple", value: string[] }` | `MultiChoiceQuestion` |
| `text_input` | `{ type: "text", value: string \| string[], normalize? }` | `{ type: "text", value: string }` | `TextInputQuestion` |
| `matching` | `{ type: "matching", value: Record<string, string> }` | `{ type: "matching", value: Record<string, string> }` | `MatchingQuestion` |
| `formula_gap` | `{ type: "slots", value: Record<string, string> }` | `{ type: "slots", value: Record<string, string> }` | `FormulaGapQuestion` |
| `numeric_input` | `{ type: "numeric", value: number, unit?, tolerance? }` | `{ type: "numeric", value: string }` | `NumericInputQuestion` |
| `flashcard_self_check` | `{ type: "self_check", value: "known" }` | `{ type: "self_check", value: "known" \| "unknown" }` | `FlashcardSelfCheckQuestion` |

### Проверка ответов

Все типы проверяются централизованно в `src/lib/answer-checking.ts`. UI-компоненты **не содержат логики проверки** — только собирают ввод.

**numeric_input**: trim → запятая→точка → извлечение первого числа → сравнение с tolerance (default 0.01).

**formula_gap** (slots): сравнение каждого slotId, все должны совпадать.

**flashcard_self_check**: `"known"` = правильно, `"unknown"` = неправильно.

### Дополнительные модели

- **FormulaTemplate**: массив `FormulaTemplatePart` (`text` | `slot` с `slotId` и `placeholder`).
- **NumericConfig**: `kind: "plain" | "unit_conversion" | "mental_formula_problem"`, `expectedUnit?`, `acceptedUnits?`, `tolerance?`.
- **QuestionPresentation**: `"default" | "formula" | "compact" | "card"`.

---

## 3. Прогресс

### Схема v2

```
UserProgressV2
├── schemaVersion: 2
├── selectedCourseId: CourseId
├── global: GlobalProgress
│   ├── xp, level, streak, lastPracticeDate
└── courses: Partial<Record<CourseId, CourseProgress>>
    └── [courseId]: CourseProgress
        ├── courseId, xp, level, hearts, maxHearts
        ├── totalAnswered, totalCorrect
        ├── mistakes: MistakeRecord[]
        ├── byTopic, bySubtopic
        └── byExamNumber? (опционально)
```

### Ключевые принципы

- **Каждый курс изолирован.** Прогресс, ошибки, темы, статистика — строго `courses[selectedCourseId]`.
- **Глобальные метрики** (XP, level, streak) — общие, живут в `global`.
- **examNumber опционален.** Русский использует номера заданий, физика и Беленькова — нет. UI не падает без examNumber.
- **Hearts** — per-course (5 по умолчанию).
- **Миграция v1 → v2.** Если в localStorage есть старый ключ `ege-russian-trainer:progress`, все данные автоматически переносятся в `courses.ege_russian`. Старый ключ сохраняется.

### Ключи localStorage

| Ключ | Назначение |
|---|---|
| `study-trainer:progress:v2` | Основной прогресс v2 |
| `study-trainer:attempts:v2` | История попыток |
| `study-trainer:settings:v2` | Настройки пользователя |
| `study-trainer:course-access:v1` | Разблокировка курсов |
| `study-trainer:selected-course:v1` | Выбранный курс |
| `ege-russian-trainer:progress` | (legacy) Для миграции v1→v2 |
| `ege-russian-trainer:attempts` | (legacy) Для миграции |
| `ege-russian-trainer:settings` | (legacy) Для миграции |

### Безопасность localStorage

- Пустой localStorage → приложение создаёт дефолтный прогресс, не падает.
- Битый JSON → try/catch возвращает дефолт, не падает.
- `resetProgress()` очищает все ключи (v1 + v2), **кроме** `study-trainer:selected-course:v1` (этот ключ живёт в отдельном store — `course-store.ts` — и не входит в `STORAGE_KEYS` в `storage.ts`).

### Store-селекторы (важный паттерн!)

**Никогда** не используй `useProgressStore((s) => s.getUnresolvedMistakes())` — это создаёт новую ссылку на каждый вызов и вызывает бесконечный ререндер. Вместо этого:

```ts
const mistakes = useProgressStore((s) => s.progress.courses[selectedCourseId]?.mistakes);
const unresolvedMistakes = useMemo(() => mistakes?.filter(m => !m.resolved) ?? [], [mistakes]);
```

---

## 4. Supabase / Auth

### Supabase client

- **Ленивая инициализация.** `getSupabaseClient()` создаёт экземпляр при первом вызове.
- **Null-safe.** Если `NEXT_PUBLIC_SUPABASE_URL` или `NEXT_PUBLIC_SUPABASE_ANON_KEY` отсутствуют → возвращает `null`. Приложение работает полностью без Supabase.
- **Service role key** — только на сервере (API routes) и в CLI-скриптах. Никогда не попадает в клиентский bundle.

### Auth

- **Supabase Auth** (email/password). Поддержка регистрации, логина, логаута.
- **Guest mode.** Приложение полностью функционально без логина. Auth-элементы скрываются, если `authAvailable === false`.
- **AuthSyncProvider** — мост между auth state и progress store. При логине вызывает `mergeOnLogin()`.

### Слияние прогресса при логине

| Поле | Стратегия |
|---|---|
| XP | `max(local, cloud)` — никогда не уменьшается |
| Hearts | значение из cloud (последний синк) |
| totalAnswered/totalCorrect | `max(local, cloud)` |
| byTopic/bySubtopic/byExamNumber | поключевое слияние, берётся версия с большим `answered` |
| mistakes | слияние по `questionId`, берётся больший `timesWrong`; если local resolved, cloud unresolved → unresolved |
| streak | из local (последняя сессия) |
| Global XP | `max(local.global.xp, recalculated)` — пересчитывается из слитых курсов, но если локальный global.xp больше суммы курсов, он сохраняется |

**Поток:** login → загрузка cloud → merge → сохранение merged локально → перезапись cloud.

### Logout

При logout **локальный прогресс сохраняется**. Очищается только auth state (user, session, syncStatus). Пользователь продолжает как гость со всеми данными.

### API routes

| Route | Методы | Auth |
|---|---|---|
| `/api/progress` | GET, POST | JWT verify + service role |
| `/api/attempts` | POST | JWT verify + service role |
| `/api/auth/profile` | GET, POST | JWT verify + service role |

Все routes используют общий модуль `src/lib/supabase/server-auth.ts` с `verifyUser()`, `serviceHeaders()`, `enc()`. При отсутствии Supabase возвращают `503`.

### Cloud progress — per course

DB таблица `user_course_progress` имеет `UNIQUE(user_id, course_id)`. Каждый курс синхронизируется независимо.

---

## 5. Import pipeline (Phase 18)

### Формат импорта

JSON-файл с массивом `ParsedQuestion` — расширенная версия runtime `Question`:

```ts
{
  externalId?: string,
  source: "manual" | "fipi" | "demo_pdf" | "other",
  sourceUrl?: string,
  sourceYear?: number,
  courseId: CourseId,           // обязательный
  subject: Subject,            // обязательный
  exam?: ExamKind,
  examNumber?: number,         // опциональный
  topic: string,               // обязательный
  type: QuestionType,          // обязательный
  prompt: string,              // обязательный
  options?, pairs?, formulaTemplate?, numericConfig?,
  correctAnswer?: CorrectAnswer,  // опциональный на этапе импорта!
  explanation?: QuestionExplanation,
  answerStatus: "parsed" | "missing" | "needs_manual_review" | "verified",
  confidenceScore?: number (0..1),
  tags?: string[]
}
```

### answerStatus — критически важное поле

| Статус | Смысл | Публикация |
|---|---|---|
| `verified` | Ответ проверен, можно публиковать | ✅ → `published` (если confidenceScore ≥ 0.8) |
| `parsed` | Ответ распознан, но не проверен | ❌ → `draft` |
| `needs_manual_review` | Требует ручной проверки | ❌ → `draft` |
| `missing` | Ответ отсутствует | ❌ → `draft` |

### Дедупликация

- **SHA-256** хеш от стабильных полей: `courseId`, `source`, `sourceUrl || externalId`, `prompt` (normalized), `options` (sorted, normalized), `examNumber`.
- **Нормализация**: trim, collapse whitespace, replace non-breaking spaces, remove soft hyphens.
- Одинаковый ввод → одинаковый хеш. Гарантированно.
- В БД: `source_hash TEXT UNIQUE` constraint.

### Скрипты

| Скрипт | Команда | Что делает |
|---|---|---|
| `validate-import.ts` | `bun run scripts/validate-import.ts examples/parsed-questions.example.json` | Валидирует JSON, печатает статистику, **не загружает** |
| `import-questions.ts` | `SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/import-questions.ts examples/parsed-questions.example.json` | Валидирует → дедуплицирует → вставляет → создаёт import_batch. **Требует service role key** |
| `upload-local-questions-to-supabase.ts` | `SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/upload-local-questions-to-supabase.ts` | Загружает локальные seed-вопросы в Supabase. Phase 16, не считает source_hash |

### Документация

- `docs/import_contract.md` — полный контракт формата
- `examples/parsed-questions.example.json` — пример с 4 вопросами

---

## 6. Parser (Phase 19)

### Расположение

`parser/` — **полностью отдельный проект** со своим `package.json` и `bun.lock`. Не входит в frontend bundle. Исключён из `tsconfig.json` Next.js.

### Команды

```bash
cd parser

# Установка зависимостей
bun install

# Парсинг ЕГЭ Русский
bun run parse -- --subject russian --exam ege

# Парсинг ОГЭ Физика
bun run parse -- --subject physics --exam oge

# Dry run (только отчёт, без записи)
bun run parse:dry -- --subject russian --exam ege

# Конкретные номера заданий
bun run parse -- --subject russian --exam ege --numbers 4,5,6

# Свой путь вывода
bun run parse -- --subject russian --exam ege --output my-questions.json
```

### CLI-опции

| Опция | Значение по умолчанию | Описание |
|---|---|---|
| `--subject` | — | `russian` или `physics` |
| `--exam` | — | `ege` или `oge` |
| `--numbers` | все | Номера заданий через запятую |
| `--output` | `output/parsed-questions.json` | Путь к выходному файлу |
| `--dry-run` | `false` | Только отчёт, без записи файла |
| `--headless` | `true` | Запуск Playwright в headless-режиме |
| `--debug` | `false` | Детальный лог |
| `--delay` | `2000` | Задержка между страницами (мс) |
| `--max-retries` | `3` | Количество попыток при ошибке |

### Архитектура parser

| Модуль | Назначение |
|---|---|
| `src/index.ts` | CLI entry point |
| `src/navigator.ts` | Playwright навигация по FIPI |
| `src/extractor.ts` | Извлечение вопроса из HTML |
| `src/normalizer.ts` | Очистка текста (whitespace, nbsp, мягкие переносы) |
| `src/confidence.ts` | Вычисление confidenceScore |
| `src/safety.ts` | Rate limiting, задержки, retry с exponential backoff |
| `src/output.ts` | Запись JSON-файла |

### Безопасность

- **Не спамит FIPI**: 2s задержка между страницами, max 20 запросов/минуту, retry с exponential backoff + jitter.
- **Не пишет в Supabase**: только выводит JSON-файл.
- **Output совместим с Phase 18**: `validate-import.ts` может проверить результат парсера.
- **Resume support**: отслеживает посещённые страницы, можно перезапустить.

### Ограничение

FIPI HTML не стабилен. Парсер может сломаться при изменении вёрстки сайта FIPI. Храните raw-снапшоты для отладки.

---

## 7. Команды запуска

### Frontend (Next.js)

```bash
bun install                  # Установка зависимостей
bun run dev                  # Dev-сервер на порту 3000
bun run lint                 # ESLint проверка
npx tsc --noEmit             # TypeScript проверка типов
bun run build                # Production build
```

### Parser

```bash
cd parser
bun install                  # Установка зависимостей парсера
bun run parse -- --subject russian --exam ege     # Парсинг
bun run parse:dry -- --subject russian --exam ege # Dry run
```

### Import

```bash
# Валидация (без Supabase)
bun run scripts/validate-import.ts output/parsed-questions.json

# Импорт (требует service role key)
SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/import-questions.ts output/parsed-questions.json
```

### Database

```bash
bun run db:push              # Push Prisma schema
bun run db:generate          # Генерация Prisma client
bun run db:migrate           # Миграции
bun run db:reset             # Сброс БД
```

### Переменные окружения

| Переменная | Обязательна? | Где используется |
|---|---|---|
| `DATABASE_URL` | Нет (default: `file:./dev.db`) | Prisma, не используется в quiz-движке |
| `NEXT_PUBLIC_SUPABASE_URL` | Нет | Supabase client, API routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Нет | Supabase client, API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Нет | API routes, import-скрипты (только server-side) |

**Приложение полностью работает без Supabase-переменных.**

---

## 8. Известные риски

### Архитектурные

1. **Локальный код доступа — не безопасность.** `BELENKOVA2026` хранится в клиентском JS. Любой может прочитать через DevTools. Реальная защита — Supabase Auth + RLS (будущая фаза).

2. **FIPI HTML не стабилен.** Парсер может сломаться при изменении вёрстки. Raw-снапшоты помогают при отладке, но не гарантируют работоспособность.

3. **Race condition при merge.** `mergeOnLogin()` асинхронный. Если пользователь быстро отвечает во время слияния, локальный прогресс может перезаписать слитый. Низкая вероятность на практике.

4. **Legacy upload-скрипт без source_hash.** `upload-local-questions-to-supabase.ts` (Phase 16) не вычисляет source_hash, поэтому Phase 18 dedup не найдёт дубликаты из seed-загрузок. Низкий риск — seed использует явные `id` + upsert.

5. **API routes используют service role key для записи.** Это обходит RLS. Альтернатива — pass-through auth (использовать access token пользователя напрямую), но текущий подход с ручной JWT-верификацией функционально корректен.

### Продуктовые

6. **Гость теряет данные при смене устройства.** Без логина прогресс живёт только в localStorage текущего браузера.

7. **`isCourseUnlocked()` в courses.ts — мёртвый код.** Всегда возвращает `false` для locked-курсов. Runtime-проверки доступа делают через `useCourseAccessStore`. Не баг, но может запутать.

---

## 9. Что нельзя делать без отдельной фазы

| Запрещено | Почему | Когда можно |
|---|---|---|
| Drag-and-drop для formula_gap | Не протестировано на мобильных, click-to-fill работает | Future Phase 22 |
| Свободный ввод формул | Множество эквивалентных форм, нормализация символов, кириллица/латиница | Future Phase 23 |
| Полные варианты ОГЭ Физика | Длинные задачи, графики, таблицы, лабораторные | Future Phase 24 |
| Admin UI для ревью вопросов | Нужен private admin page, role-based access | Future Phase 20 |
| Browser extension parser | Только если Playwright недостаточен | Future Phase 21 |
| Курс-специфичные хаки в quiz engine | Нарушает архитектуру. `if (courseId === "oge_physics")` — запрещено | Никогда |
| Публикация вопросов без verified ответа | Ответ может быть неправильным | Никогда — только через import pipeline |
| Service role key в frontend | Утечка admin-доступа | Никогда |
| Удаление localStorage fallback | Гости должны иметь полный функционал | Только когда все пользователи на cloud |
| `ignoreBuildErrors: true` | Скрывает реальные TypeScript-ошибки | Никогда |

---

## 10. Краткая сводка по фазам

| Фаза | Содержание | Статус |
|---|---|---|
| 1–10 | EGE Russian MVP (типы, движок, UX, контент, деплой) | ✅ Завершены |
| 11 | Multi-course архитектура, progress v2, миграция | ✅ Завершена |
| 12 | Новые типы вопросов (formula_gap, numeric_input, flashcard_self_check) | ✅ Завершена |
| 13 | OGE Physics локальный MVP (48 вопросов) | ✅ Завершена |
| 14 | Belenkova Mode (locked, 30 вопросов, локальный код) | ✅ Завершена |
| 15 | Supabase foundation (client, migrations, RLS) | ✅ Завершена |
| 16 | Questions from Supabase + local fallback | ✅ Завершена |
| 17 | Auth + cloud progress sync | ✅ Завершена |
| 18 | Admin import pipeline (schema, dedup, validate, import) | ✅ Завершена |
| 19 | FIPI parser MVP (Playwright, rate limit, JSON output) | ✅ Завершена |
| **Аудит** | Post-Phase 19 technical audit | ✅ Проведён, HIGH/MEDIUM исправлены |
| **Sanity-check** | Documentation/code sync, удаление 7 чужих вопросов из questions.ts | ✅ Проведён |

### Post-audit storage fix

После QA-аудита исправлены два edge-case в `src/lib/storage.ts`:
- v1→v2 migration больше не теряет прогресс, если `byExamNumber` отсутствует;
- v2 `CourseProgress` при загрузке мёрджится с дефолтами, чтобы новые поля вроде `bySubtopic` не были `undefined`.
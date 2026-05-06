// ============================================================
// Quiz store — explicit state machine for multi-course study trainer
// State transitions are guarded. No boolean[] as primary result.
// All answer checking delegates to answer-checking.ts
// Phase 11: Updated for v2 progress with subtopic and optional examNumber
// ============================================================

import { create } from "zustand";
import type {
  QuizStatus,
  QuizSession,
  Question,
  UserAnswer,
  QuestionAttempt,
} from "@/types/quiz";
import type { PracticeConfig } from "@/lib/practice-builder";
import { buildPracticeQuestions } from "@/lib/practice-builder";
import { getQuestionsWithFallback } from "@/services/question-service";
import { checkAnswer } from "@/lib/answer-checking";
import { useProgressStore } from "@/store/progress-store";
import { requiresAccessCode } from "@/lib/access-code";
import { loadCourseAccess } from "@/lib/storage";

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// -----------------------------------------------------------
// Store interface
// -----------------------------------------------------------

export type QuizStore = {
  /** Current quiz session (null if no active session) */
  session: QuizSession | null;

  /** Last check result (set after submitAnswer, cleared on nextQuestion) */
  lastCheckResult: ReturnType<typeof checkAnswer> | null;

  /** Timestamp when the current question was shown */
  questionStartedAt: string | null;

  // ---- Actions ----

  /** Start a new quiz session with the given practice config */
  startSession: (config: PracticeConfig) => Promise<void>;

  /** Select/update the current answer (before submitting) */
  selectAnswer: (answer: UserAnswer) => void;

  /** Submit the current answer for checking */
  submitAnswer: () => void;

  /** Move to the next question (only valid after checking) */
  nextQuestion: () => void;

  /** Finish the current session (can be called at any time) */
  finishSession: () => void;

  /** Cancel the session without saving results */
  cancelSession: () => void;

  /** Reset the store to idle state */
  resetSession: () => void;

  // ---- Selectors ----

  /** Get the current quiz status */
  getStatus: () => QuizStatus;

  /** Get the current question */
  getCurrentQuestion: () => Question | null;

  /** Get the current question index (1-based for display) */
  getCurrentIndex: () => number;

  /** Get total number of questions */
  getTotalQuestions: () => number;

  /** Check if we're on the last question */
  isLastQuestion: () => boolean;

  /** Get all attempts from the current session */
  getAttempts: () => QuestionAttempt[];

  /** Get correct attempts count */
  getCorrectCount: () => number;

  /** Get wrong attempts count */
  getWrongCount: () => number;

  /** Get accuracy as a fraction (0-1) */
  getAccuracy: () => number;

  /** Get the last check result */
  getLastCheckResult: () => ReturnType<typeof checkAnswer> | null;
};

// -----------------------------------------------------------
// Valid state transitions
// -----------------------------------------------------------

const VALID_TRANSITIONS: Record<QuizStatus, QuizStatus[]> = {
  idle: ["loading", "error"],
  loading: ["active", "error"],
  active: ["answering", "completed", "error"],
  answering: ["checking", "error"],
  checking: ["result", "error"],
  result: ["active", "completed", "error"],
  completed: ["idle"],
  error: ["idle"],
};

function canTransition(from: QuizStatus, to: QuizStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// -----------------------------------------------------------
// Store implementation
// -----------------------------------------------------------

export const useQuizStore = create<QuizStore>((set, get) => ({
  session: null,
  lastCheckResult: null,
  questionStartedAt: null,

  // ---- startSession ----
  startSession: async (config: PracticeConfig) => {
    // QA fix: a new session for any course should fully replace any prior
    // session (including completed ones). This prevents the "back to old
    // russian session" bug when switching courses mid-flow.
    set({
      session: null,
      lastCheckResult: null,
      questionStartedAt: null,
    });

    // Defense-in-depth: reject locked courses that haven't been unlocked
    if (requiresAccessCode(config.courseId)) {
      const access = loadCourseAccess();
      if (!access[config.courseId]) {
        console.warn("[QuizStore] Cannot start session: course is locked:", config.courseId);
        set({
          session: {
            id: generateId(),
            courseId: config.courseId,
            status: "error",
            questions: [],
            currentIndex: 0,
            currentAnswer: null,
            attempts: [],
            startedAt: new Date().toISOString(),
            error: "Курс заблокирован. Введите код доступа на главной странице.",
          },
        });
        return;
      }
    }

    set({
      session: {
        id: generateId(),
        courseId: config.courseId,
        status: "loading",
        questions: [],
        currentIndex: 0,
        currentAnswer: null,
        attempts: [],
        startedAt: new Date().toISOString(),
      },
      lastCheckResult: null,
      questionStartedAt: null,
    });

    // Build questions — load from Supabase with local fallback
    let questions: Question[];
    try {
      questions = await getQuestionsWithFallback(config.courseId);
    } catch {
      // Fallback to empty — will trigger error state below
      questions = [];
    }
    const practiceQuestions = buildPracticeQuestions(questions, config);

    if (practiceQuestions.length === 0) {
      set({
        session: {
          id: generateId(),
          courseId: config.courseId,
          status: "error",
          questions: [],
          currentIndex: 0,
          currentAnswer: null,
          attempts: [],
          startedAt: new Date().toISOString(),
          error: "Нет вопросов по выбранным критериям",
        },
      });
      return;
    }

    const session = get().session!;
    if (!canTransition(session.status, "active")) {
      console.warn("[QuizStore] Invalid transition: loading → active");
      return;
    }

    set({
      session: {
        ...session,
        status: "active",
        questions: practiceQuestions,
        currentIndex: 0,
        currentAnswer: null,
      },
      questionStartedAt: new Date().toISOString(),
    });
  },

  // ---- selectAnswer ----
  selectAnswer: (answer: UserAnswer) => {
    const session = get().session;
    if (!session) return;

    // Can select answer when active or answering
    if (session.status !== "active" && session.status !== "answering") {
      return;
    }

    const newStatus: QuizStatus =
      session.status === "active" ? "answering" : session.status;

    set({
      session: {
        ...session,
        status: newStatus,
        currentAnswer: answer,
      },
    });
  },

  // ---- submitAnswer ----
  submitAnswer: () => {
    const session = get().session;
    if (!session) return;

    // Must be in "answering" state to submit
    if (session.status !== "answering") {
      console.warn("[QuizStore] Cannot submit: not in answering state");
      return;
    }

    // Must have an answer selected
    if (!session.currentAnswer) {
      console.warn("[QuizStore] Cannot submit: no answer selected");
      return;
    }

    if (!canTransition("answering", "checking")) {
      return;
    }

    // Transition to checking
    set({
      session: { ...session, status: "checking" },
    });

    // Get current question
    const question = session.questions[session.currentIndex];
    if (!question) {
      set({
        session: {
          ...session,
          status: "error",
          error: "Текущий вопрос не найден",
        },
      });
      return;
    }

    // Check answer
    const checkResult = checkAnswer(question, session.currentAnswer);

    // Build attempt
    const now = new Date().toISOString();
    const questionStartedAt = get().questionStartedAt ?? session.startedAt;
    const timeSpentMs = new Date(now).getTime() - new Date(questionStartedAt).getTime();

    const attempt: QuestionAttempt = {
      id: generateId(),
      questionId: question.id,
      selectedAnswer: session.currentAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: checkResult.isCorrect,
      startedAt: questionStartedAt,
      answeredAt: now,
      timeSpentMs: Math.max(0, timeSpentMs),
    };

    // Record to progress store (v2 signature with examNumber as optional + subtopic)
    try {
      useProgressStore
        .getState()
        .recordAnswer(
          question.id,
          question.examNumber,
          question.topic,
          question.subtopic,
          checkResult.isCorrect,
          attempt
        );
    } catch (err) {
      console.warn("[QuizStore] Failed to record answer to progress store:", err);
    }

    if (!canTransition("checking", "result")) {
      return;
    }

    // Transition to result
    set({
      session: {
        ...session,
        status: "result",
        attempts: [...session.attempts, attempt],
      },
      lastCheckResult: checkResult,
    });
  },

  // ---- nextQuestion ----
  nextQuestion: () => {
    const session = get().session;
    if (!session) return;

    // Must be in "result" state to advance
    if (session.status !== "result") {
      console.warn("[QuizStore] Cannot advance: not in result state");
      return;
    }

    const nextIndex = session.currentIndex + 1;

    // Check if we've completed all questions
    if (nextIndex >= session.questions.length) {
      // Transition to completed
      if (canTransition("result", "completed")) {
        set({
          session: {
            ...session,
            status: "completed",
            currentAnswer: null,
            completedAt: new Date().toISOString(),
          },
          lastCheckResult: null,
          questionStartedAt: null,
        });

        // Update streak in progress store
        try {
          useProgressStore.getState().completeSession();
        } catch (err) {
          console.warn("[QuizStore] Failed to complete session in progress store:", err);
        }
      }
      return;
    }

    // Move to next question — explicitly null out currentAnswer to prevent
    // any stale state (e.g. a previous matching answer) leaking into
    // controlled inputs of the next question.
    if (canTransition("result", "active")) {
      set({
        session: {
          ...session,
          status: "active",
          currentIndex: nextIndex,
          currentAnswer: null,
        },
        lastCheckResult: null,
        questionStartedAt: new Date().toISOString(),
      });
    }
  },

  // ---- finishSession ----
  finishSession: () => {
    const session = get().session;
    if (!session) return;

    // Can finish from any state except idle/completed
    if (session.status === "idle" || session.status === "completed") {
      return;
    }

    set({
      session: {
        ...session,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
      lastCheckResult: null,
      questionStartedAt: null,
    });

    // Update streak
    try {
      useProgressStore.getState().completeSession();
    } catch (err) {
      console.warn("[QuizStore] Failed to complete session in progress store:", err);
    }
  },

  // ---- cancelSession ----
  cancelSession: () => {
    set({
      session: null,
      lastCheckResult: null,
      questionStartedAt: null,
    });
  },

  // ---- resetSession ----
  resetSession: () => {
    set({
      session: null,
      lastCheckResult: null,
      questionStartedAt: null,
    });
  },

  // ---- Selectors ----

  getStatus: () => get().session?.status ?? "idle",

  getCurrentQuestion: () => {
    const s = get().session;
    if (!s || !s.questions[s.currentIndex]) return null;
    return s.questions[s.currentIndex];
  },

  getCurrentIndex: () => {
    const s = get().session;
    return s ? s.currentIndex + 1 : 0;
  },

  getTotalQuestions: () => {
    const s = get().session;
    return s?.questions.length ?? 0;
  },

  isLastQuestion: () => {
    const s = get().session;
    if (!s) return false;
    return s.currentIndex >= s.questions.length - 1;
  },

  getAttempts: () => get().session?.attempts ?? [],

  getCorrectCount: () => {
    return (get().session?.attempts ?? []).filter((a) => a.isCorrect).length;
  },

  getWrongCount: () => {
    return (get().session?.attempts ?? []).filter((a) => !a.isCorrect).length;
  },

  getAccuracy: () => {
    const attempts = get().session?.attempts ?? [];
    if (attempts.length === 0) return 0;
    return attempts.filter((a) => a.isCorrect).length / attempts.length;
  },

  getLastCheckResult: () => get().lastCheckResult,
}));

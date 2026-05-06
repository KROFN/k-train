// ============================================================
// API Route: /api/attempts
// Phase 17: Sync answer attempts to Supabase for logged-in users
//
// POST: Save an attempt or batch of attempts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyUser,
  serviceHeaders,
  isSupabaseConfigured,
} from "@/lib/supabase/server-auth";

// POST: Sync attempts
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("Authorization");
  const userId = await verifyUser(authHeader);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    attempts: Array<{
      questionId: string;
      courseId: string;
      selectedAnswer: unknown;
      correctAnswer: unknown;
      isCorrect: boolean;
      timeSpentMs: number | null;
      answeredAt: string;
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.attempts) || body.attempts.length === 0) {
    return NextResponse.json({ error: "No attempts provided" }, { status: 400 });
  }

  const rows = body.attempts.map((a) => ({
    user_id: userId,
    question_id: a.questionId,
    course_id: a.courseId,
    selected_answer: a.selectedAnswer,
    correct_answer: a.correctAnswer,
    is_correct: a.isCorrect,
    time_spent_ms: a.timeSpentMs,
    answered_at: a.answeredAt,
  }));

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const response = await fetch(`${supabaseUrl}/rest/v1/attempts`, {
      method: "POST",
      headers: serviceHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[AttemptsAPI] Failed to sync attempts:", errorText);
      return NextResponse.json({ error: "Failed to sync attempts" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    console.warn("[AttemptsAPI] Error syncing attempts:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

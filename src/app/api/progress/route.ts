// ============================================================
// API Route: /api/progress
// Phase 17: Load and save cloud progress for logged-in users
//
// GET:  Load all course progress for the authenticated user
// POST: Save (upsert) course progress for the authenticated user
//
// Uses service role key because RLS on user_course_progress
// requires auth.uid() match, and we validate the JWT manually.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyUser,
  serviceHeaders,
  isSupabaseConfigured,
  enc,
} from "@/lib/supabase/server-auth";

// GET: Load all course progress for user
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("Authorization");
  const userId = await verifyUser(authHeader);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_course_progress?user_id=eq.${enc(userId)}&select=*`,
      { headers: serviceHeaders() }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[ProgressAPI] Failed to load progress:", errorText);
      return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
    }

    const rows = await response.json();
    return NextResponse.json({ progress: rows });
  } catch (err) {
    console.warn("[ProgressAPI] Error loading progress:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save course progress (upsert)
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
    courseId: string;
    xp: number;
    level: number;
    hearts: number;
    maxHearts: number;
    totalAnswered: number;
    totalCorrect: number;
    byTopic: unknown;
    bySubtopic: unknown;
    byExamNumber: unknown;
    mistakes: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const progressRow = {
    user_id: userId,
    course_id: body.courseId,
    xp: body.xp,
    level: body.level,
    hearts: body.hearts,
    max_hearts: body.maxHearts,
    total_answered: body.totalAnswered,
    total_correct: body.totalCorrect,
    by_topic: body.byTopic,
    by_subtopic: body.bySubtopic,
    by_exam_number: body.byExamNumber,
    mistakes: body.mistakes,
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Try upsert using POST with Prefer: resolution=merge-duplicates
    const response = await fetch(`${supabaseUrl}/rest/v1/user_course_progress`, {
      method: "POST",
      headers: serviceHeaders({
        Prefer: "return=representation,resolution=merge-duplicates",
      }),
      body: JSON.stringify(progressRow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[ProgressAPI] Failed to save progress:", errorText);
      return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, progress: result[0] ?? result });
  } catch (err) {
    console.warn("[ProgressAPI] Error saving progress:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

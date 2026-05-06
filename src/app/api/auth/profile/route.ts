// ============================================================
// API Route: /api/auth/profile
// Phase 17: Create or get user profile on signup/login
//
// POST: Create a new profile for the authenticated user
// GET:  Get the current user's profile
//
// Uses service role key for profile creation because RLS
// on profiles table requires auth.uid() to match, and
// during signup the user may not have a session yet.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyUser,
  serviceHeaders,
  isSupabaseConfigured,
  enc,
} from "@/lib/supabase/server-auth";

// POST: Create profile
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const userId = await verifyUser(authHeader);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { displayName?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Upsert profile
  const profileData = {
    id: userId,
    display_name: body.displayName ?? null,
    role: "student",
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify(profileData),
    });

    // 409 Conflict means profile already exists — that's OK
    if (response.status === 409) {
      // Fetch existing profile
      const getResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${enc(userId)}&select=*`,
        { headers: serviceHeaders() }
      );
      if (getResponse.ok) {
        const profiles = await getResponse.json();
        return NextResponse.json({ profile: profiles[0] ?? null });
      }
      return NextResponse.json({ profile: null });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[ProfileAPI] Failed to create profile:", errorText);
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    const profile = await response.json();
    return NextResponse.json({ profile: profile[0] ?? profile });
  } catch (err) {
    console.warn("[ProfileAPI] Error creating profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get profile
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const userId = await verifyUser(authHeader);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${enc(userId)}&select=*`,
      { headers: serviceHeaders() }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    const profiles = await response.json();
    return NextResponse.json({ profile: profiles[0] ?? null });
  } catch (err) {
    console.warn("[ProfileAPI] Error fetching profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

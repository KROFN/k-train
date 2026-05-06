// ============================================================
// Server-side Supabase auth utilities for API routes
// Phase 17+19 audit: Extracted from duplicate copies in 3 API routes
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Verify the user's JWT and return user ID, or null if invalid */
export async function verifyUser(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !SUPABASE_URL) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: authHeader,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Build headers for Supabase REST API calls using service role key */
export function serviceHeaders(
  overrides?: Record<string, string>
): Record<string, string> {
  return {
    apikey: SERVICE_ROLE_KEY ?? "",
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...overrides,
  };
}

/** Check if Supabase is configured (has URL + service role key) */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SERVICE_ROLE_KEY);
}

/** Encode a value for safe use in URL query parameters */
export function enc(value: string): string {
  return encodeURIComponent(value);
}

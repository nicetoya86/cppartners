import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function getServerSupabase(): SupabaseClient | null {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function logSearchEvent(payload: {
  coupangUrl?: string;
  query?: string;
  aeCount: number;
  xhsCount: number;
  durationMs: number;
}): Promise<void> {
  try {
    const supabase = getServerSupabase();
    if (!supabase) return;
    await supabase.from("search_logs").insert({
      coupang_url: payload.coupangUrl ?? null,
      query: payload.query ?? null,
      ae_count: payload.aeCount,
      xhs_count: payload.xhsCount,
      duration_ms: payload.durationMs,
    });
  } catch {
    // swallow logging errors
  }
}



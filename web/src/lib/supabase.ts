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

export async function getCachedResult(keyHash: string): Promise<{ ae: unknown[]; xhs: unknown[] } | null> {
  try {
    const supabase = getServerSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from("search_cache")
      .select("ae_json, xhs_json")
      .eq("key_hash", keyHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return { ae: (data as any).ae_json ?? [], xhs: (data as any).xhs_json ?? [] };
  } catch {
    return null;
  }
}

export async function setCachedResult(keyHash: string, query: string, payload: { ae: unknown[]; xhs: unknown[] }): Promise<void> {
  try {
    const supabase = getServerSupabase();
    if (!supabase) return;
    await supabase.from("search_cache").insert({ key_hash: keyHash, query, ae_json: payload.ae, xhs_json: payload.xhs });
  } catch {
    // ignore
  }
}



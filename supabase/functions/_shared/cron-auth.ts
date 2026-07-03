// Shared secret guard for cron-only edge functions.
// These functions are meant to be invoked by pg_cron via net.http_post with
// an `x-cron-secret` header — never by end users or the frontend.
//
// The expected secret is stored in the DB (public._cron_shared_secret, single
// row, service-role-only) so the same value can be baked into the cron.schedule
// SQL and read back here. Cached in module scope after first fetch.

import { createClient } from "npm:@supabase/supabase-js@2";

export interface CronAuthResult {
  ok: boolean;
  status?: number;
  error?: string;
}

let cachedSecret: string | null = null;

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function loadSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret;

  // Env override wins if set (useful for local dev / one-off testing).
  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && envSecret.length > 0) {
    cachedSecret = envSecret;
    return cachedSecret;
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return null;

  try {
    const client = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("_cron_shared_secret")
      .select("secret")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data?.secret) {
      console.error("[cron-auth] failed to load shared secret:", error);
      return null;
    }
    cachedSecret = data.secret as string;
    return cachedSecret;
  } catch (e) {
    console.error("[cron-auth] threw while loading shared secret:", e);
    return null;
  }
}

export async function verifyCronSecret(req: Request): Promise<CronAuthResult> {
  const expected = await loadSecret();
  if (!expected) {
    return { ok: false, status: 500, error: "cron secret not configured" };
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!provided || !timingSafeEq(provided, expected)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true };
}

/**
 * Convenience wrapper: returns a Response if the request is unauthorized,
 * or null if the request may proceed. Callers pass their own corsHeaders.
 */
export async function requireCronSecret(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const auth = await verifyCronSecret(req);
  if (auth.ok) return null;
  return new Response(
    JSON.stringify({ error: auth.error }),
    {
      status: auth.status ?? 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
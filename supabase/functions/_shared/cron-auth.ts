// Shared secret guard for cron-only edge functions.
// These functions are meant to be invoked by pg_cron via net.http_post with
// an `x-cron-secret` header — never by end users or the frontend. Fails
// closed if CRON_SECRET is not configured.

export interface CronAuthResult {
  ok: boolean;
  status?: number;
  error?: string;
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function verifyCronSecret(req: Request): CronAuthResult {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    return { ok: false, status: 500, error: "CRON_SECRET not configured" };
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
export function requireCronSecret(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const auth = verifyCronSecret(req);
  if (auth.ok) return null;
  return new Response(
    JSON.stringify({ error: auth.error }),
    {
      status: auth.status ?? 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
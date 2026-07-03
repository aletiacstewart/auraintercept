// Meta (Facebook/Instagram) webhook signature verification.
// Env-gated: if META_APP_SECRET is unset, verification is SKIPPED with a
// warning (preserves rollout compatibility). When set, POSTs missing or
// mismatching X-Hub-Signature-256 are rejected.
//
// Algorithm: signature = "sha256=" + hex(HMAC-SHA256(app_secret, rawBody))
// Header: X-Hub-Signature-256

let warnedSkip = false;

export interface MetaVerifyResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(sig);
}

/**
 * Verify a Meta webhook POST. Caller reads the raw body once (as text) and
 * passes it in so the body isn't consumed twice.
 */
export async function verifyMetaSignature(
  req: Request,
  rawBody: string,
): Promise<MetaVerifyResult> {
  const secret = Deno.env.get("META_APP_SECRET");
  if (!secret) {
    if (!warnedSkip) {
      console.warn("[meta-webhook-signature] META_APP_SECRET not set — skipping verification");
      warnedSkip = true;
    }
    return { ok: true, skipped: true };
  }

  const provided = req.headers.get("x-hub-signature-256") ?? "";
  if (!provided.startsWith("sha256=")) {
    return { ok: false, reason: "missing_signature" };
  }

  const expected = "sha256=" + (await hmacSha256Hex(secret, rawBody));
  if (!timingSafeEq(expected, provided)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}
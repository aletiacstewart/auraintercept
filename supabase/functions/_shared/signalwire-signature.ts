// SignalWire webhook signature verification (Twilio-compatible HMAC-SHA1).
// Env-gated: if SIGNALWIRE_SIGNING_SECRET is unset, verification is SKIPPED
// (preserves existing behavior during rollout). When set, requests with a
// missing or mismatched signature are rejected.
//
// Algorithm (matches Twilio/SignalWire docs):
//   - For application/x-www-form-urlencoded: signature = base64(HMAC-SHA1(
//       secret, fullUrl + sortedKeys.map(k => k + values[k]).join('') ))
//   - For JSON / other bodies: signature = base64(HMAC-SHA1(secret, fullUrl + rawBody))
// Header: X-Twilio-Signature (SignalWire also accepts X-SignalWire-Signature)

import { createClient } from "npm:@supabase/supabase-js@2";

let warnedSkip = false;

export interface VerifyResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  rawBody: string;
  contentType: string;
  formParams?: Record<string, string>;
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function b64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

async function hmacSha1Base64(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64(sig);
}

function getFullUrl(req: Request): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const u = new URL(req.url);
  if (host) return `${proto}://${host}${u.pathname}${u.search}`;
  return req.url;
}

/**
 * Read the request body once and verify the SignalWire signature.
 * Always returns the raw body + parsed form params so callers don't re-read.
 */
export async function verifySignalWireRequest(req: Request): Promise<VerifyResult> {
  const contentType = req.headers.get('content-type') || '';
  const rawBody = await req.text();
  let formParams: Record<string, string> | undefined;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    formParams = {};
    for (const [k, v] of new URLSearchParams(rawBody).entries()) formParams[k] = v;
  }

  const secret = Deno.env.get('SIGNALWIRE_SIGNING_SECRET');
  if (!secret) {
    if (!warnedSkip) {
      console.warn('[signalwire-signature] SIGNALWIRE_SIGNING_SECRET not set — skipping verification');
      warnedSkip = true;
    }
    return { ok: true, skipped: true, rawBody, contentType, formParams };
  }

  const provided = req.headers.get('x-signalwire-signature')
    || req.headers.get('x-twilio-signature')
    || '';
  if (!provided) {
    return { ok: false, reason: 'missing_signature', rawBody, contentType, formParams };
  }

  const fullUrl = getFullUrl(req);
  let payload: string;
  if (formParams) {
    const keys = Object.keys(formParams).sort();
    payload = fullUrl + keys.map((k) => k + formParams![k]).join('');
  } else {
    payload = fullUrl + rawBody;
  }

  const expected = await hmacSha1Base64(secret, payload);
  if (!timingSafeEq(expected, provided)) {
    return { ok: false, reason: 'signature_mismatch', rawBody, contentType, formParams };
  }
  return { ok: true, rawBody, contentType, formParams };
}

/**
 * Best-effort: log a platform_issues row for failed verifications so ops sees abuse.
 * Fire-and-forget — never throws.
 */
export async function recordSignatureFailure(
  reason: string,
  meta: Record<string, unknown>,
): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const supabase = createClient(url, key);
    await supabase.from('platform_issues').insert({
      issue_type: 'signalwire_signature_failure',
      severity: 'high',
      status: 'new',
      title: 'SignalWire webhook signature failed',
      description: `Webhook rejected: ${reason}`,
      metadata: { reason, ...meta },
    });
  } catch (e) {
    console.error('[signalwire-signature] failed to record platform_issue', e);
  }
}
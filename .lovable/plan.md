## Goal
Add HMAC-SHA256 signature verification to all SignalWire-facing edge function webhooks, gated on a new `SIGNALWIRE_SIGNING_SECRET` so the rollout is safe (skip verify when unset, enforce once configured).

## Scope — webhooks to harden
1. `supabase/functions/voice-handler/index.ts`
2. `supabase/functions/voice-swaig/index.ts`
3. `supabase/functions/voice-post-prompt/index.ts`
4. `supabase/functions/missed-call-handler/index.ts`
5. `supabase/functions/sms-handler/index.ts`

## Implementation

### 1. New shared helper: `supabase/functions/_shared/signalwire-signature.ts`
- Export `verifySignalWireSignature(req, rawBody): Promise<{ ok: boolean; reason?: string; skipped?: boolean }>`
- Behavior:
  - If `SIGNALWIRE_SIGNING_SECRET` env var is **unset** → return `{ ok: true, skipped: true }` (preserves current behavior during rollout).
  - If set → compute HMAC-SHA256 over `url + rawBody` using Web Crypto `crypto.subtle`, base64-encode, compare in constant time against the `X-SignalWire-Signature` (or `X-Signature`) header.
  - URL: prefer `X-Forwarded-Proto` + `Host` + path to match what SignalWire signs; fall back to `req.url`.
- Log skip reason once per cold start (not per request) to avoid log noise.

### 2. Wire helper into each webhook
- Read raw body **once** (`await req.text()`), then parse from the string (current code reads `formData()` / `text()` directly — needs a small refactor to capture raw bytes first for HMAC).
- Call `verifySignalWireSignature(req, rawBody)`; if `ok === false`, return `403` with empty SWML/TwiML response (still 200-style XML for SignalWire? no — `403 Forbidden` is correct for invalid signatures, SignalWire retries on 5xx not 4xx, so this is safe).
- Insert `platform_issues` row (severity `high`, type `signalwire_signature_failure`, includes call_sid + from_number) on verification failure so ops sees abuse attempts.

### 3. Secret
- Add `SIGNALWIRE_SIGNING_SECRET` via `secrets--add_secret` after user approves the plan.
- Instructions: user pastes the **Webhook Signing Secret** from SignalWire Space → Settings → API.
- Until secret is added, all webhooks behave exactly as today (skipped verification, no breakage).

### 4. Verification
- Unit-level sanity: send a forged request without the header and confirm `403` once secret is set; without secret, confirm normal `200`.
- Confirm real inbound calls/SMS still flow after secret is set (smoke test in production).

## Out of scope
- No UI changes. No prompt or agent-logic changes. No new tables.
- Other Wave 2/3/4 items (cron extension RPC, REVOKE migrations, AFTER INSERT trigger on `companies`, etc.) — separate batch after this lands.

## Risks
- If user adds an **incorrect** signing secret, all SignalWire traffic will 403. Mitigation: env-gated default (skipped), explicit secret-add step, ability to delete the secret to revert to skipped mode instantly.
- Refactoring `formData()` → manual parse from raw text requires careful `application/x-www-form-urlencoded` parsing (use `new URLSearchParams(rawBody)`); JSON path stays as `JSON.parse(rawBody)`.

Reply **approve** to ship, or tell me to defer the secret-add step until after the code lands.

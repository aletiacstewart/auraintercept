## Review of Claude's recommendations

Claude's diagnosis is **partially outdated but the core concern is valid**:

- **`social-webhook` (FIX 2)** — already fixed. `supabase/functions/_shared/meta-webhook-signature.ts` exists and `social-webhook/index.ts` already calls `verifyMetaSignature(req, body)` on POST, rejecting bad signatures with 401. Nothing to do here.
- **`social-oauth-deauthorize` (FIX 3)** — still vulnerable. It calls `atob(payload)` on the payload half of `signed_request` and acts on `user_id` with no HMAC check. Anyone can forge a POST and deactivate any `social_accounts` row matching a guessed `platform_account_id`.
- **`social-oauth-data-deletion` (FIX 4)** — same shape, worse blast radius: it **deletes** `social_accounts` rows for the attacker-supplied `user_id`.
- **`META_APP_SECRET`** — needs to be present as a Supabase secret; otherwise the helper runs in warn-and-skip rollout mode (safe default, but not actually closing the gap).

Claude's proposed helper duplicates what already exists. Better to extend the existing file so we don't have two Meta-signature modules drifting apart.

## Plan

### 1. Extend `supabase/functions/_shared/meta-webhook-signature.ts`
Add a second exported function alongside the existing `verifyMetaSignature`:

- `verifyMetaSignedRequest(signedRequest: string)` → `{ ok, skipped?, reason?, payload? }`
  - Split on `.` into `[encodedSig, encodedPayload]`; reject malformed.
  - Base64url-decode the payload to JSON (always return the decoded payload so callers can log even in skip mode).
  - If `META_APP_SECRET` unset: warn once and return `{ ok: true, skipped: true, payload }` (matches the existing rollout behavior).
  - Otherwise HMAC-SHA256 the **raw `encodedPayload` string** with the app secret, base64url-decode the provided signature, compare with `timingSafeEq`.
  - Reuse the existing `timingSafeEq` / `hmacSha256Hex` helpers in the file.

No changes to the existing `verifyMetaSignature` export or to `social-webhook`.

### 2. Patch `supabase/functions/social-oauth-deauthorize/index.ts`
- Import `verifyMetaSignedRequest`.
- Replace the manual `signedRequest.split(".")` + `atob(payload)` block with a call to the helper.
- On `!verify.ok`: log the reason and return `200 { success: true }` (Meta requires 200), but **do not** touch `social_accounts`.
- On success, read `verify.payload?.user_id` and run the existing `update({ is_active: false, ... })` logic unchanged.

### 3. Patch `supabase/functions/social-oauth-data-deletion/index.ts`
- Same import + replacement pattern.
- On `!verify.ok`: log, mint a confirmation code, return the expected `{ url, confirmation_code }` JSON shape to Meta, but **do not delete** anything.
- On success, use `verify.payload?.user_id` for the existing delete.

### 4. Secret
- If `META_APP_SECRET` is not already stored, request it via `add_secret` after the code changes land. Until it's set, all three endpoints stay in warn-and-skip rollout mode.

### Files touched
- `supabase/functions/_shared/meta-webhook-signature.ts` (extend)
- `supabase/functions/social-oauth-deauthorize/index.ts`
- `supabase/functions/social-oauth-data-deletion/index.ts`

### Not touched
- `social-webhook/index.ts` — already verifies X-Hub-Signature-256.
- No frontend, DB, or config changes.

### Acceptance
- Forged `signed_request` POST to either OAuth callback → logged failure, no row updated/deleted, Meta still gets its expected 200 response shape.
- Real Meta-initiated deauthorization from a connected test app still deactivates the row.
- `META_APP_SECRET` unset → endpoints keep working, log a one-time skip warning (rollout-safe).

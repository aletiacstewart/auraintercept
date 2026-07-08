## Status vs. audit prompt

All four fixes are **already implemented** in the codebase from an earlier turn:

| Audit item | Status | Location |
|---|---|---|
| FIX 1 — Shared Meta signature helper | ✅ Done | `supabase/functions/_shared/meta-webhook-signature.ts` (exports `verifyMetaSignature` for X-Hub-Signature-256 and `verifyMetaSignedRequest` for the `signed_request` format). Env-gated on `META_APP_SECRET`; warn-and-skip when unset; timing-safe hex compare; correct base64url handling. |
| FIX 2 — `social-webhook` | ✅ Done | Line 41 reads raw body once, line 44 calls `verifyMetaSignature`. GET `hub.verify_token` handshake left untouched. |
| FIX 3 — `social-oauth-deauthorize` | ✅ Done | Line 23 calls `verifyMetaSignedRequest`; on failure returns `{ success: true }` 200 to Meta and skips the DB deactivate. |
| FIX 4 — `social-oauth-data-deletion` | ✅ Done | Line 24 calls `verifyMetaSignedRequest`; on failure returns the expected `{ url, confirmation_code }` 200 and skips the DB delete. |

Only two minor deltas vs. the prompt's exact wording:

1. `social-webhook` returns **401** on invalid signature (prompt suggested 403). Both are correct-behavior rejects; Meta itself just cares that we don't 200. Cosmetic — I'll normalize it to 403 to match the audit exactly.
2. The helper is named `verifyMetaSignature` / `verifyMetaSignedRequest` (prompt suggested `verifyMetaWebhookSignature`). Not renaming — that would churn imports for no functional gain.

## The actually load-bearing check: is `META_APP_SECRET` set?

None of the above closes the gap unless `META_APP_SECRET` is configured in the project's Cloud secrets. The helper explicitly `warn-and-skip`s when the env var is missing (safe rollout behavior). I'll verify presence with `fetch_secrets` in build mode. If missing, request it via `add_secret` — this is the Meta App Secret from Meta Developer dashboard → App Settings → Basic. Cannot be generated; must be pasted from Meta's UI.

## Plan

1. Verify `META_APP_SECRET` presence with `fetch_secrets`.
2. If missing: request it via `add_secret` (user pastes value from Meta dashboard). Explain where to find it in the message before the secret prompt.
3. Normalize `social-webhook` reject status from 401 → 403 to exactly match the audit's stated behavior (one-line edit).
4. Redeploy `social-webhook`. (No other function changes.)

## Files touched

- `supabase/functions/social-webhook/index.ts` — 401 → 403 on invalid-signature branch (one line).

Nothing else. `_shared/meta-webhook-signature.ts`, `social-oauth-deauthorize/index.ts`, and `social-oauth-data-deletion/index.ts` are already correct.

## Verification (after redeploy + secret set)

- `curl -X POST` to `social-webhook` with no `X-Hub-Signature-256` → 403.
- `curl -X POST` to `social-webhook` with a forged `sha256=deadbeef` header → 403.
- `curl -F "signed_request=badsig.eyJ1c2VyX2lkIjoiOTk5In0" ...` to `social-oauth-deauthorize` → 200 body `{"success":true}`, **no** `social_accounts` row flipped to `is_active=false`.
- Same forged POST to `social-oauth-data-deletion` → 200 with `{url, confirmation_code}`, **no** row deleted.
- Verify the existing GET `hub.verify_token` handshake on `social-webhook` still returns the challenge (untouched code path).

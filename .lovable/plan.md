## Security Hardening — Round 1 (final plan)

Confirmed with you:
- **Meta App Secret:** not configured. FIX 3 will be **scaffolded inactive** — helper file + wiring committed, but if `META_APP_SECRET` env var is missing the function logs a warning and continues (same pattern as `signalwire-signature.ts`). Nothing breaks. When you're ready to activate, add the secret and it turns on automatically.
- **`/talk-to-aura`:** stays public and functional. `elevenlabs-tts` keeps `verify_jwt = false`.

---

### FIX 2 — Dedupe `elevenlabs-tts` config
- Remove the FIRST `[functions.elevenlabs-tts]` block (`verify_jwt = true`) from `supabase/config.toml`.
- Keep the SECOND block (`verify_jwt = false`) so `/talk-to-aura` keeps working.
- Add lightweight abuse guard inside `elevenlabs-tts/index.ts`: simple per-IP in-memory rate limit (e.g. 20 req / 60s) + reject empty/whitespace text (already have 4000-char cap).

### FIX 1 — Lock down 8 cron-only functions
- Generate `CRON_SECRET` via `generate_secret`.
- Add `supabase/functions/_shared/cron-auth.ts` with `verifyCronSecret(req)` (checks `x-cron-secret` header against `Deno.env.get("CRON_SECRET")`, fails closed).
- Insert the check at the top of each handler (after CORS preflight):
  - `monthly-digest`, `quarterly-digest`, `weekly-digest`
  - `trial-reminders`, `cost-alerts`, `cron-health-check`
  - `appointment-reminders`, `lead-follow-up-reminders` (added — touch PII, currently unprotected)
- Migration that unschedules and re-registers those 8 cron jobs with the `x-cron-secret` header hardcoded in the SQL (same pattern already used for the anon key — Postgres GUC route isn't reliable on Lovable Cloud). The secret value in the migration will match `CRON_SECRET`.

### FIX 3 — Meta webhook signature verification (scaffolded, inactive)
- Add `supabase/functions/_shared/meta-webhook-signature.ts` mirroring `signalwire-signature.ts`: HMAC-SHA256 with `META_APP_SECRET`, timing-safe compare against `X-Hub-Signature-256`.
- Wire into `social-webhook/index.ts` POST branch, after reading the raw body.
- Guard behavior: if `META_APP_SECRET` is unset → log `[social-webhook] META_APP_SECRET not set — signature check skipped` and continue (so nothing breaks today). When you later add the secret, verification turns on and mismatches return 401.

### FIX 4 — `config.toml` cleanup (scoped)
- Remove only the 7 confirmed stale `[functions.*]` blocks: `create-demo-accounts`, `create-demo-customer`, `create-demo-employee`, `create-demo-trial`, `crm-adapter`, `send-walkthrough-demo`, `tts`.
- **Skip** adding entries for the 21 undocumented functions — they default to `verify_jwt = true` (secure); adding entries adds risk without benefit for this round.

### FIX 6 — `package.json` hygiene
- Move `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` from `dependencies` to `devDependencies`.

### FIX 5 — SKIPPED
Pure UI refactor of 3 install pages. No security or functional benefit. Bundle later if desired.

---

### Deliverables
- 2 new shared files: `_shared/cron-auth.ts`, `_shared/meta-webhook-signature.ts`
- 9 edge function edits: 8 cron functions + `social-webhook` + `elevenlabs-tts`
- 1 migration: re-register 8 cron jobs with `x-cron-secret` header
- 1 `config.toml` edit (remove 8 blocks — 7 stale + 1 duplicate)
- 1 `package.json` edit
- 1 new secret: `CRON_SECRET` (auto-generated)

### After deploy — verification
- `curl` each of the 8 cron functions with no `x-cron-secret` → expect `401`.
- Watch `cron.job_run_details` after next scheduled run → expect success.
- `elevenlabs-tts` still callable from `/talk-to-aura` with no auth.
- `social-webhook` still accepts Meta events (signature check inactive until secret added).

Approve to switch to build mode.

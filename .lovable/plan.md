# Deferred Items — Sequenced Follow-Up Plan

Four passes, executed in order. Each pass ends with a verification step before the next begins so regressions surface early.

---

## Pass 1 — DB Security (1.4 + 1.5)

**Goal:** Close storage-bucket enumeration and blanket `SECURITY DEFINER` `EXECUTE` grants without breaking public widget RPCs.

Steps:
1. Inventory: list every `storage.buckets` row and every `SECURITY DEFINER` function in `public` with its current `EXECUTE` grants.
2. Cross-reference each SECURITY DEFINER function against callers (widget code, edge functions, unauthenticated pages). Categorize:
   - **Keep public EXECUTE** — `get_company_public_info*`, `get_company_feature_flags`, `get_company_industry_pack`, `get_appointment_by_token`, `get_appointment_by_customer_token`, `get_company_calendar_feed_token` (already marked intentional).
   - **Restrict to `authenticated`** — anything only signed-in dashboards use.
   - **Restrict to `service_role`** — anything only edge functions use.
3. Single migration: `REVOKE EXECUTE ... FROM PUBLIC` on all SECURITY DEFINER functions, then targeted `GRANT EXECUTE` per the categorization above.
4. Storage: add RLS on `storage.buckets` denying anon `SELECT` (bucket listing) while keeping per-object policies intact.
5. Verify: run `supabase--linter` and `security--run_security_scan`, load public widget, public booking, customer portal, and unauthenticated smart-website pages.

Rollback: single migration is easily reverted if a widget breaks.

---

## Pass 2 — Stage 4 Color-Token Purge (~150 instances)

**Goal:** Replace hardcoded color utilities (`text-white`, `bg-black`, `bg-[#...]`, `rgba(...)`) with semantic tokens from `index.css` — per the Cyber-Sentry design standard.

Steps:
1. Scan: `rg -n "bg-\[#|text-\[#|border-\[#|#[0-9a-fA-F]{6}|rgba\(" src/` and bucket by file. `src/pages/Index.tsx` (~76) done first as a reference.
2. For each file, map raw values to existing tokens (`--primary`, `--secondary-accent`, `--background`, `--foreground`, `--muted`, etc.). Add new tokens to `index.css` only if truly missing.
3. Convert in batches of ~10 files, screenshot before/after via Playwright at 1280×1800 for the top routes (`/`, `/dashboard`, `/dashboard/ai-agent`, console pages).
4. Verify: visual diff each batch; confirm dark mode still reads correctly.

No functional/business-logic changes — presentation only.

---

## Pass 3 — 2.2 Price Strings in Prompts/Templates

**Goal:** Remove remaining hardcoded tier prices from long templated strings so `launchPricing.ts` remains the single source of truth.

Files:
- `src/pages/AIAgentGuide.tsx`
- `src/lib/subscriptionAgentConfig.ts`
- `src/lib/helpSystemPrompt.ts`
- `src/lib/auraInterceptSalesPrompt.ts`

Steps:
1. Read each file; identify every literal price/tier string.
2. Introduce a `buildPricingBlurb()` helper (or reuse existing one from `launchPricing.ts`) that returns the canonical text with strikethrough originals + beta sale + onboarding, per Core memory.
3. Replace inline strings with template interpolation of the helper output.
4. Verify: unit-snapshot each generated prompt; visit AIAgentGuide page and confirm rendered copy matches active `LAUNCH_PRICING`.

---

## Pass 4 — 5.3 AI Gateway Fallback Model Wiring

**Goal:** When the primary Lovable AI model returns 429/5xx, transparently retry against a fallback model of the same family before surfacing an error.

Steps:
1. Identify the shared AI-gateway call site (likely inside an edge function wrapper or `src/lib/*` helper — locate first).
2. Add a `MODEL_FALLBACK_CHAIN` map, e.g.:
   - `google/gemini-2.5-pro` → `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite`
   - `openai/gpt-5` → `openai/gpt-5-mini` → `openai/gpt-5-nano`
3. Wrap the call: on `429` (rate-limit) or `5xx`, log a `protocol_switch_event`, retry once with the next model in chain. Preserve original request shape.
4. Surface the actual model used in the response metadata so the console can show it.
5. Verify: unit-test the wrapper with a mocked 429; watch `ai_agent_logs` for a real switch event.

---

## Technical Notes

- Each pass produces its own migration/PR-equivalent so any single pass can be reverted independently.
- Pass 1 is the only one that touches the database. Passes 2–4 are code-only.
- After Pass 1, mark the stale scanner findings (`create-demo-trial`, `seed-demo-accounts-v2`) as ignored via `security--manage_security_finding` and update `@security-memory`.
- I'll check in after Pass 1 and Pass 2 before starting the next, since those have the highest regression risk.

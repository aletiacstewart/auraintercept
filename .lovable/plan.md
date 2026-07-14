## Goal
Make `landing-chat` (Message Aura) and the ElevenLabs "Talk to Aura" prompt derive prices from the same source as the rest of the app (`src/lib/launchPricing.ts`), so toggling Beta pricing or editing any tier number automatically flows into both channels — no more hardcoded `$497` / `$697` strings in the edge shared file.

## Current State
- `src/lib/launchPricing.ts` — canonical pricing (tiers, Beta flag, formatters).
- `src/lib/auraInterceptSalesPrompt.ts` — client mirror; already imports from `launchPricing.ts` dynamically. Used by the admin "Copy Talk to Aura sales prompt" button.
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts` — edge copy; **hardcodes** `$497/mo`, `$697`, `$994`, `$1,394`, `$1,988`, `$2,788`, `$3,979`, `$5,576`, annual totals, and the "$0 onboarding during Beta" line. Used by `landing-chat`.
- Risk: any future price change updates the voice channel automatically but leaves Message Aura quoting stale numbers.

## Refactor Plan

### 1. Create shared pricing module for Deno
New file: `supabase/functions/_shared/launch-pricing.ts`
- Port the minimal surface of `src/lib/launchPricing.ts` needed by the sales prompt:
  - `LAUNCH_PRICING` constant (active flag, tier list)
  - `TIER_PRICING` map (name, monthlyPrice, originalMonthlyPrice, onboardingPrice, originalOnboardingPrice, annualPrice)
  - Helpers: `getTierPricing(key)`, `formatPrice(cents-or-dollars)`, `formatSalesLine(key)`, `getAnnualPrice(key)`, `formatTierLabel(key)`
- Pure TypeScript, no framework imports — works in both Deno (`npm:` free) and node/vite.
- Keep numeric values in ONE place inside this file.

### 2. Make `src/lib/launchPricing.ts` re-export from the shared module
- Convert `src/lib/launchPricing.ts` into a thin re-export of the shared file via a Vite-friendly relative import (`../../supabase/functions/_shared/launch-pricing`).
- Confirm the existing public API (all named exports currently used across the app) is preserved 1:1 so no call sites need edits. If any helper lives only in the client file, move it into the shared module too.
- Verify Vite resolves the path (it does for plain `.ts` files under the project root; no build config change needed).

### 3. Refactor the edge shared prompt
Edit `supabase/functions/_shared/aura-intercept-sales-prompt.ts`:
- Import from `./launch-pricing.ts`.
- Rebuild the `KNOWLEDGE_BASE` pricing block using the same template shape as `src/lib/auraInterceptSalesPrompt.ts` (which already uses `formatSalesLine`, `getAnnualPrice`, `formatPrice`).
- Delete every hardcoded dollar figure. The Beta-on/Beta-off strike-through wording comes from `formatSalesLine`.
- Preserve everything else verbatim (SALES_PLAYBOOK, STYLE blocks, lead-handoff marker, guardrails).

### 4. Collapse the two prompt files (optional but recommended)
- Once step 2 lands, `src/lib/auraInterceptSalesPrompt.ts` and `supabase/functions/_shared/aura-intercept-sales-prompt.ts` will be near-identical. Convert the client file into a re-export of the shared edge file (same relative-import trick), so there is exactly ONE prompt source.
- Fall back to keeping them as twins (both importing shared pricing) if the cross-boundary import proves fragile in Vite — the important guarantee (single price source) is already met by step 3.

### 5. Verify
- Typecheck (`tsgo`) — catches any drift in exported names.
- Grep the repo for any remaining hardcoded tier dollar strings in prompts/PDFs to confirm nothing else silently duplicates pricing.
- Manual smoke: toggle `LAUNCH_PRICING.active = false` locally, confirm both the ElevenLabs copy button output AND a local `landing-chat` invocation quote the non-Beta numbers; flip back.

## Out of Scope
- No changes to KB narrative, playbook, guardrails, or voice/text STYLE blocks.
- No pricing number changes.
- No changes to PDFs, marketing pages, or Stripe price IDs.
- No new operative / agent count changes.

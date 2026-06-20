
## Goal

Unify every demo/trial surface under one offer:

- **Live Demo — 60 days** (30 days concierge onboarding + 30 days fully live use)
- Onboarding fee due at start (existing rule, unchanged)
- No more "24-hour demo", "14-day trial", "90-day trial", "Free Trial", or "No credit card required" anywhere

Keep the canonical "30 + 30" structure (memory unchanged).

---

## 1. Backend — extend sandbox demo to 60 days

`demo_trials` records currently expire at +24h.

- **Migration** — update default `expires_at` for new demo_trials rows to `now() + interval '60 days'`. Backfill existing un-expired rows to +60 days from `created_at`. Update any cron/cleanup function that hard-deletes at 24h to use 60 days.
- **`supabase/functions/seed-demo-accounts-v2/index.ts`** — change the 24h expiry constant to 60 days.
- **`supabase/functions/send-walkthrough-demo/index.ts`** — replace 24h copy with 60-day copy in the welcome email body.
- **`src/components/common/DemoExpiryBanner.tsx`** + **`src/hooks/useDemoSession.ts`** — update banner math/labels from "24 hours" / "Xh remaining" to "60 days" / "Xd remaining".

## 2. Edge functions — purge "free trial" wording

- **`supabase/functions/trial-reminders/index.ts`** — rewrite subjects/bodies: drop "free trial", "90-day", switch to "60-Day Live Trial"; reminder cadence stays 14/7/1 (memory standard).
- **`supabase/functions/submit-onboarding/index.ts`** — already says "60-Day Live Trial"; sweep remaining "free" mentions.
- **`supabase/functions/send-company-welcome/index.ts`**, **`resend-webhook/index.ts`**, **`check-unsubscribe-alerts/index.ts`**, **`ai-agent-chat/index.ts`**, **`voice-handler/index.ts`**, **`voice-booking-agent/index.ts`**, **`social-oauth/index.ts`** — replace stray "24-hour demo", "free trial", "90-day" strings with the unified wording.

## 3. Legacy SQL migration (overwrite old FAQ/AI prompt seeds)

New migration (`*_unify_trial_copy.sql`) that runs `UPDATE` statements against:

- `faqs` — rewrite any answer containing "90-day", "free trial", "no credit card" to the 60-Day Live Trial wording.
- `companies.ai_agent_prompt`, `companies.about_paragraph` — rewrite the Aura Intercept tenant rows (and any other rows still holding the legacy 90-day pricing string) to current pricing + "60-Day Live Trial".
- `industry_template_packs` / `industry_blueprints` — sweep any pricing/trial copy fields with the same patterns.

(Pure data-fix migration; no schema changes; no GRANT changes.)

## 4. Frontend marketing & dashboard copy

Search-and-replace pass across these files (copy-only edits, no logic changes):

**Demo / sandbox rebrand (24-hour → Live Demo · 60 days):**
- `src/components/marketing/StartDemoDialog.tsx` (dialog title, toast, footer line)
- `src/components/marketing/DemoCredentialsCard.tsx` (share blurb, expiry note)
- `src/components/marketing/IndustryHero.tsx` ("Full access for 24 hours" → "Full access for 60 days")
- `src/components/marketing/IntegrationStatusPanel.tsx`
- `src/pages/ForBusiness.tsx` (hero meta description, CTA buttons, value-prop line)
- `src/pages/DemoAccess.tsx` (page subtitle if present)

**Trial copy normalization (90-day / 14-day / "Free Trial" → 60-Day Live Trial):**
- `src/locales/es/common.json` — `"startFreeTrial": "Prueba en vivo de 90 días"` → `"Prueba en vivo de 60 días"`
- `src/locales/en/auth.json` — "Start your free trial in 60 seconds" → "Start your 60-Day Live Trial in 60 seconds"
- `src/pages/TermsOfService.tsx` — "Free Trial" heading + body lines retain mechanics but drop "Free" wording
- `src/pages/Subscription.tsx` — "No credit card required" line removed; "Unlocks a 60-day free trial" → "Unlocks the 60-Day Live Trial"
- `src/pages/Help.tsx` — "What's included in the free trial?" → "What's included in the 60-Day Live Trial?"
- `src/pages/SignUp.tsx`, `src/pages/Index.tsx`, `src/pages/Contact.tsx`, `src/pages/PublicOnboardingIntake.tsx`, `src/pages/AgentDetailPage.tsx`, `src/pages/SpecialistOperativesConsole.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/DesignPreview.tsx`, `src/pages/SmartWebsite.tsx` — sweep stray "Free Trial" / "no credit card" / "14-day" / "90-day".
- `src/lib/auraInterceptSalesPrompt.ts`, `src/lib/subscriptionAgentConfig.ts`, `src/lib/industryFastStartQuestions.ts`, `src/lib/industryMarketingContent.ts`, `src/lib/industryMarketingPlaybooks.ts`, `src/lib/industryWorkflows.ts`, `src/lib/integrationOnboardingData.ts` — same sweep.
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts` — mirror sales prompt edit.
- `public/llms.txt` — already correct, double-check.

## 5. PDFs / documentation

Update copy in:
- `PlatformFAQPDF.tsx`, `PlatformDocumentPDF.tsx`, `CompanyOnboardingPDF.tsx`
- `WebsiteCopyPDF.tsx` ("Ready in 24 Hours" → "Live in 60 days")
- `VideoScriptsPDF.tsx`, `SocialMediaContentPackPDF.tsx`, `SalesPitchDataPDF.tsx`, `IndustryMarketingKitPDF.tsx`, `MarketingSalesMasterPDF.tsx`, `PricingSummaryPDF.tsx`
- `src/pages/VideoPromptsPage.tsx`

Replacement table:

```text
24-hour demo / 24h demo         -> Live Demo (60 days)
24 hours. Full access.          -> 60 days. Full access.
Free Trial / free trial         -> 60-Day Live Trial
Start your free trial           -> Start your 60-Day Live Trial
Start Free Trial                -> Start Live Trial
90-day free trial / 90 day      -> 60-Day Live Trial
14-day trial                    -> 60-Day Live Trial
No credit card required         -> (remove line)
```

(Skip purely-functional "24 hours" strings: business-hours editors, reminder windows, alert windows, hashtag `#24HourService`, "within 24 hours" support SLA, calendar sync delay text. These are not trial copy.)

## 6. Verification

- `rg -ni "free trial|24-hour demo|14-day trial|90-day|no credit card required" src public supabase` returns zero non-functional hits.
- Manual visual check via Playwright on `/`, `/for-business`, `/subscription`, `/help`, `/terms`, `/sign-up`, `/demo-access/<id>`.
- TypeScript build passes.

## Out of scope

- Pricing/tier values, Stripe price IDs, RBAC, schema changes.
- Onboarding window stays "30 days concierge + 30 days live" (per your answer).
- Functional 24-hour windows (alerts, reminders, business hours) remain untouched.
- Spanish copy beyond the one `common.json` key flagged above.

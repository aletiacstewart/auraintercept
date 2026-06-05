## Goal

Change the standard trial from **90 days (30 onboarding + 60 live)** to **60 days (30 onboarding + 30 live)** across the database, app code, PDFs, marketing pages, terms, and memory.

## Source of truth

1. **DB default** — new migration on `public.companies.trial_ends_at`:
   - `ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '60 days')`
   - Active trials whose `trial_ends_at > now() + interval '60 days'` get clamped down to `created_at + interval '60 days'` (so accounts created under the 90-day promise lose the extra 30 days they hadn't yet used; older trials already under 60d remain untouched).
2. **TrialBanner.tsx** — `totalDays = 60`, copy update.
3. **trial-reminders edge function** — change "90-day free trial" wording in the 7-day reminder email/SMS subject + body to "60-day Live Trial".

## Code copy sweep (text-only, no logic changes besides item 1–3)

Replace every visible "90-Day Live Trial / 90-day trial / 90 days / first 30 days = onboarding, then 60 days of full live use" with the new framing **"60-Day Live Trial (30 days onboarding + 30 days full live use)"**:

- `src/components/dashboard/TrialBanner.tsx`
- `src/components/audit/AuditChecklistPDF.tsx` (3 spots)
- `src/components/audit/AuditResults.tsx`
- `src/components/documentation/CompanyOnboardingPDF.tsx` (5 spots incl. consent line)
- `src/components/documentation/MarketingSalesMasterPDF.tsx` (8 spots incl. FAQ "billing begins after day 90" → "day 60", "60–90 days to self-serve" stays as competitor framing)
- `src/components/documentation/PlatformDocumentPDF.tsx` (10 spots incl. all 4 tier blocks)
- `src/components/documentation/PlatformFAQPDF.tsx` (4 spots)
- `src/components/documentation/PricingSummaryPDF.tsx` (5 spots: hero + 4 tier blocks)
- `src/components/documentation/SalesPitchDataPDF.tsx`
- `src/components/documentation/SocialMediaContentPackPDF.tsx`
- `src/components/documentation/VideoScriptsPDF.tsx`
- `src/components/documentation/WebsiteCopyPDF.tsx`
- `src/components/documentation/ComprehensiveGuidesPDF.tsx`
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`
- `src/components/subscription/CurrentPlanChip.tsx`
- `src/components/layout/PublicFooter.tsx`, `PublicHeader.tsx`
- `src/components/marketing/DemoCredentialsCard.tsx`, `StartDemoDialog.tsx`
- `src/components/onboarding/FastStartWizard.tsx`
- `src/pages/Index.tsx`, `About.tsx`, `Contact.tsx`, `Subscription.tsx`, `Auth.tsx`, `DemoAccess.tsx`, `Help.tsx`, `TermsOfService.tsx`, `PublicOnboardingIntake.tsx`, `AIAgentsHub.tsx`, `PlatformGuides.tsx`, `ExportDocumentation.tsx`
- `src/locales/en/auth.json`, `en/common.json`, `en/marketing.json`, `es/common.json` (any "90" trial strings)
- `supabase/functions/submit-onboarding/index.ts` (onboarding receipt email body)
- `supabase/functions/trial-reminders/index.ts` (reminder subject)
- `public/llms.txt`

Each replacement uses a single short phrasing:
> "60-Day Live Trial — first 30 days dedicated to concierge onboarding, then 30 days of full live use."

Out of scope (leave 90 unchanged): analytics-form "Last 90 days" date filters, "inactive_90_days" customer segment, appointment 90-day token window, mermaid/historical-trend "90 days ago" labels, demo trial (`TRIAL_HOURS = 48`).

## Memory updates

- `mem://product/trial-period-standard` — rewrite as 60-day standard (30 + 30), update math notes.
- `mem://index.md` Core line — change "90-Day Live Trial" → "60-Day Live Trial (30d onboarding + 30d full live use)" and update the progress-bar formula to `(60 - daysRemaining)/60`.

## Database migration (technical)

```sql
ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '60 days');

-- Clamp any active trial that's still longer than 60d from creation
UPDATE public.companies
SET trial_ends_at = created_at + interval '60 days'
WHERE trial_ends_at IS NOT NULL
  AND trial_ends_at > now()
  AND trial_ends_at > created_at + interval '60 days';
```

## Verification

1. Migration applies cleanly; spot-check one demo company shows new `trial_ends_at`.
2. `rg -n "90.?day|90 day|90-Day" src supabase/functions public/llms.txt` returns only the allow-listed survivors (analytics filters, segment name, token window, "60–90 days to self-serve" competitor line).
3. Build passes; TrialBanner shows correct progress with `totalDays = 60`.
4. Open Subscription, Index, Auth, TermsOfService pages — copy reads "60-Day Live Trial".

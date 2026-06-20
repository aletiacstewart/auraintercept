## Audit Results

I scanned every PDF generator under `src/components/documentation/` plus `public/llms.txt`, `src/locales/en/marketing.json`, and the AI prompt files (`helpSystemPrompt.ts`, `auraInterceptSalesPrompt.ts`, `subscriptionAgentConfig.ts`).

**Good news — already correct everywhere checked:**
- Pricing: all 16 PDFs use the current Beta numbers ($497 / $994 / $1,988 / $3,979) with the original prices ($697 / $1,394 / $2,788 / $5,576) properly shown as strikethrough/"was" callouts.
- Trial: every PDF uses "60-Day Live Trial" with the 30-day onboarding + 30-day live-use split. No "90-day" trial language remains in any PDF, page, or prompt.
- Onboarding fees: all PDFs show the per-tier 50%-off onboarding ($249 / $497 / $994 / $1,990) with strikethrough originals.
- Tier names: no legacy "Starter / Connect / Performance / Command" names leaked into customer-facing PDFs.

**Stale items I did find (only 2):**

1. **`PlatformFAQPDF.tsx` line 470-471** — the "What happens when my trial ends?" answer says: *"You'll receive email reminders at 30 days, 7 days, and 1 day before trial expiration."* That reminder cadence was written for the old 90-day trial. For a 60-day trial it should be **14 days, 7 days, and 1 day**.

2. **`industryMarketingContent.ts` line 308** — *"Aura nudges automatically over 30/60/90 days"* — this is about cold-lead nudging cadence, **not** trial length, so it's actually fine. Leaving as-is unless you want it changed.

(Note: `MarketingSalesMasterPDF.tsx` mentions "60–90 days to self-serve" — that's an objection-handling line about how long DIY setup takes, not trial length. Leaving as-is.)

## Plan

Single one-line fix:

- **`src/components/documentation/PlatformFAQPDF.tsx`** — change the trial-ending reminder cadence from `"30 days, 7 days, and 1 day"` to `"14 days, 7 days, and 1 day"` so it matches the 60-Day Live Trial.

That's the only stale doc content I found. After approval I'll apply the edit and re-grep all PDFs to confirm zero remaining "90-day trial" / old-pricing references.

If you also want me to:
- (a) rewrite the "30/60/90 days" cold-lead nudge line in `industryMarketingContent.ts`, or
- (b) re-render any specific PDF for visual QA,

say the word and I'll add it to the fix.

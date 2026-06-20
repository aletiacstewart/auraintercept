# Add "Why Do I Need My Own Accounts?" Explainer

Add the new explainer (short answer + cost table + competitor comparison + 6-question mini-FAQ) to the FAQ PDF, the Company Onboarding PDF, the Integration Onboarding PDF, and the signup flow so prospects and new customers see the same answer everywhere it's asked.

## Where it lands

1. **`src/components/documentation/PlatformFAQPDF.tsx`** — Section 7 (Billing) or new "Why Your Own Accounts?" subsection right after the existing third-party cost FAQ (~line 492). Adds:
   - A "Why do I need my own accounts for SignalWire, ElevenLabs, and Resend?" anchor Q&A with the short answer
   - "What this actually costs" provider table (SignalWire / ElevenLabs / Resend / total + one-time 10DLC note)
   - "How this compares" 3-column table (AuraIntercept vs ServiceTitan vs Jobber) for phone, AI receptionist, marketing, transparency
   - The 6 follow-up Q&As (why not bundle / extra setup / low volume / high volume / switch providers / do you mark up)

2. **`src/components/documentation/CompanyOnboardingPDF.tsx`** — Insert a "Why You Hold These Accounts" page right before the existing Third-Party Provider Accounts section (~line 638 / 912). Same short answer + cost table + comparison + condensed 3-question FAQ (skip the duplicates already covered in their consent block).

3. **`src/components/documentation/IntegrationOnboardingPDF.tsx`** — Add a 1-page intro at the top reusing the short answer + cost table only (the per-provider setup steps already exist below).

4. **Signup / Index page** — In `src/pages/Index.tsx`, add a collapsible "Why my own accounts?" disclosure inside (or directly below) the consolidated BETA / 3rd-Party card, linking to the same short answer + cost table. Keeps the marketing page in sync without bloating it.

## Content normalization

- Use existing `LAUNCH_PRICING` / canonical tier names — no new pricing.
- Keep approved third-party language ("billed directly by the provider", "your own account", "we never mark up"). Do not use "bundled / overage / absorbed" per the third-party fee policy.
- Competitor table is labeled "as of public pricing, June 2026 — verify with vendor" footnote to stay defensible.
- Reuse `sanitizePdfText`, `BulletPoint`, and existing table styles in each PDF — no new components.

## Out of scope

- No changes to Stripe pricing, tier definitions, or the consent/legal checkboxes.
- No new routes, no edge functions, no schema changes.
- Spanish translation not added in this pass (existing PDFs are English-only).

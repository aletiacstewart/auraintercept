
## Goal
Bring the homepage, signup flow, and every generated PDF/guide in line with the new pricing & integration sheet.

## Canonical values to roll out

**Onboarding Fee (one-time, due at start of 60-Day Live Trial, non-refundable once onboarding begins):**
- Core $497 · Boost $697 · Pro $1,197 · Elite $2,197
- Covers: account config, AI agent setup, knowledge-base build-out, 3rd-party activation (SignalWire, ElevenLabs, Resend), A2P 10DLC compliance filing, initial training session.

**Trial:** 60-Day Live Trial (replacing all 90-day language). Progress math becomes `(60 - daysRemaining)/60`.

**Resend — Email:** 3,000 emails/mo included, 100/day, monthly reset (no rollover), custom domain recommended. Pay-as-you-go beyond 3,000: $0.90 per 1,000 transactional emails, auto-charged. Automations: first 10,000 runs free, then $0.0015/run. Email warm-up required for bulk >5,000/send. Valid company credit card required.

**Tavily — AI Research:** 1,000 credits/mo included (no rollover). Credit usage: Search Basic 1/query, Advanced 2/query; Extract Basic 1/5 URLs, Advanced 2/5; Map Basic 1/10 URLs, With Instructions 1/5 URLs; Crawl = Map + Extract. Pay-as-you-go beyond: $0.008/credit. API key configured during onboarding. Valid company credit card required.

**A2P 10DLC — US SMS Compliance (customer pass-through):**
- Brand registration $4.50 (one-time)
- Standard campaign fee — varies by use case, **first 3 months charged upfront**
- Monthly campaign maintenance fee applies
- T-Mobile $250/mo pass-through fee for any inactive campaign (no SMS in 60+ days)
- Approval timeline: brand 1–3 days, campaign 3–15 business days (1–4 weeks total). SMS activates on FCC approval.
- Customer provides EIN, DBA (if applicable), LLC/Inc documentation.

**Google Calendar:** Free, all tiers, OAuth, bidirectional sync, multiple team-member calendars, iCal supported. No upgrade needed.

**Social Media (FB/IG/LinkedIn/TikTok):** OAuth, free connection, all tiers. Core = manual Bridge posting. Boost/Pro/Elite = automated scheduling via Social Scheduler Agent, up to 6 platforms.

**Stripe — Payments:** Customer's own Stripe account; 2.9% + $0.30 per successful transaction paid directly to Stripe. Required for Invoice Agent on Elite. Volume discounts negotiated by customer directly with Stripe (>$80K/mo).

**Embeddable Chat Widget — Message Aura (Text):** All tiers, no usage limits, copy-paste embed.

## Files to update

**Homepage / signup**
- `src/pages/Index.tsx` — onboarding-fee block, integration cards (Resend, Tavily, A2P, Calendar, Stripe, Chat Widget), 10DLC notice, footer disclaimer.
- `src/pages/Auth.tsx` — onboarding-fee values in tier cards (lines ~1456, 1503), 3rd-party cost grid (line ~997–1004), Resend description (~1052), 10DLC notice (~858–865), trial copy.
- `src/components/landing/PricingComparisonTable.tsx` — Implementation Fee row, A2P/Tavily/Resend/Stripe/Calendar rows.

**PDFs / guides**
- `src/components/documentation/PricingSummaryPDF.tsx` — full overhaul of fee table, per-tier cards, implementation-fee column, 3rd-party cost rows.
- `src/components/documentation/ComprehensiveGuidesPDF.tsx` — Resend section, onboarding-fee mentions.
- `src/components/documentation/CompanyOnboardingPDF.tsx` — Resend row + onboarding fee.
- `src/components/documentation/CompanyGuidesPDF.tsx` — Resend integration section.
- `src/components/documentation/AIAgentGuidesPDF.tsx` — Resend cost line, integration glossary.
- `src/components/documentation/PlatformDocumentPDF.tsx` — bundled-providers note.
- `src/components/documentation/PlatformFAQPDF.tsx` — Q&A entries about Resend, 10DLC, Stripe, integration costs, getting started.
- `src/components/documentation/WebsiteCopyPDF.tsx` — any pricing/trial references.
- `src/components/audit/AuditChecklistPDF.tsx` — trial-length references.

**Integration setup guides (in-app)**
- `src/components/integrations/ResendSetupGuide.tsx` — replace Free Tier text with new pay-as-you-go pricing.
- `src/components/integrations/TavilySetupGuide.tsx` — credit usage breakdown + $0.008/credit overage.
- `src/components/integrations/SignalWireSetupGuide.tsx` — A2P 10DLC pass-through fees.
- `src/components/integrations/CostCalculator.tsx` + `CostCalculatorHelp.tsx` — recompute with new Resend / Tavily / 10DLC values.
- `src/pages/integrations/EmailIntegration.tsx`, `TavilyIntegration.tsx`, `CalendarIntegration.tsx` — descriptive copy.
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx` — refresh pass-through cost list.

**Trial conversion (60-day)**
- `src/hooks/useDemoSession.ts` and any `90-day` / `(90 -` math → 60.
- `src/pages/Auth.tsx`, `src/pages/Index.tsx`, marketing locales (`src/locales/en|es/marketing.json`, `dashboard.json`, `auth.json`) — replace "90-day" with "60-day Live Trial".
- Subscription progress bar component (search `90 -`).

## Memory updates (after implementation)
- `mem://product/trial-period-standard` → rename to "60-Day Live Trial Standard"; update math.
- `mem://legal/third-party-fee-disclaimer` → reverse the "no carrier-fee disclaimers" rule: A2P 10DLC + Stripe ARE customer-pass-through; SignalWire/ElevenLabs/Resend/Tavily remain bundled UP TO the included limits, with documented pay-as-you-go beyond.
- `mem://marketing/pricing/canonical-four-tier-model` → add onboarding-fee constants $497/$697/$1,197/$2,197.
- Update `mem://index.md` Core lines on Trial and 3rd-Party Usage to reflect overage pricing.

## Out of scope
- No DB schema changes or Stripe price recreation (subscription tier monthly prices unchanged).
- No new pages or new PDFs — content updates only.
- Edge functions and billing logic untouched.

## Verification
- After edits, `rg` for `\$397`, `\$697 implementation`, `90-day`, `90 -`, `Free up to 3,000`, `1,000 searches`, `$4\+\$15`, `$10/mo` to ensure no stale strings remain.
- Spot-check rendered home page and Auth signup tier cards in preview.
- Regenerate one PDF (PricingSummaryPDF) via `/export-docs` and visually QA.

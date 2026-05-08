# Continue: Remaining PDFs & Integration Guides

## Canonical values (already approved)
- Onboarding (one-time, due at start of 60-Day Live Trial): Core $497 · Boost $697 · Pro $1,197 · Elite $2,197
- Trial: 60-Day Live Trial (math `(60 - daysRemaining)/60`)
- Resend: 3,000 emails/mo bundled · $0.90 per 1,000 overage · 100/day default cap · monthly reset · $0.0015/run only when >10,000 runs
- Tavily: 1,000 credits/mo bundled · $0.008/credit overage (Search/Extract/Map credits)
- A2P 10DLC (customer pass-through): $4.50 brand fee · variable campaign fees (3 months upfront) · $250/mo T-Mobile inactive-campaign fee · 1–4 week approval
- Google Calendar: free, bidirectional, iCal
- Stripe: customer's own account, 2.9%+$0.30, volume discounts
- Chat Widget: all tiers, no usage limits

## Files to update

### PDFs
- `src/components/documentation/ComprehensiveGuidesPDF.tsx` — Resend section (3,000/mo bundled + $0.90/1k overage), Tavily section (1,000 credits + $0.008 overage)
- `src/components/documentation/CompanyOnboardingPDF.tsx` — replace "BUNDLED, no extra fees" lines with bundled limits + overage; change "90 days" copy to "60 days"
- `src/components/documentation/CompanyGuidesPDF.tsx` — Resend + Tavily sections (limits, overage, monthly reset)
- `src/components/documentation/AIAgentGuidesPDF.tsx` — sweep for stale onboarding fees / 90-day / Resend / Tavily strings

### Integration setup guides
- `src/components/integrations/ResendSetupGuide.tsx` — bundled 3,000/mo, $0.90/1k overage, 100/day cap, monthly reset, $0.0015/run >10k
- `src/components/integrations/TavilySetupGuide.tsx` — bundled 1,000 credits/mo, $0.008/credit overage, credit types (Search/Extract/Map)
- `src/components/integrations/SignalWireSetupGuide.tsx` — A2P 10DLC: customer pass-through; $4.50 brand, variable campaign fees (3 mo upfront), $250/mo T-Mobile inactive, 1–4 week approval
- `src/components/integrations/CostCalculator.tsx` + `CostCalculatorHelp.tsx` — update Resend constants (3,000 free, $0.90/1k overage); ensure Tavily 1,000 credits + $0.008
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx` — refresh Resend/Tavily/A2P entries with new numbers and pass-through framing

### Integration pages
- `src/pages/integrations/EmailIntegration.tsx` — bundled limits + overage hint
- `src/pages/integrations/TavilyIntegration.tsx` — change "1,000 Free Searches" card to "1,000 Credits/mo Bundled" + overage line
- `src/pages/integrations/CalendarIntegration.tsx` — confirm free/bidirectional copy
- `src/pages/Integrations.tsx` — note line for Tavily ("1,000 credits/mo bundled · $0.008/credit overage")
- `src/pages/PlatformGuides.tsx` — Resend + Tavily list items

### Misc sweeps
- Run `rg` for `90[- ]day`, `$397`, `$697 onboarding`, `Free up to 3,000`, `1,000 free searches`, `1,000 searches/month` and patch any stragglers in `Help.tsx`, `Architecture.tsx`, `PlatformGuides.tsx`, `TermsOfService.tsx`, `PrivacyPolicy.tsx`, `demoFeatureStatus.ts`.

## Memory updates
- `mem://product/trial-period-standard` → 60-Day Live Trial
- `mem://legal/third-party-fee-disclaimer` → A2P 10DLC + Stripe are customer pass-through; Resend/Tavily/SignalWire/ElevenLabs bundled up to limits, then overage
- `mem://marketing/pricing/canonical-four-tier-model` → onboarding fee constants ($497/$697/$1,197/$2,197)
- Update `mem://index.md` Core lines on Trial and 3rd-Party Usage (currently say "90-day" and "no extra fees")

## Out of scope
- Stripe price recreation, edge functions, billing logic, DB schema

## Verification
- `rg` sweeps for: `90-day`, `90 day`, `$397`, `Free up to 3,000`, `1,000 free`, `1,000 searches`, `Aura pays 100%` → expect zero stale matches
- Spot-check `/dashboard/integrations/email`, `/dashboard/integrations/tavily`, `/dashboard/integrations/sms` in preview
- Regenerate ComprehensiveGuides PDF via `/export-docs` and visually QA cover, pricing, and integration sections
